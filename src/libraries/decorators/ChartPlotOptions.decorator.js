import _ from 'lodash';
import HighChartConfig from '../config/highchart.config';
import RawInfoColumn from '../models/rawInfo-column';

export default class ChartPlotOptionsDecorator {
    constructor(rawInfo, options) {
        this.rawInfo = rawInfo;
        this.options = options;
    }

    get plotOptions() {
        const plotOptions = {
            series: {
                groupPadding: 0.08,
                fillOpacity: 0.25,
                connectNulls: true,
                lineWidth: this.rawInfo.chartSettings.fillChart ? undefined : 3,
                marker: {
                    enabled: true,
                    radius: 0,
                    states: {
                        hover: {
                            radius: HighChartConfig.marker.radius,
                        },
                    },
                },
            },
        };
        if (this.rawInfo.chartSettings.valueLabels.show) {
            plotOptions.series = {
                maxPointWidth: 120,
                groupPadding: 0.08,
                fillOpacity: 0.25,
                connectNulls: true,
                lineWidth: this.rawInfo.chartSettings.fillChart ? undefined : 3,
                marker: {
                    enabled: true,
                    radius: 0,
                    states: {
                        hover: {
                            radius: 5,
                        },
                    },
                },
                dataLabels: {
                    enabled: true,
                    color: HighChartConfig.colors.dataLabels || '#6F6F6F',
                },
            };
        }

        if (this.rawInfo.chartSettings.stacked) {
            plotOptions.bar = {
                stacking: 'normal',
                dataLabels: {
                    color: 'white',
                },
            };
            plotOptions.column = {
                stacking: 'normal',
                dataLabels: {
                    color: 'white',
                },
            };
            plotOptions.line = {
                stacking: 'normal',
                dataLabels: {
                    color: 'white',
                },
            };
            plotOptions.area = {
                stacking: 'normal',
                dataLabels: {
                    color: 'white',
                },
            };
            plotOptions.spline = {
                stacking: 'normal',
                dataLabels: {
                    color: 'white',
                },
            };
            plotOptions.areaspline = {
                stacking: 'normal',
                dataLabels: {
                    color: 'white',
                },
            };
            // plotOptions.series.stacking = 'normal';

            if (!this.rawInfo.chartSettings.spider.enabled) {
                if (this.rawInfo.chartSettings.valueLabels.show || this.rawInfo.showValueLabels) {
                    const rawInfo = this.rawInfo;

                    _.each(this.options.yAxis, (axis) => {
                        axis.stackLabels = {
                            enabled: true,
                            style: {
                                color: HighChartConfig.colors.dataLabels || '#6F6F6F',
                            },
                            formatting: (new RawInfoColumn(rawInfo.data.columns[rawInfo.groupings.length + 1], 1, rawInfo)).formatting(_.head(rawInfo.data.rows)[1]),
                        };
                    });
                }

                plotOptions.series.dataLabels = {
                    enabled: this.rawInfo.chartSettings.stackDataLabel,
                };
            }

            _.each(this.options.series, (serie) => {
                serie.stack = serie.yAxis;
            });
        }

        if (this.rawInfo.anomalies && this.rawInfo.anomalies.length && this.rawInfo.anomalies.length >= 1000) {
            plotOptions.series.turboThreshold = 1100;
        }

        return plotOptions;
    }

    static decorate(options, rawInfo, ctx) {
        const self = new ChartPlotOptionsDecorator(rawInfo, options, ctx);
        const result = { ...options, plotOptions: self.plotOptions };

        return result;
    }
}
