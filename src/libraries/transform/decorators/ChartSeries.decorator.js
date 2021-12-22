/* eslint-disable no-plusplus */
/* eslint-disable object-shorthand */
/* eslint-disable func-names */
/* eslint-disable no-nested-ternary */
import _ from 'lodash';
import moment from 'moment';
import HighChartConfig from '../config/highchart.config';

export default class ChartSeriesDecorator {
    constructor(rawInfo) {
        this.rawInfo = rawInfo;
    }

    get series() {
        if (this.rawInfo.groupings.length) {
            if (this.rawInfo.isTransposeTable) {
                console.log(this.rawInfo.id, 'getTransposedGroupSeries');
                return this.getTransposedGroupSeries();
            }
            if (this.rawInfo.selectedFrequency === 'Total') {
                console.log(this.rawInfo.id, 'getGroupTotalSeries');
                return this.getGroupTotalSeries();
            }
            if (this.rawInfo.visibleMetrics.length > 1) {
                console.log(this.rawInfo.id, 'getMultiMetricsGroupedSeries');
                return this.getMultiMetricsGroupedSeries();
            }
            console.log(this.rawInfo.id, 'getGroupSeries');
            return this.getGroupSeries();
        }
        if (this.rawInfo.anomalies && this.rawInfo.anomalies.length && !this.rawInfo.showMetricTrend) {
            console.log(this.rawInfo.id, 'getAnomalySeries');
            return this.getAnomalySeries();
        }

        if (this.rawInfo.isContext) {
            console.log(this.rawInfo.id, 'getBarContextSeries');
            return this.getBarContextSeries();
        }

        console.log(this.rawInfo.id, 'getSimpleSeries');
        return this.getSimpleSeries();
    }

    static decorate(options, rawInfo) {
        if (['pie', 'donut', 'scatter'].includes(rawInfo.type)) {
            return options;
        }
        const self = new ChartSeriesDecorator(rawInfo);
        self.options = options;
        return { ...options, series: self.series, sortOrder: self.sortOrder };
    }

    getGroupTotalSeries() {
        return _(this.rawInfo.data.mappedColumns)
            .slice(this.rawInfo.groupings.length)
            .map((column, i) => {
                const data = _.map(this.rawInfo.data.rows, (row, index) => {
                    return {
                        x: column.time,
                        y: row[i + 1],
                        index,
                        formatted: column.simpleFormatter(row[i + 1]),
                    };
                });

                const yAxis = column.settings.leftYAxis ? 0 : 1;
                return {
                    name: column.title,
                    type: column.chartType,
                    data,
                    formatting: column.formatting(this.rawInfo.data.rows[0][1]),
                    color: column.getColor(i) || this.getColor(i),
                    zIndex: yAxis ? -1 * i : i,
                    pointPlacement: this.rawInfo.chartSettings.spider.enabled ? 'on' : null,
                    yAxis,
                    marker: this.getMarker(data, column),
                };
            })
            .thru((series) => {
                if (this.rawInfo.visibleMetrics.length > 1) return series;

                // If we have only one metric we will sort by value in descending order
                this.sortOrder = _(series)
                    .map('data')
                    .flatten()
                    .groupBy('index')
                    .mapValues((group) => _.sumBy(group, 'y'))
                    .map((y, index) => ({ y, index: parseInt(index) }))
                    .sortBy('y', 'desc')
                    .map('index')
                    .reverse()
                    .value();
                return _.map(series, (serie) => {
                    const data = _.sortBy(serie.data, (point) => this.sortOrder.indexOf(point.index));
                    return { ...serie, data };
                });
            })
            .value();
    }

