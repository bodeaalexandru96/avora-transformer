/* eslint-disable import/extensions */
/* eslint-disable import/no-unresolved */
import moment from 'moment-timezone';
import store from '../store';

// eslint-disable-next-line
export function fromNow(str, tz) {
    if (!str) { return str; }
    return moment.tz(str, tz || store.state.profile.user.timezone).fromNow();
}

export function userDate(str) {
    if (!str) { return str; }

    const user = store.getters['profile/user'];
    const dateFormat = user.getDateFormat();

    if (str.toString().length === 19) {
        str /= 1000000; // Nanoseconds to milliseconds
    }
    return moment.tz(str, user.timezone).format(dateFormat);
}

export function userDateTime(str) {
    if (!str) { return str; }

    const user = store.getters['profile/user'];
    const dateFormat = user.getDateFormat();

    return moment.tz(str, user.timezone).format(dateFormat);
}

export function simpleDuration(val) {
    if (val < 60) {
        return `${val} sec`;
    }
    const min = val / 60;

    if (min < 60) {
        return `${min.toFixed(0)} min`;
    }

    const hours = min / 60;

    if (hours < 24) {
        return `${hours.toFixed(0)} hrs`;
    }

    return `${(hours / 24).toFixed(0)} days`;
}
