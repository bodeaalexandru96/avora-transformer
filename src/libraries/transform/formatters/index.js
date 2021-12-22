import _ from 'lodash';
import currencyFormatter from './currency.format';
import trendCurrencyFormatter from './trend-currency.format';
import customFormatter from './custom.format';
import dateFrequencyFormatter from './date-frequency.format';
import dateFormatter from './date.format';
import durationFormatter from './duration.format';
import formatGuesser from './format-guesser';
import numericFormatter from './numeric.format';
import percentFormatter from './percent.format';
import stringFormatter from './string.format';

const formatters = {
    dateFormatter,
    durationFormatter,
    dateFrequencyFormatter,
    numericFormatter,
    customFormatter,
    stringFormatter,
    percentFormatter,
    currencyFormatter,
    trendCurrencyFormatter,
};

export default {
    ...formatters,
    formatGuesser,
    guessAndFormat(title = null, value, decimals, organisation, existingFormat = null, symbol = null, isMetric = true) {
        const format = existingFormat || formatGuesser(title, value);
        switch (format) {
            case 'numeric':
                return numericFormatter(value, decimals, organisation, isMetric);
            case 'percentage':
                return percentFormatter(value, decimals, organisation);
            case 'currency':
                return currencyFormatter(value, symbol, decimals, organisation);
            case 'date':
                return this.isDateAndTime(value) ? value : dateFormatter(value, organisation);
            case 'time':
                return durationFormatter(value, organisation);
            default:
                return value;
        }
    },

    // if we have a custom rule with decimals number, we will format the number
    // the value received can be one of the formats:
    // {CURRENCY-SYMBOL NEGATIVE-SIGN number}
    // {CURRENCY-SYMBOL OR NEGATIVE-SIGN number}
    // {NEGATIVE-SYMBOL number PERCENT}
    // {number PERCENT}
    // {simple number, like 5}
    // {number with comma separator, like 5,264.333}
    formatDecimals(value, decimals, org) {
        if (!value && value !== 0) value = null;

        if (!_.isString(value)) return value;

        const number = this.numberGetPrefixSuffix(value);
        number.value = numericFormatter(number.value, decimals, org);
        return `${number.prefix}${number.value}${number.suffix}`;
    },

    numberGetPrefixSuffix(value, returnAsString = null) {
        if (!value && value !== '0') return {};

        const number = {
            value,
            prefix: '',
            suffix: '',
        };

        number.value = value.replace(/[^0-9\.-]+/g, '');

        // In case there is no number returned we convert it to NaN object
        if (number.value === '') number.value = NaN;

        value = value.replace(/,/g, '');
        number.value = Math.abs(number.value);

        const prefixSuffix = value.split(number.value);

        number.prefix = prefixSuffix.length === 2 ? prefixSuffix[0] : '';
        number.suffix = prefixSuffix.length === 2 ? prefixSuffix[1] : '';

        if (number.prefix && number.prefix[number.prefix.length - 1] === '-') { // if we have {symbol}{negative-sign} => we need to change and have {negative-sign}{symbol}
            number.prefix = `${number.prefix[number.prefix.length - 1]}${number.prefix.substring(0, number.prefix.length - 1)}`;
        }

        // Remove all zero and dot characters from the beginning of suffix. This happens
        // because Math.abs() converts 18.10 to 18.1 and 0 is becoming a part of suffix
        // or it converts 18.00 to 18 and .00 is becoming a part of suffix
        number.suffix = _.trimStart(number.suffix, '.0');
        number.value = _.isNaN(Number(number.value)) ? number.value : number.value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','); // insert comma back (default behav)

        if (returnAsString) {
            return `${number.prefix}${number.value}${number.suffix}`;
        }

        return number;
    },

    isDateAndTime(value) {
        if (!value) return value;
        let isDateAndTime = false;
        const dateTimeSplit = value.toString().split(' ');

        if (dateTimeSplit.length === 2) {
            const partOne = dateTimeSplit[0];
            const partTwo = dateTimeSplit[1];

            // case when we could have date format 'dd/MM/yyyy' or 'dd.MM.yyy' and we are going to use date as string with this format
            // case when we could have time format 'hh:mm/ss' and we are going to use time as string with this format
            const dateDashFormat = /[0-9]{2}[/][0-9]{2}[/][0-9]{4}$/;
            const datePointFormat = /[0-9]{2}[.][0-9]{2}[.][0-9]{4}$/;
            const timeFormat = /[0-9]{2}[:][0-9]{2}[:][0-9]{2}$/;

            if ((dateDashFormat.test(partOne)
                || dateDashFormat.test(partTwo)
                || datePointFormat.test(partOne)
                || datePointFormat.test(partTwo))
                && (timeFormat.test(partOne) || timeFormat.test(partTwo))) {
                isDateAndTime = true;
            } else {
                isDateAndTime = false;
            }
        } else {
            isDateAndTime = false;
        }

        return isDateAndTime;
    },
};
