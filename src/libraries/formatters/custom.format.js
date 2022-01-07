import _ from 'lodash';

export default function (value, formats) {
    const style = {};
    const matched = _.filter(formats, (format) => {
        return matches(parseFloat(value), format);
    });

    if (matched.length) {
        setAlignment(style, value, matched);
        setBackground(style, value, matched);
        setColor(style, value, matched);
    }
    return { style, value };
}

function matches(current, { operator, value, valueTo }) {
    if (operator === 'gte') {
        return current >= value;
    }
    if (operator === 'lte') {
        return current <= value;
    }
    if (operator === 'gt') {
        return current > value;
    }
    if (operator === 'lt') {
        return current < value;
    }
    if (operator === 'between') {
        return valueTo >= current && current >= value;
    }
    return false;
}

function setAlignment(style, value, formats) {
    _.each(formats, ({ align }) => {
        style.textAlign = align;
    });
}

function setBackground(style, value, formats) {
    _.each(formats, ({ color }) => {
        if (color) {
            style.backgroundColor = color;
        }
    });
}

function setColor(style, value, formats) {
    _.each(formats, ({ textColor }) => {
        if (textColor) {
            style.color = textColor;
        }
    });
}
