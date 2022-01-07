/* eslint-disable func-names */
/* eslint-disable no-unused-vars */
import _ from 'lodash';
import tracker from '../../plugins/tracker';
import HighChartConfig from '../config/highchart.config';

import Formatter from '../formatters';

export default class ChartPieDecorator {
    constructor(rawInfo) {
        this.rawInfo = rawInfo;
    }

    get pieOptions() {
        const pieOptions = {
            showInLegend: true,
            dataLabels: {
                enabled: true,
                distance: -25,
                color: 'white',
            },
        };

        if (this.rawInfo.chartSettings.valueLabels.show || this.rawInfo.showValueLabels) {
            delete pieOptions.dataLabels.distance;
            delete pieOptions.dataLabels.color;

            pieOptions.dataLabels.formatter = function () {
                const value = this.point.custom ? this.point.custom.formatter(this.y) : this.y;
                const percentage = `${_.round(this.percentage)}%`;

                return `${value}<br><span style="color:${this.color}; font-size: 9px;">(${percentage})</span>`;
            };
        }

        if (this.rawInfo.subType === 'donut') {
            pieOptions.innerSize = '50%';
        }
        return pieOptions;
    }

    get series() {
        if (this.rawInfo.selectedFrequency === 'Total') {
            return this.transformWithTotalFrequency();
        }

        if (this.rawInfo.metrics.length === 1) {
            return this.transformSingleMetric();
        }
        return this.transformMultipleMetrics();
    }

    get drilldown() {
        if (this.rawInfo.metrics.length) {
            return {
                series: _(this.rawInfo.data.mappedColumns)
                    .slice(1)
                    .map((column, index) => ({
                        id: column.title,
                        name: column.title,
                        data: this.rawInfo.data.rows.map((row, i) => ({
                            name: Formatter.dateFrequencyFormatter(row[0], this.rawInfo.selectedFrequency),
                            y: row[index + 1],
                            zIndex: i,
                            color: column.getColor(i) || HighChartConfig.colors.all[i],
                            formatted: column.simpleFormatter(row[index + 1]),
                        })),
                    }))
                    .value(),
            };
        }
        return undefined;
    }

    static decorate(options, rawInfo, ctx) {
        tracker.start('decorate-pie');

        if (!['pie', 'donut'].includes(options.chart.type)) {
            tracker.stop('decorate-pie');
            return options;
        }
        const self = new ChartPieDecorator(rawInfo);
        const result = self.decorateOptions(options);

        tracker.stop('decorate-pie');
        return result;
    }

    decorateOptions(options) {
        options.legend = {
            ...options.legend,
            align: 'right',
            verticalAlign: 'middle',
            layout: 'vertical',
        };

        options.tooltip = {
            ...options.tooltip,
            crosshairs: false,
            shared: false,
        };

        options.plotOptions = {
            ...options.plotOptions,
            pie: this.pieOptions,
        };

        options.series = this.series;

        options.drilldown = this.drilldown;

        return options;
    }

    transformWithTotalFrequency() {
        let data;

        if (!this.rawInfo.groupings.length) {
            data = _(this.rawInfo.data.mappedColumns)
                .slice(1)
                .map((column, index) => ({
                    name: column.title,
                    y: this.rawInfo.data.rows[0][index + 1],
                    color: column.getColor(index) || HighChartConfig.colors.all[index],
                    formatted: column.simpleFormatter(this.rawInfo.data.rows[0][index + 1]),
                }))
                .value();
        } else {
            const column = this.rawInfo.data.mappedColumns[1];

            data = this.rawInfo.data.rows.map((row, index) => ({
                name: JSON.parse(row[0]).join(','),
                y: row[1],
                color: column.getColor(index) || HighChartConfig.colors.all[index],
                formatted: column.simpleFormatter(row[1]),
            }));
        }

        return [{
            name: 'Total',
            colorByPoint: true,
            data,
        }];
    }

    transformSingleMetric() {
        const column = this.rawInfo.data.mappedColumns[1];

        const data = this.rawInfo.data.rows.map((row, index) => {
            let name;

            if (this.rawInfo.groupings.length) {
                name = JSON.parse(row[0]).join(',');
            } else {
                name = Formatter.dateFrequencyFormatter(row[0], this.rawInfo.selectedFrequency);
            }

            return {
                name,
                y: row[1],
                color: column.getColor(index) || HighChartConfig.colors.all[index],
                formatted: column.simpleFormatter(row[1]),
            };
        });
        return [
            {
                name: column.title,
                colorByPoint: true,
                data,
            },
        ];
    }

    transformMultipleMetrics() {
        const data = _(this.rawInfo.data.mappedColumns)
            .slice(1)
            .map((column, index) => ({
                name: column.title,
                drilldown: column.title,
                y: this.rawInfo.data.rows[0][index + 1],
                formatted: column.simpleFormatter(this.rawInfo.data.rows[0][index + 1]),
                color: column.getColor(index) || HighChartConfig.colors.all[index],
            }))
            .value();

        return [
            {
                name: 'Total',
                colorByPoint: true,
                data,
            },
        ];
    }
}