    getMultiMetricsGroupedSeries() {
        const columns = this.rawInfo.data.mappedColumns.splice(this.rawInfo.groupings.length);
        const metrics = _.keyBy(this.rawInfo.chartSettings.metrics, 'id');
        let orderedMetrics = {};

        _.forEach(this.rawInfo.visibleMetrics, (metric) => {
            const position = _.findIndex(this.rawInfo.columnPosition.filter((item) => !item.hidden), { id: metric.id });
            orderedMetrics[position] = metric;
        });

        orderedMetrics = Object.values(_(orderedMetrics).toPairs().sortBy(0).fromPairs().value());
        let i = 0; // if we have x metric but with groupings we have more "elements" to show, we need to use another color for each "element"

        return _.reduce(this.rawInfo.data.rows, (series, row) => {
            const group = JSON.parse(row[0]).join(', ');
            _.each(orderedMetrics, (metric, metricIndex) => {
                const data = [];
                _.each(row, (cell, colIndex) => {
                    if (colIndex > 0) {
                        const column = columns[colIndex - 1];
                        if (column.metric.id === metric.id) {
                            data.push({
                                x: column.time,
                                y: parseFloat(cell),
                                formatted: column.simpleFormatter(cell),
                            });
                        }
                    }
                });

                const color = metric.color || this.getColor(metricIndex + i);
                i++;
                const type = this.rawInfo.subType === 'mixed' ? metric.getChartType(this.rawInfo.chartSettings.fillChart || this.rawInfo.fillChart) : undefined;

                series.splice(metricIndex, 0, {
                    name: `${metric.name} - ${group}`,
                    data,
                    type,
                    color,
                    zIndex: this.rawInfo.metrics.length - metricIndex,
                    pointPlacement: this.rawInfo.chartSettings.spider.enabled ? 'on' : null,
                    yAxis: !metrics[metric.id] || metrics[metric.id].leftYAxis ? 0 : 1,
                });
            });

            i++;

            return series;
        }, []);
    }

    getGroupSeries() {
        return _.map(this.rawInfo.data.rows, ([group, ...row], i) => {
            const groups = this.rawInfo.groupings.length;

            const data = _(row)
                .map((_val, index) => {
                    const column = this.rawInfo.data.mappedColumns[index + groups];

                    if (!_.isNumber(column.time)) return false;

                    return {
                        x: column.time,
                        y: parseFloat(row[index]),
                        formatted: column.simpleFormatter(row[index]),
                    };
                })
                .filter()
                .value();

            const metric = this.rawInfo.visibleMetrics[0];

            const color = metric.color || this.getColor(i);

            return {
                name: JSON.parse(group).join(', '),
                data,
                zIndex: i,
                pointPlacement: this.rawInfo.chartSettings.spider.enabled ? 'on' : null,
                yAxis: !this.rawInfo.chartSettings.metrics[metric.id] || this.rawInfo.chartSettings.metrics[metric.id].leftYAxis ? 0 : 1,
                color,
                marker: this.getMarker(row, this.rawInfo.data.mappedColumns[i]),
            };
        });
    }

    getTransposedGroupSeries() {
        return _.map(this.rawInfo.data.rows, ([group, ...row], i) => {
            const data = _([...this.rawInfo.data.mappedColumns])
                .splice(group.split(',').length)
                // .filter(({ time, }) => _.isNumber(time))
                .map((column, index) => {
                    return {
                        x: column.time,
                        y: row[index],
                        formatted: column.simpleFormatter(row[index]),
                    };
                })
                .value();

            const col = this.rawInfo.data.mappedColumns[i];
            const yAxis = _.get(col, 'settings.leftYAxis', true) ? 0 : 1;
            return {
                name: JSON.parse(group).join(', '),
                data,
                color: col ? col.getColor(i) : this.getColor(i),
                zIndex: i,
                pointPlacement: this.rawInfo.chartSettings.spider.enabled ? 'on' : null,
                yAxis,
                marker: this.getMarker(row, col),
            };
        });
    }

    getSimpleSeries() {
        return _(this.rawInfo.data.mappedColumns)
            .splice(1)
            .filter(({ title }) => title)
            .map((column, index) => {
                const data = _.map(this.rawInfo.data.rows, (row) => ({
                    x: row[0],
                    y: row[index + 1],
                    formatted: column.simpleFormatter(row[index + 1]),
                }));

                return {
                    name: column.title,
                    type: column.chartType,
                    data,
                    formatting: column.formatting(this.rawInfo.data.rows[0][0]),
                    color: column.getColor(index) || this.getColor(index),
                    zIndex: column.zIndex,
                    pointPlacement: this.rawInfo.chartSettings.spider.enabled ? 'on' : null,
                    yAxis: column.settings.leftYAxis ? 0 : 1,
                    marker: this.getMarker(data, column),
                };
            })
            .value();
    }

