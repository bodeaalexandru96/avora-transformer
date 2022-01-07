import moment from 'moment';

export default function (value, { dateFormat = 'MM/DD/YYYY' }) {
    return moment(value).format(dateFormat);
}
