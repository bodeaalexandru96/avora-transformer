import moment from 'moment';
import Helpers from '../../../utils/helpers';

const NORMAL_LIST = ['Yearly', 'Quarterly', 'Monthly', 'Weekly', 'Daily'];
const HOURLY_LIST = [...NORMAL_LIST, 'Hourly'];

export default class RawInfoFrequencies {
    /**
     * @param {RawInfo} rawInfo
     */
    constructor(rawInfo) {
        this.rawInfo = rawInfo;
        this.available = this.rawInfo.availableFrequencies || [];
        this.selected = this.rawInfo.selectedFrequency;
        this.oldSelected = null;
        this.default = 'Monthly';
    }

    is(frequency) {
        return frequency.toLowerCase() === this.selected.toLowerCase();
    }

    isTotalSelected() {
        return this.is('Total');
    }

    isGrainSelected() {
        return this.is('Grain');
    }

    set(frequency, refresh = true) {
        if (this.is(frequency)) return;

        const chartType = this.rawInfo.types.type;
        const countOfGroupings = this.rawInfo.groupings.length;

        if (frequency === 'Total') {
            if (['pie', 'donut', 'funnel', 'bar'].includes(chartType)) {
                // We do nothing because we assume that pie, donut and funnel can always display total frequency
            } else if ((this.rawInfo.metrics.length > 1 || this.rawInfo.groupings.length > 0) && chartType !== 'map') {
                // If we have more than one metric than we set type to table as default
                this.rawInfo.types.set('table', 'table');
            } else if ((chartType !== 'table' || this.rawInfo.metrics.length === 1) && chartType !== 'map') {
                // And if we have only one metric we set it to numeric
                this.rawInfo.types.set('numeric', 'numeric');
            }
        } else if (chartType === 'numeric') {
            this.rawInfo.types.set('line', 'line');
        } else if (frequency === 'None') {
            this.rawInfo.types.set('table', 'table');
        }

        if (frequency !== 'Total' && countOfGroupings === 1 && chartType === 'map') {
            frequency = 'Total';
        }

        this.oldSelected = this.selected;
        this.selected = frequency;

        if ((this.isTotalSelected() || this.oldSelected === 'Total') && !this.is(this.oldSelected)) {
            // delete columns sorting information if freq change from total to another type and vice versa
            this.rawInfo.columnSorting.sortOrder = [];
        }

        this.trigger('updated');

        // We need to refresh page counter when frequency changes
        const promise = this.rawInfo.metrics.setPage(1);

        // eslint-disable-next-line consistent-return
        return refresh ? promise.then(() => this.rawInfo.metrics.loadData()) : promise;
    }

    setOld() {
        if (this.oldSelected.toLowerCase() === 'total') {
            this.set(this.oldSelected);
        } else if (this.oldSelected && this.available.find((item) => item.toLowerCase() === this.oldSelected.toLowerCase())) {
            this.set(this.oldSelected);
        } else {
            this.set(this.default);
        }
    }

    static isPieOrDonut(type) {
        return ['pie', 'donut'].indexOf(type) > -1;
    }

    updateAvailable() {
        this.available = this.rawInfo.metrics.getRegular().some((metric) => {
            return metric.info.frequencies ? metric.info.frequencies.indexOf('Hourly') === -1 : true;
        }) ? NORMAL_LIST : HOURLY_LIST;

        this.trigger('listUpdated');
    }

    getState() {
        return {
            selected: this.selected,
        };
    }

    setState(state) {
        this.oldSelected = this.selected;
        this.selected = state.selected;
    }

    get dateFormat() {
        const formats = {
            hourly: this.rawInfo.anomalies && this.rawInfo.anomalies.length ? '%e %b<br/>%H:%M' : '%H:%M',
            daily: '%e. %b',
            weekly: '%e. %b',
            monthly: '%b \'%y',
            quarterly: '%Q  %Y',
            yearly: '%Y',
        };

        if (this.rawInfo.showWeekNumbers) {
            formats.weekly = '%WEEK  %Y';
        }

        return formats[this.selected.toLowerCase()];
    }

    getTooltipFrequencyDateFormat() {
        const formats = {
            quarterly: '%Q  %Y',
        };

        if (this.rawInfo.showWeekNumbers) {
            formats.weekly = '%WEEK (%A, %B %e, %Y)';
        }

        return formats[this.selected.toLowerCase()];
    }

    convertToSentence(range) {
        const sentence = {
            hourly: 'by Hour',
            daily: 'by Day',
            weekly: 'by Week',
            monthly: 'by Month',
            quarterly: 'by Quarter',
            yearly: 'by Year',
            total: 'Total',
        };

        // For total frequency we will prepend the value
        if (this.isTotalSelected()) return `${sentence[this.selected.toLowerCase()]} ${range}`;

        return `${range} ${sentence[this.selected.toLowerCase()]}`;
    }

    splitDateRangeToIntervals(from, to) {
        const interval = {
            hourly: 'hour',
            daily: 'day',
            weekly: 'week',
            monthly: 'month',
            quarterly: 'quarter',
            yearly: 'year',
        };

        if (this.selected.toLowerCase() === 'weekly') {
            from = this.generateWeekRangeStart(from);
        }

        const range = moment.range(from, to);

        const intervals = Array.from(range.by(interval[this.selected.toLowerCase()]));
        return intervals.map((interval) => this.getIntervalFromDate(interval));
    }

    generateWeekRangeStart(from) {
        const fromDateString = Helpers.formatToDateString(moment(from));

        const selectedDay = moment(fromDateString).day();
        const weekStartDay = this.rawInfo.usedStartDayOfWeek % 7;

        let diff = selectedDay >= weekStartDay ? 0 : (selectedDay + 1);

        // This is custom case when week starts on Sunday and we click on Sunday
        if (!selectedDay && !weekStartDay) diff = -1;

        return moment(fromDateString).subtract(diff, 'day').startOf('isoWeek').add(weekStartDay - 1, 'day');
    }

    getIntervalFromDate(date) {
        const dateFormatFn = Helpers.formatDate(this.selected.toLowerCase(), {
            isPieDonut: true,
            withYear: true,
            showWeekNumbers: this.rawInfo.showWeekNumbers,
        });

        let from;
        let
            to;

        switch (this.selected.toLowerCase()) {
            case 'hourly':
                from = moment(date).startOf('hour');
                to = moment(date).endOf('hour');
                break;
            case 'daily':
                from = moment(date).startOf('day');
                to = moment(date).endOf('day');
                break;
            case 'weekly':
                const fromDateString = Helpers.formatToDateString(moment(date));

                const selectedDay = moment(fromDateString).day();
                const weekStartDay = this.rawInfo.usedStartDayOfWeek % 7;

                let diff = selectedDay >= weekStartDay ? 0 : (selectedDay + 1);

                // This is custom case when week starts on Sunday and we click on Sunday
                if (!selectedDay && !weekStartDay) diff = -1;

                from = moment(date).subtract(diff, 'day').startOf('isoWeek').add(weekStartDay - 1, 'day');
                to = moment(date).subtract(diff, 'day').endOf('isoWeek').add(weekStartDay - 1, 'day');
                break;
            case 'monthly':
                from = moment(date).startOf('month');
                to = moment(date).endOf('month');
                break;
            case 'quarterly':
                from = moment(date).startOf('quarter');
                to = moment(date).endOf('quarter');
                break;
            case 'yearly':
                from = moment(date).startOf('year');
                to = moment(date).endOf('year');
                break;
            default:
        }

        return {
            label: dateFormatFn(from),
            from: +from,
            to: +to,
        };
    }
}