    getBarContextSeries() {
        return _(this.rawInfo.data.mappedColumns)
            .filter(({ title }) => title)
            .map((column, index) => {
                const data = _.map(this.rawInfo.data.rows, (row) => ({
                    y: Number(row[index]),
                    formatted: this.rawInfo.dataSymbol
                        ? `${this.rawInfo.showPositiveSign && Number(row[index]) > 0 ? '+' : ''}${column.simpleFormatter(Number(row[index]))}${this.rawInfo.dataSymbol}`
                        : `${this.rawInfo.showPositiveSign && Number(row[index]) > 0 ? '+' : ''}${this.rawInfo.metrics[0].formatValue(row[index])}`,
                }));
                return {
                    name: column.title,
                    type: column.chartType,
                    data,
                    color: index < 1 ? HighChartConfig.colors.dark_blue : HighChartConfig.colors.blue,
                    zIndex: index,
                    pointPlacement: this.rawInfo.chartSettings.spider.enabled ? 'on' : null,
                };
            })
            .value();
    }

    getAnomalySeries() {
        const prepareForAnomalySeries = this.rawInfo.metrics.map((metric, index) => {
            const serieData = {
                name: metric.label,
                data: this.rawInfo.anomalies.map((anomaly) => ({
                    x: anomaly.dateTimePosition,
                    y: anomaly.value,
                    expected: anomaly.expectedValue,
                    isAnomaly: anomaly.anomalyPresent,
                    isThreshold: anomaly.thresholdPresent,
                    isGoodAnomaly: anomaly.anomalyGood,
                    isGoodThreshold: anomaly.thresholdGood,
                    anomaly: false,
                    click: false,
                    original: anomaly,
                }))
                    .sort((a, b) => a.x - b.x),
                metric,
                color: this.getColor(index),
                type: this.rawInfo.type,
                zIndex: this.rawInfo.metrics.length,
                pointPlacement: this.rawInfo.chartSettings.spider.enabled ? 'on' : null,
                custom: {
                    groupings: metric.groupings,
                },
            };

            return serieData;
        });
        const formattedAnomalySeries = this.convertAnomalies(prepareForAnomalySeries);
        const rangeMetricData = this.rawInfo.anomalies.map((anomaly) => ({ x: anomaly.dateTimePosition, low: anomaly.lowerBound, high: anomaly.upperBound })).sort((a, b) => a.x - b.x);

        const rangeSerie = this.rawInfo.metrics.map((metric, index) => {
            return {
                name: 'Range',
                type: 'arearange',
                data: rangeMetricData.map((data) => ({ ...data, formatted: `${metric.formatValue(data.low)} - ${metric.formatValue(data.high)}` })),
                color: this.getColor(index),
                lineWidth: 0,
                showInLegend: false,
                fillOpacity: 0.2,
                visible: true,
                zIndex: 0,
                pointPlacement: (this.rawInfo.chartSettings.spider.enabled ? 'on' : null),
                states: {
                    hover: {
                        enable: false,
                    },
                },
            };
        });

        let plotLines = [];
        if (this.rawInfo.includeTrendDetection) {
            plotLines = this.getTrendPlotLines();
        }

        return _.concat(formattedAnomalySeries, rangeSerie, plotLines);
    }

