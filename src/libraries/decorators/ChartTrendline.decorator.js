/* eslint-disable no-unused-vars */
import _ from 'lodash';
import HighChartConfig from '../config/highchart.config';
import tracker from '../../plugins/tracker';

export default class ChartTrendlineDecorator {
    constructor(rawInfo) {
        this.rawInfo = rawInfo;
    }

    static decorate(options, rawInfo, ctx) {
        tracker.start('decorate-trendline');

        const self = new ChartTrendlineDecorator(rawInfo);
        self.setTrendLine(options);

        tracker.stop('decorate-trendline');
        return options;
    }

    setTrendLine(options) {
        if (this.rawInfo.hasYAxis) {
            _.each(options.series, (serie) => {
                const extrapolate = this.rawInfo.extendTrendLine || '20%';
                const isPercent = String(extrapolate).endsWith('%');
                const numberOfExtrapolatePoints = Math.max(0, isPercent ? Math.round(serie.data.length * (extrapolate.replace('%', '') / 100)) : extrapolate);
                
                serie.regression = this.rawInfo.showTrendLine && serie.data.length > 1; // A line is defined by 2 points
                serie.regressionSettings = {
                    type: 'linear',
                    name: HighChartConfig.trendLine.legendPrefix + serie.name,
                    showInLegend: HighChartConfig.trendLine.showLegends,
                    color: HighChartConfig.trendLine.useSameColors ? serie.color : null,
                    dashStyle: 'dash',
                    lineWidth: HighChartConfig.trendLine.lineWidth,
                    tooltip: HighChartConfig.trendLine.showTooltips ? true : { pointFormat: '' },
                    extrapolate: numberOfExtrapolatePoints + 1,
                    dataLabels: {
                        enabled: false,
                    },
                };
            });
        }
        return options;
    }
}
