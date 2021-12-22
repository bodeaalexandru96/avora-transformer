import _ from 'lodash';

export default function (value, decimals, organisation = {}, isMetric = true) {
    if (_.isUndefined(decimals) || decimals === false) { // we can have '0' as a decimal value
        decimals = organisation.numberOfDecimals;
    }

    let decimalsNeeded = null;
    const rawNumber = String(value).replace(/,/g, '');

    if (value < 1 && rawNumber.includes('.')) {
        const valueForDecimals = Number(rawNumber.replace(rawNumber.substr(0, rawNumber.indexOf('.')), '0'));
        const decimalsFound = -Math.floor(Math.log10(valueForDecimals) + 1) + 2; // count decimals needed
        decimalsNeeded = !decimalsFound || decimalsFound === Infinity ? null : decimalsFound;
    }

    decimals = decimalsNeeded && decimalsNeeded > decimals ? decimalsNeeded : decimals;

    let finalSentValue = NaN;
    if (!_.isNaN(Number(rawNumber))) {
        if (value.toString().length > 1 && value[0] === '0') { // if we have a number like "06" or "00654" or "00" we should leave it like this
            finalSentValue = NaN;
        } else if (!isMetric) {
            finalSentValue = NaN;
        } else {
            finalSentValue = parseFloat(rawNumber);
        }
    } else { // if we have a value like '0064 - ' we should send it like it is
        finalSentValue = NaN;
    }

    if (_.isNaN(finalSentValue)) return value;
    
    return _.round(finalSentValue, decimals).toLocaleString(undefined, { minimumFractionDigits: decimals || 0 });
}