    getTrendPlotLines() {
        // group anomalies by trendStart to create multiple plotLines
        const plotLines = _.groupBy(this.rawInfo.anomalies, 'trendStart');

        const plots = [];
        _.forEach(plotLines, (trendAnomalies, key) => {
            const keyIndex = Object.keys(plotLines).indexOf(key);
            let trendData = _.map(trendAnomalies, (anomaly) => {
                return {
                    x: anomaly.dateTimePosition,
                    y: anomaly.trend,
                    formatted: `${this.rawInfo.metrics[0].formatTrendValue(anomaly.trendValue)}/${this.getFrequencyForTrendDetails(anomaly.timeResolution)}<br> 
                    Start: ${moment(anomaly.trendStart).format('MMM D, YYYY')}, 
                    End: ${moment(anomaly.trendEnd).format('MMM D, YYYY')}`,
                    trendStart: anomaly.trendStart,
                    trendEnd: anomaly.trendEnd,
                };
            });

            // add to trendData the first point from next trend if there is where trend ends
            if (Object.keys(plotLines)[keyIndex + 1]
                && plotLines[key][plotLines[key].length - 1].trendEnd === plotLines[Object.keys(plotLines)[keyIndex + 1]][0].trendStart) {
                const nextKey = Object.keys(plotLines)[keyIndex + 1];

                trendData = [...trendData, {
                    x: plotLines[nextKey][0].dateTimePosition,
                    y: plotLines[nextKey][0].trend,
                    formatted: `${this.rawInfo.metrics[0].formatTrendValue(plotLines[key][0].trendValue)}/
                                ${this.getFrequencyForTrendDetails(plotLines[key][0].timeResolution)}<br> 
                                Start: ${moment(plotLines[key][0].trendStart).format('MMM D, YYYY')}, 
                                End: ${moment(plotLines[key][0].trendEnd).format('MMM D, YYYY')}`,
                    trendStart: plotLines[key][0].trendStart,
                    trendEnd: plotLines[key][0].trendEnd,
                }];
            }

            plots.push({
                name: 'Trend',
                color: this.rawInfo.highlightTrendChangePosition && Number(key) === this.rawInfo.highlightTrendChangePosition
                    ? (this.rawInfo.isGood ? HighChartConfig.colors.green : HighChartConfig.colors.red) : ' #000000',
                data: trendData,
                states: {
                    hover: {
                        enable: true,
                    },
                },
                zIndex: 2,
                lineWidth: this.rawInfo.highlightTrendChangePosition && Number(key) === this.rawInfo.highlightTrendChangePosition ? 4 : 1,
                showInLegend: false,
            });
        });

        return plots;
    }

    getFrequencyForTrendDetails(actualFrequency) {
        switch (actualFrequency.toLowerCase()) {
            case 'hourly': return 'hour';
            case 'daily': return 'day';
            case 'weekly': return 'week';
            case 'monthly': return 'month';
            default: return '';
        }
    }

    convertAnomalies(series) {
        return series.map((serie) => {
            const serieData = serie.data.map((data) => {
                let dataInfo = {
                    marker: { radius: 0 },
                    formatted: `${serie.metric.formatValue(data.y)} (Expected: ${serie.metric.formatValue(data.expected)})`,
                };

                dataInfo = {
                    ...dataInfo,
                    anomaly: data,
                    marker: {
                        radius: 1,
                        states: {
                            hover: {
                                lineColor: 'black',
                                lineWidth: 2,
                                radius: data.isAnomaly || data.isThreshold ? 10 : 5,
                            },
                            select: {
                                lineColor: 'black',
                                lineWidth: 2,
                                radius: 10,
                                fillColor: data.isGoodAnomaly || data.isGoodThreshold
                                    ? HighChartConfig.colors.green : (data.isGood === false ? HighChartConfig.colors.red : HighChartConfig.colors.gray),
                            },
                        },
                    },
                };

                if (data.isThreshold) {
                    dataInfo = {
                        ...dataInfo,
                        marker: {
                            ...dataInfo.marker,
                            lineWidth: 2,
                            fillColor: 'white',
                            lineColor: data.isGoodThreshold ? HighChartConfig.colors.green : HighChartConfig.colors.red,
                            radius: 3,
                        },
                    };
                }

                if (data.isAnomaly) {
                    dataInfo = {
                        ...dataInfo,
                        marker: {
                            ...dataInfo.marker,
                            lineWidth: 0,
                            lineColor: null,
                            fillColor: data.isGoodAnomaly ? HighChartConfig.colors.green : HighChartConfig.colors.red,
                            radius: 5,
                        },
                    };
                }

                if (this.rawInfo.preselectedPoint && data.x === this.rawInfo.preselectedPoint) {
                    dataInfo = {
                        ...dataInfo,
                        marker: {
                            ...dataInfo.marker,
                            radius: 10,
                        },
                    };
                }

                return { ...data, ...dataInfo };
            });

            serie.allowPointSelect = this.rawInfo.selectablePoints;

            return { ...serie, data: serieData };
        });
    }

    getMarker(data, column) {
        // Only in case we have single chart value we display dots on lines
        let showMarker = ['symbol'].includes(this.rawInfo.subType) || data.filter((item) => item !== null).length === 1;

        if (column && column.settings.useSymbols) {
            showMarker = true;
        }

        return {
            radius: showMarker ? HighChartConfig.marker.radius : 0,
        };
    }

    getColor(i) {
        return HighChartConfig.colors.all[i];
    }
}
