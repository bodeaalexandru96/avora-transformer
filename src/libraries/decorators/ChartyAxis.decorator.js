/* eslint-disable no-nested-ternary */
/* eslint-disable no-unused-vars */
import _ from 'lodash';
import HighChartConfig from '../config/highchart.config';

export default class ChartyAxisDecorator {
    constructor(rawInfo, options) {
        this.rawInfo = rawInfo;
        this.options = options;
    }

    get leftYAxisVisible() {
        return !!(this.rawInfo.hasYAxis && this.hasMetricsOnLeftYAxis && this.rawInfo.chartSettings.leftYAxis.show);
    }

    get rightYAxisVisible() {
        return !!(this.rawInfo.hasYAxis && this.hasMetricsOnRightYAxis && this.rawInfo.chartSettings.rightYAxis.show);
    }

    get leftYAxisMetrics() {
        return this.rawInfo.visibleMetrics.filter((metric) => metric.leftYAxis);
    }

    get rightYAxisMetrics() {
        return this.rawInfo.visibleMetrics.filter((metric) => !metric.leftYAxis);
    }

    get hasMetricsOnLeftYAxis() {
        return this.leftYAxisMetrics.length;
    }

    get hasMetricsOnRightYAxis() {
        return this.rightYAxisMetrics.length;
    }

    get leftMaxMin() {
        if (!this.rawInfo.chartSettings.leftYAxis.autoScale && this.rawInfo.chartSettings.leftYAxis.range) {
            return {
                min: this.rawInfo.chartSettings.leftYAxis.rangeFrom,
                max: this.rawInfo.chartSettings.leftYAxis.rangeTo,
            };
        }

        const data = _(this.options.series).reject('yAxis').map('data');
        const series = data.flatten().map((row) => row[1] || row.y).flatten().value();

        let min = _.min(series);

        let max = _.max(series);
        // if stacked max is sum of all points on same day
        if (this.rawInfo.chartSettings.stacked) {
            if (this.rawInfo.selectedFrequency !== 'Total') {
                max = data.flatten().groupBy((row) => row[0] || row.x).map((group) => _.sumBy(group, (row) => {
                    const value = row[1] || row.y;
                    return value > 0 ? value : 0;
                })).max();
                min *= 0.15;
            } else {
                const totals = {};

                // todo: refactor to use sumBy
                data.each((group) => {
                    _.each(group, ({ y }, i) => {
                        totals[i] = (totals[i] || 0) + y;
                    });
                });
                max = _.max(_.values(totals)) * 0.15;
            }
        }

        const maxX = max + Math.abs(max * 0.05);
        const minX = min - Math.abs(min * 0.05);
        return {
            max: Math.abs(maxX) > 4 ? _.ceil(maxX / 5) * 5 : maxX,
            min: Math.abs(minX) > 4 ? _.floor(minX / 5) * 5 : minX,
        };
    }

    get rightMaxMin() {
        if (!this.rawInfo.chartSettings.rightYAxis.autoScale && this.rawInfo.chartSettings.rightYAxis.range) {
            return {
                min: this.rawInfo.chartSettings.rightYAxis.rangeFrom,
                max: this.rawInfo.chartSettings.rightYAxis.rangeTo,
            };
        }

        const data = _(this.options.series).filter((s) => (s.yAxis || s.yAxis === 0)).map('data');
        const series = data.flatten().map((row) => row[1] || row.y).flatten().value();

        let min = _.min(series);

        let max = _.max(series);

        // if stacked max is sum of all points on same day
        if (this.rawInfo.chartSettings.stacked) {
            if (this.rawInfo.selectedFrequency !== 'Total') {
                max = data.flatten().groupBy((row) => row[0] || row.x).map((group) => _.sumBy(group, (row) => row[1] || row.y)).max();
                min *= 0.15;
            } else {
                const totals = {};

                // todo: refactor to use sumBy
                data.each((group) => {
                    _.each(group, ({ y }, i) => {
                        totals[i] = (totals[i] || 0) + y;
                    });
                });

                max = _.max(_.values(totals)) * 0.15;
            }
        }

        const maxX = max + Math.abs(max * 0.05);
        const minX = min - Math.abs(min * 0.05);
        const minSet = Math.abs(maxX) > 4 ? _.ceil(maxX / 5) * 5 : maxX;

        return {
            max: this.rawInfo.chartSettings.stacked && (this.rawInfo.type === 'bar' || this.rawInfo.type === 'column') ? (minSet < 0 ? minSet : 0) : minSet,
            min: Math.abs(minX) > 4 ? _.floor(minX / 5) * 5 : minX,
        };
    }

    get tickLeftInterval() {
        const range = this.leftMaxMin.max - this.leftMaxMin.min;

        if (range <= 2) return 0.2;
        if (range <= 8) return 2;
        if (range <= 25) return 5;
        if (range <= 60) return 10;
        if (range <= 75) return 15;
        if (range <= 100) return 20;
        if (range <= 150) return 25;
        if (range <= 200) return 50;

        return undefined;
    }

    get tickRightInterval() {
        const range = this.rightMaxMin.max - this.rightMaxMin.min;

        if (range <= 2) return 0.2;
        if (range <= 8) return 2;
        if (range <= 25) return 5;
        if (range <= 50) return 10;
        if (range <= 75) return 15;
        if (range <= 100) return 20;
        if (range <= 150) return 25;
        if (range <= 200) return 50;

        return undefined;
    }

