/* eslint-disable no-unused-vars */
import HighchartConfig from '../config/highchart.config';
import tracker from '../../plugins/tracker';

export default class ChartTypeDecorator {
    constructor(rawInfo) {
        this.rawInfo = rawInfo;
    }

    get type() {
        const isFilled = this.rawInfo.chartSettings.fillChart || this.rawInfo.fillChart ? 'filled' : 'default';

        return HighchartConfig.typeMap[isFilled][this.rawInfo.subType];
    }

    static decorate(options, rawInfo, ctx) {
        tracker.start('decorate-type');

        const self = new ChartTypeDecorator(rawInfo);
        const chart = options.chart || {};
        chart.type = self.type;
        const result = { ...options, chart };

        tracker.stop('decorate-type');
        return result;
    }
}
