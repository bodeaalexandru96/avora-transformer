/* eslint-disable no-nested-ternary */
/* eslint-disable max-len */
import _ from 'lodash';
import HighChartConfig from '../config/highchart.config';

export default class ChartxAxisDecorator {
    constructor(rawInfo, options) {
        this.rawInfo = rawInfo;
        this.options = options;
    }

    get xAxis() {
        return {
            startOfWeek: 1,
            lineWidth: this.rawInfo.chartSettings.spider.enabled ? 0 : 1,
            gridLineWidth: this.rawInfo.chartSettings.spider.enabled ? 1 : 0,
            tickColor: 'transparent',
            tickmarkPlacement: this.rawInfo.chartSettings.spider.enabled ? 'on' : 'between',
            title: {
                text: this.rawInfo.chartSettings.xAxis.label || '',
            },
            type: this.rawInfo.chartSettings.noType ? null : 'datetime',
            dateTimeLabelFormats: {
                // these overrides are necessary because when we have single value on chart highchart
                // renders date in millisecond format so we will just give it current frequency
                // format so in case of yearly frequency it will show only year number
                millisecond: this.rawInfo.frequencies.dateFormat,
                second: this.rawInfo.frequencies.dateFormat,
                minute: this.rawInfo.frequencies.dateFormat,
                hour: this.rawInfo.frequencies.dateFormat,
                day: this.rawInfo.frequencies.dateFormat,
                week: this.rawInfo.frequencies.dateFormat,
                month: this.rawInfo.frequencies.dateFormat,
                year: this.rawInfo.frequencies.dateFormat,
            },
            reversed: this.rawInfo.chartSettings.reversedChart,
            visible: true,
            lineColor: this.rawInfo.chartSettings.xAxis.show ? '#ccd6eb' : 'transparent',
            labels: {
                enabled: this.rawInfo.chartSettings.xAxis.show,
            },
            categories: this.rawInfo.chartSettings.xAxis.categories || this.categories,
            plotLines: this.rawInfo.includeTrendDetection && this.rawInfo.anomalies
                ? _(this.rawInfo.anomalies).filter((anomaly) => anomaly.stepChange || anomaly.slopeChange).map((anomaly) => {
                    return {
                        value: anomaly.dateTimePosition,
                        color: (this.rawInfo.highlightStepChangePosition && this.rawInfo.highlightStepChangePosition === anomaly.dateTimePosition)
                            ? (this.rawInfo.isGood ? HighChartConfig.colors.green : HighChartConfig.colors.red)
                            : (anomaly.slopeChange ? HighChartConfig.colors.all[16] : HighChartConfig.colors.all[26]),
                        width: this.rawInfo.highlightStepChangePosition && this.rawInfo.highlightStepChangePosition === anomaly.dateTimePosition ? 3 : 2,
                        dashStyle: 'ShortDot',
                        zIndex: 4,
                    };
                }) : [],
        };
    }

    get categories() {
        if (this.rawInfo.type !== 'scatter' && this.rawInfo.selectedFrequency === 'Total') {
            if (this.rawInfo.groupings.length) {
                if (this.rawInfo.isTransposeTable) {
                    return _(this.rawInfo.data.mappedColumns || [])
                        .slice(1)
                        .map(({ title }) => title)
                        .thru((categories) => this.sortCategories(categories))
                        .value();
                }
                return _(this.rawInfo.data.rows || [])
                    .map((row) => JSON.parse(row[0]).join(','))
                    .thru((categories) => this.sortCategories(categories))
                    .value();
            }
            return ['Total'];
        }
        return undefined;
    }

    sortCategories(categories) {
        if (this.options.sortOrder) {
            return _(categories)
                .map((title, index) => ({ title, index }))
                .sortBy(({ index }) => this.options.sortOrder.indexOf(index))
                .map('title')
                .value();
        }
        return categories;
    }

    static decorate(options, rawInfo) {
        const self = new ChartxAxisDecorator(rawInfo, options);
        return { ...options, xAxis: self.xAxis };
    }
}
