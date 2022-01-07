import _ from 'lodash';

export function formatNumber(number, symbol, decimals = 2) {
    if (!number) return number;
    if (symbol === '\\u00a3') {
        // eslint-disable-next-line
        symbol = '£';
    }
    return `${symbol || ''}${_.round(number, decimals).toLocaleString()}`;
}

export function formatPercent(number, decimal) {
    if (!number) {
        return number;
    }
    if (decimal) {
        return `${_.round(number * 100, 2)}%`;
    }
    return `${_.round(number, 2)}%`;
}

export function summarizeNum(val, symbol = '') {
    let num = parseFloat(_.replace(val, /,/g, '').replace(symbol, ''));

    if (!num) return 0;
    const negative = num < 0;

    let suffix = '';

    num = Math.abs(num);

    if (num > 1000) {
        suffix = 'K';
        num /= 1000;
    }
    if (num > 1000) {
        suffix = 'M';
        num /= 1000;
    }
    if (num > 1000) {
        suffix = 'B';
        num /= 1000;
    }

    if (num > 1000) {
        suffix = 'T';
        num /= 1000;
    }

    if (symbol === '123' || symbol === 'time') {
        symbol = '';
    }

    if (symbol === '%') {
        symbol = '';
        suffix += '%';
    }

    if (symbol === '\\u00a3') {
        // eslint-disable-next-line
        symbol = '£';
    }
    if (negative) {
        return `-${symbol || ''}${_.round(num, 2)}${suffix}`.trim();
    }

    return `${symbol || ''}${_.round(num, 2)}${suffix}`.trim();
}
