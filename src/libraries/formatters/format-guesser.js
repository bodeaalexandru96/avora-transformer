/* eslint-disable no-restricted-globals */
import _ from 'lodash';
import moment from 'moment';

function shouldBeFormatedAsDuration(columnTitle, value) {
    let shouldBeFormatted = false;
    const stringsThatMightBeDates = ['duration'];

    if (columnTitle) {
        // If we have a column name, we will check by if it contains date parts
        _.each(stringsThatMightBeDates, (str) => {
            if (columnTitle.toLowerCase().includes(str) && moment(value).isValid()) {
                shouldBeFormatted = true;
            }
        });
    }

    return shouldBeFormatted;
}

function shouldBeFormatedAsDate(columnTitle, value) {
    let shouldBeFormatted = false;
    const stringsThatMightBeDates = ['date', 'dob'];

    if (columnTitle) {
        // If we have a column name, we will check by if it contains date parts
        _.each(stringsThatMightBeDates, (str) => {
            try {
                if (columnTitle.toLowerCase().includes(str) && moment(value).isValid()) {
                    shouldBeFormatted = true;
                }
            } catch (e) {
                console.log('error');
            }
        });

        // case when we could have date format 'dd/MM/yyyy' and we are going to use date as string with this format
        const dateFormat = /[0-9]{2}[/][0-9]{2}[/][0-9]{4}$/;

        if (!stringsThatMightBeDates.includes(columnTitle) && dateFormat.test(value)) {
            shouldBeFormatted = false;
        }
    } else {
        // And if we dont have column, we will check if value is valid timestamp
        try {
            shouldBeFormatted = moment(value).isValid();
        } catch (e) {
            console.log('error');
        }
    }

    return shouldBeFormatted;
}

function shouldBeFormatedAsNumeric(columnTitle, value) {
    let shouldBeFormatted = true;
    const stringsToAvoid = ['sku', 'code', 'barcode', 'id', 'memberid', 'telephone'];

    const exactMatches = ['year'];

    // We have to skip formatting if column titles contain any of above parts
    // If it does, its safe to say that value is required to stay in its original state
    columnTitle && stringsToAvoid.forEach((str) => {
        if ((new RegExp(`/[_\\s]+${str}[_\\s]+/i`)).test(columnTitle)) shouldBeFormatted = false;
    });

    // Filter exact matches to title, becuase we can not check for parts in this cases.
    // For example 'Year' can be contained inside compare metric titles, and those
    // should be formatted as numeric values and not left in original state
    columnTitle && exactMatches.forEach((str) => {
        if (columnTitle.toLowerCase() === str) shouldBeFormatted = false;
    });

    // check if value to number is same as value

    return shouldBeFormatted && !isNaN(value) && !_.isNull(value);
}

function shouldBeFormatedAsPercentage(columnTitle, value) {
    return _.endsWith(value, '%');
}

export default function (columnTitle, sample) {
    if (shouldBeFormatedAsDuration(columnTitle, sample)) {
        return 'time';
    }
    if (shouldBeFormatedAsDate(columnTitle, sample)) {
        return 'date';
    }

    if (shouldBeFormatedAsNumeric(columnTitle, sample)) {
        return 'numeric';
    }

    if (shouldBeFormatedAsPercentage(columnTitle, sample)) {
        return 'percentage';
    }

    return 'string';
}
