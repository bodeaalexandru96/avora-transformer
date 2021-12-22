import Model from './model';

export default class User extends Model {
    get dateFormat() {
        return this.attributes.dateFormat || this.organisation.dateFormat;
    }

    set dateFormat(val) {
        this.attributes.dateFormat = val;
    }

    get dateTimeFormat() {
        return `${this.getDateFormat()} HH:mm:ss`;
    }
}
