import moment from 'moment';
import _ from 'lodash';

export default function (value, frequency, options = {}) {
    if (_.isNaN(Number(value))) return value;
    
    const date = moment(value);

    // if not a valid date, return original value instead of 'invalid date'
    if (!date.isValid()) return value;

    // If this is required for tooltop we always display full date
    if (options.isTooltip) frequency = 'Tooltip';

    let format = 'dddd, MMMM Do YYYY, HH:mm';

    switch (frequency.toLowerCase()) {
        case 'hourly':
            format = 'HH:mm';
            if (options.isPieDonut) format = 'dddd, MMMM Do YYYY, HH:mm';
            if (options.isTable) format = 'MMMM Do YYYY, HH:mm';
            break;
        case 'daily':
            format = 'MMM Do';
            if (options.isPieDonut) format = 'dddd, MMMM Do YYYY';
            if (options.isTable) format = 'MMM Do YYYY';
            break;
        case 'weekly':
            format = 'MMM Do';
            if (options.withYear) format += ' YYYY';

            if (options.showWeekNumbers) {
                format = '[Wk] W';
                if (options.withYear) format += ' YYYY';

                if (options.isPieDonut) format += ' (MMM Do YYYY)';
            }
            break;
        case 'monthly':
            format = 'MMMM \'YY';
            break;
        case 'quarterly':
            format = '[Q]Q YYYY';
            break;
        case 'yearly':
            format = 'YYYY';
            break;
        case 'grain':
            format = 'MMMM Do YYYY, HH:mm:ss';
            break;
        default:
    }

    return date.format(format);
}
