/* eslint-disable class-methods-use-this */
import moment from 'moment';
import Config from '../config';
import Model from './model';

export default class Organisation extends Model {
    get startDayOfWeek() {
        return this.attributes.startDayOfWeek || (this.sunWeek ? 7 : 1);
    }

    set startDayOfWeek(val) {
        this.attributes.startDayOfWeek = val;
    }

    get numberOfDecimals() {
        return this.attributes.numberOfDecimals || 2;
    }

    set numberOfDecimals(val) {
        this.attributes.numberOfDecimals = val;
    }

    get dateFormat() {
        return this.attributes.dateFormat || Config.dateFormats.regular;
    }

    set dateFormat(val) {
        this.attributes.dateFormat = val;
    }

    get showWeekEndDate() {
        return this.attributes.showWeekEndDate || false;
    }

    set showWeekEndDate(value) {
        this.attributes.showWeekEndDate = !!value;
    }

    get useRounding() {
        return this.attributes.useRounding || false;
    }

    set useRounding(val) {
        this.attributes.useRounding = val;
    }

    get decimalCount() {
        return this.attributes.useRounding ? 0 : 2;
    }

    get startDayName() {
        return moment().isoWeekday(this.startDayOfWeek).format('dddd');
    }

    get fiscalYearStarting() {
        return `1st of ${moment().month(this.fiscalYearStart).format('MMM')}`;
    }

    get dateTimeFormat() {
        return `${this.getDateFormat()} HH:mm:ss`;
    }
}
