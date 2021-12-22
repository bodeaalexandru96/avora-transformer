import Guesser from './format-guesser';
import dateFormatter from './date.format';
import numericFormatter from './numeric.format';
import percentFormatter from './percent.format';
import stringFormatter from './string.format';

export default function (value, column, model) {
    const formatters = { dateFormatter, numericFormatter, stringFormatter, percentFormatter };
    const type = Guesser(column.title, value);
    const formatter = formatters[`${type}Formatter`];

    if (formatter) {
        return formatter(value, column, model);
    }

    return value;
}
