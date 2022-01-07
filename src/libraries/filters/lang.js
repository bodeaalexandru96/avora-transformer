import _ from 'lodash';

// eslint-disable-next-line
export function pluralize(value, { other, ...options }) {
    const temp = _.get(options, value, other);
    return _.template(temp)({ value });
}
