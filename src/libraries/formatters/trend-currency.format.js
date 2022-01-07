import _ from 'lodash';
import numberFormat from './numeric.format';

export default function (value, symbol, decimals, organisation) {
    const float = value ? parseFloat(value.toString().replace(/,/g, '')) : value;

    if (_.isNaN(float) || _.isNull(float)) return value;
    const numberFormatted = numberFormat(float, decimals, organisation);
    if (value < 0 && numberFormatted[0] === '-') {
        return `-${symbol || ''}${numberFormatted.substring(1)}`;
    }
    if (value > 0) return `+${symbol || ''}${numberFormatted}`;
    return `${symbol || ''}${numberFormatted}`;
}