    get yAxis() {
        return [
            {
                startOfWeek: 1,
                title: this.getAxisTitle(this.rawInfo.chartSettings.leftYAxis, this.leftYAxisMetrics, _.reject(this.options.series, 'yAxis')),
                lineWidth: this.rawInfo.chartSettings.spider.enabled ? 0 : 1,
                gridLineWidth: this.rawInfo.chartSettings.spider.enabled ? 1 : 0,
                startOnTick: !!this.rawInfo.chartSettings.spider.enabled,
                tickInterval: !this.rawInfo.chartSettings.spider.enabled ? this.tickLeftInterval : undefined,
                tickColor: 'transparent',
                visible: true,
                gridLineInterpolation: this.rawInfo.chartSettings.spider.type,
                lineColor: this.leftYAxisVisible ? '#ccd6eb' : 'transparent',
                labels: {
                    enabled: this.leftYAxisVisible,
                },
                custom: {
                    prefix: this.getAxisPrefix(this.rawInfo.chartSettings.leftYAxis, this.leftYAxisMetrics),
                    suffix: this.getAxisSuffix(this.rawInfo.chartSettings.leftYAxis, this.leftYAxisMetrics),
                },
                angle: 0,
                min: !this.rawInfo.chartSettings.spider.enabled ? this.leftMaxMin.min : undefined,
                max: !this.rawInfo.chartSettings.spider.enabled ? this.leftMaxMin.max : undefined,
                plotLines: this.rawInfo.chartSettings.yAxis && this.rawInfo.chartSettings.yAxis.plotLines && this.rawInfo.chartSettings.yAxis.plotLines.length
                    ? this.rawInfo.chartSettings.yAxis.plotLines.map((val) => ({
                        color: val.limit ? HighChartConfig.colors.light_gray : HighChartConfig.colors.dataLabels,
                        width: 2,
                        value: val.value,
                        zIndex: 5,
                        dashStyle: val.type,
                        label: val.label ? {
                            text: val.label,
                            align: 'right',
                            style: {
                                fontWeight: 'bold',
                            },
                        } : null,
                    })) : [],
            },
            {
                startOfWeek: 1,
                title: this.getAxisTitle(this.rawInfo.chartSettings.rightYAxis, this.rightYAxisMetrics, _.filter(this.options.series, 'yAxis')),
                lineWidth: this.rawInfo.chartSettings.spider.enabled ? 0 : 1,
                gridLineWidth: this.rawInfo.chartSettings.spider.enabled ? 1 : 0,
                startOnTick: !!this.rawInfo.chartSettings.spider.enabled,
                tickInterval: !this.rawInfo.chartSettings.spider.enabled ? this.tickRightInterval : undefined,
                tickColor: 'transparent',
                opposite: true,
                visible: true,
                gridLineInterpolation: this.rawInfo.chartSettings.spider.type,
                lineColor: this.rightYAxisVisible ? '#ccd6eb' : 'transparent',
                labels: {
                    enabled: this.rightYAxisVisible,
                },
                custom: {
                    prefix: this.getAxisPrefix(this.rawInfo.chartSettings.leftYAxis, this.rightYAxisMetrics),
                    suffix: this.getAxisSuffix(this.rawInfo.chartSettings.leftYAxis, this.rightYAxisMetrics),
                },
                angle: this.rawInfo.chartSettings.spider.enabled ? 90 : 0,
                min: !this.rawInfo.chartSettings.spider.enabled ? this.rightMaxMin.min : undefined,
                max: !this.rawInfo.chartSettings.spider.enabled ? this.rightMaxMin.max : undefined,
                plotLines: this.rawInfo.chartSettings.yAxis && this.rawInfo.chartSettings.yAxis.plotLines && this.rawInfo.chartSettings.yAxis.plotLines.length
                    ? this.rawInfo.chartSettings.yAxis.plotLines.map((val) => ({
                        color: val.limit ? HighChartConfig.colors.light_gray : HighChartConfig.colors.dataLabels,
                        width: 2,
                        value: val.value,
                        zIndex: 5,
                        dashStyle: val.type,
                        label: val.label ? {
                            text: val.label,
                            align: 'right',
                            style: {
                                fontWeight: 'bold',
                            },
                        } : null,
                    })) : [],
            },
        ];
    }

    static decorate(options, rawInfo, ctx) {
        const self = new ChartyAxisDecorator(rawInfo, options);
        const result = { ...options, yAxis: self.yAxis };
        return result;
    }

    getAxisTitle(yAxis, metrics, series = []) {
        if (!yAxis.autoLabel && !yAxis.label) {
            return false;
        }
        if (yAxis.label) {
            return { text: yAxis.label, margin: 13 };
        }

        const text = _(series)
            .map(({ name }, index) => `<span style="color: ${_.get(series[index], 'color')};">${name}</span>`)
            .value()
            .join('<br>');

        return {
            text,
            margin: 13,
        };
    }

    getAxisPrefix(axis, metrics) {
        if (this.rawInfo.isContext && this.rawInfo.dataSymbol === '%') return '';

        const ids = _.map(metrics, 'id');
        const prefix = _(this.rawInfo.metrics)
            .filter(({ id, relationId }) => ids.includes(id) || ids.includes(relationId))
            .map((metric) => metric.yAxis.prefix)
            .uniq()
            .value();
        
        if (prefix.length === 1) return prefix.join('');
        return '';
    }

    getAxisSuffix(axis, metrics) {
        if (this.rawInfo.isContext && this.rawInfo.dataSymbol === '%') return '%';
        
        const ids = _.map(metrics, 'id');
        const suffix = _(this.rawInfo.metrics)
            .filter(({ id, relationId }) => ids.includes(id) || ids.includes(relationId))
            .map((metric) => metric.yAxis.suffix)
            .uniq()
            .value();

        if (suffix.length === 1) return suffix.join('');
        return '';
    }
}
