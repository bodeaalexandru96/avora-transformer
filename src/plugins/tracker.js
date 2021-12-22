import _ from 'lodash';

export default {
    timings: {},
    start(name) {
        if (!this.timings[name]) {
            this.timings[name] = {};
        }
        this.timings[name].start = Date.now();
    },
    stop(name, sum) {
        this.timings[name].end = Date.now();
        const prev = (sum ? this.timings[name].duration : 0) || 0;
        this.timings[name].duration = Date.now() - this.timings[name].start + prev;
        if (sum) {
            this.timings[name].times = (this.timings[name].times || 0) + 1;
        }
    },
    withPercentage(base) {
        return _.mapValues(this.timings, (timming) => {
            return { ...timming, percent: _.round((timming.duration / base) * 100) };
        });
    },
};
