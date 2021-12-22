import _ from 'lodash';
import numberFormat from './numeric.format';

export default function (value, symbol, decimals, organisation) {
    const float = value ? parseFloat(value.toString().replace(/,/g, '')) : value;

    if (_.isNaN(float) || _.isNull(float)) return value;
    return `${symbol || ''}${numberFormat(float, decimals, organisation)}`;
}
