/* eslint-disable no-mixed-operators */
/* eslint-disable no-unused-vars */
import _ from 'lodash';
import tracker from '../../../plugins/tracker';
import HighChartConfig from '../config/highchart.config';

export default class ChartScatterDecorator {
    constructor(rawInfo, options) {
        this.rawInfo = rawInfo;
        this.options = options;
    }

    get metrics() {
        return this.rawInfo.visibleMetrics;
    }

    get series() {
        const isGroupings = this.rawInfo.groupings.length > 0;
        const isTotal = this.rawInfo.selectedFrequency === 'Total';

        if (isGroupings && isTotal) {
            console.log('getGroupSeriesWithTotals');
            return this.getGroupSeriesWithTotals();
        }
        if (isGroupings && !isTotal) {
            console.log('getGroupSeries');
            return this.getGroupSeries();
        }
        console.log('getSimpleSeries');
        return this.getSimpleSeries();
    }

    static decorate(options, rawInfo, ctx) {
        tracker.start('decorate-scatter');

        if (!['scatter'].includes(options.chart.type)) {
            tracker.stop('decorate-scatter');
            return options;
        }

        const self = new ChartScatterDecorator(rawInfo, options);
        const result = self.decorateOptions(options);

        tracker.stop('decorate-scatter');
        return result;
    }

    decorateOptions(options) {
        options.series = this.series;

        options.xAxis = {
            ...options.xAxis,
            title: { text: this.rawInfo.chartSettings.scatter.xAxisMetric.name || '' },
            type: this.rawInfo.chartSettings.scatter.xAxisMetric.type,
        };

        options.yAxis[0] = {
            ...options.yAxis[0],
            title: { text: this.rawInfo.chartSettings.scatter.yAxisMetric.name || '' },
            visible: true,
        };

        // Add tooltip settings
        options.tooltip = {
            headerFormat: '',
        };

        options.plotOptions.scatter = {
            marker: {
                enabled: true,
                radius: 5,
                states: {
                    hover: {
                        enabled: true,
                        lineColor: 'rgb(100,100,100)',
                    },
                },
            },
            states: {
                hover: {
                    marker: {
                        enabled: false,
                    },
                },
            },
        };

        options.plotOptions.series.lineWidth = undefined;

        return options;
    }

    // Options used by tooltip
    get customOptions() {
        const xMetric = this.getXAxisMetric();
        const yMetric = this.getYAxisMetric();
        return {
            type: 'scatter',
            x: {
                metric: {
                    name: xMetric.label || 'x',
                    type: xMetric.type,
                },
                formatting: {
                    decimals: xMetric.decimals,
                    ...xMetric.getFormattingInfo(),
                },
            },
            y: {
                metric: {
                    name: yMetric.label || 'y',
                    type: yMetric.type,
                },
                formatting: {
                    decimals: yMetric.decimals,
                    ...yMetric.getFormattingInfo(),
                },
            },
            z: {
                formatting: {
                    type: this.rawInfo.selectedFrequency === 'Total' ? 'string' : 'date',
                },
            },
        };
    }

    getXYIndexes() {
        // xAxisMetric and yAxisMetric are equal when rawInfo have only one metric
        // zAxisMetric is used for tooltip value (Date)
        const xAxisMetric = this.getXAxisMetric();
        const yAxisMetric = this.getYAxisMetric();
        const groupingsLength = this.rawInfo.groupings.length;

        // find the location of the dimensions used for x and y
        // handle also the reordering or columns or the change of the metrics used for axis
        let xIndex = _.findIndex(this.rawInfo.data.mappedColumns, ['relationId', xAxisMetric.id]);
        let yIndex = _.findIndex(this.rawInfo.data.mappedColumns, ['relationId', yAxisMetric.id]);

        // sometimes BE sends only zAxis (Date) in mappedColumns, so we don't find the axis column
        // we go with the flow (first column is x, second one is y)
        // groupings are stored first in the mappedColumns, remove them from the index value
        xIndex = xIndex === -1 ? 0 : xIndex - groupingsLength;
        yIndex = yIndex === -1 ? 1 : yIndex - groupingsLength;

        return { xIndex, yIndex };
    }

    getSimpleSeries() {
        // used for tooltip z value (Date)
        const seriesName = this.rawInfo.data.mappedColumns[0].title;
        const name = this.rawInfo.selectedFrequency === 'Total' ? 'Total' : seriesName;

        // dimension 0 holds the info about Date
        const zIndex = 0;
        const { xIndex, yIndex } = this.getXYIndexes();

        const data = _.map(this.rawInfo.data.rows, (row, index) => {
            const z = this.rawInfo.selectedFrequency === 'Total' ? 'Total' : row[zIndex];
            return { x: row[xIndex], y: row[yIndex], z };
        });

        return [{ name, color: this.getColor(0), data, custom: this.customOptions }];
    }

    getGroupSeries() {
        // each data point has metrics.length
        // we need to find which ones are used for x, y, and z in the plot
        const groupingsLength = this.rawInfo.groupings.length;
        const dimensionsLength = this.rawInfo.visibleMetrics.length;

        // find which dimension is used of x and y
        const { xIndex, yIndex } = this.getXYIndexes();

        // each row is a different serie
        return _.map(this.rawInfo.data.rows, (row, index) => {
            const color = this.getColor(index);
            // row[0] holds data related to groupings (name of the current group)
            const name = JSON.parse(row[0]).join(', ');
            // slice the first item of the row
            // now row holds all the data as a 1D array
            // chunk it into groups of dimensionsLength, each group representing a multi-dimension datapoint
            // map each group to { x, y, z } values, resulting the series data
            // z is used for tooltip
            const data = _(row).slice(1).chunk(dimensionsLength).map((group, index) => {
                // find the column which holds information about the Date of the current datapoint
                const zIndex = (index * dimensionsLength) + groupingsLength;
                const zColumn = this.rawInfo.data.mappedColumns[zIndex];

                return { x: group[xIndex], y: group[yIndex], z: zColumn.time };
            })
                .value();

            return { name, color, data, custom: this.customOptions };
        });
    }

    getGroupSeriesWithTotals() {
        const legendDimension = this.rawInfo.chartSettings.scatter.dimension;
        const legendDimensionIndex = _(this.rawInfo.columnPosition).filter({ type: 'dimension' }).findIndex({ id: legendDimension.id });
        const xAxisMetric = this.getXAxisMetric();
        const yAxisMetric = this.getYAxisMetric();
        const xIndex = _(this.rawInfo.columnPosition).filter((col) => col.type === 'metric').findIndex({ id: xAxisMetric.id });
        const yIndex = _(this.rawInfo.columnPosition).filter((col) => col.type === 'metric').findIndex({ id: yAxisMetric.id });

        const dimensionsLength = this.rawInfo.visibleMetrics.length;
        const series = _(this.rawInfo.data.rows).reduce((result, row) => {
            const groupDataArray = JSON.parse(row[0]);
            const name = groupDataArray[legendDimensionIndex];
            const groupName = _.without(groupDataArray, name).join(', ');
            const data = _(row).slice(1).chunk(dimensionsLength).map((group) => {
                return { x: group[xIndex], y: group[yIndex], z: groupName };
            })
                .value();

            const rowData = result[name] ? [...result[name], ...data] : [...data];
            return {
                ...result,
                [name]: rowData,
            };
        }, {});

        const seriesNames = Object.keys(series);
        return _.map(series, (data, name) => {
            const color = this.getColor(_.indexOf(seriesNames, name));
            return { name, data, color, custom: this.customOptions };
        });
    }

    getMarker(data, column) {
        // Only in case we have single chart value we display dots on lines
        let showMarker = ['symbol'].includes(this.rawInfo.subType) || data.filter((item) => _.values(item)[1] !== null).length === 1;

        if (column && column.settings.useSymbols) {
            showMarker = true;
        }

        return {
            radius: showMarker ? HighChartConfig.marker.radius : 0,
        };
    }

    getColor(i) {
        let hex = HighChartConfig.colors.all[i % HighChartConfig.colors.all.length];
        const opacity = 50;
        hex = hex.replace('#', '');
        const r = parseInt(hex.substring(0, hex.length / 3), 16);
        const g = parseInt(hex.substring(hex.length / 3, 2 * hex.length / 3), 16);
        const b = parseInt(hex.substring(2 * hex.length / 3, 3 * hex.length / 3), 16);

        return `rgba(${r},${g},${b},${opacity / 100})`;
    }

    getXAxisMetric() {
        return this.metrics.find((metric) => metric.id === this.rawInfo.chartSettings.scatter.xAxisMetric.id);
    }

    getYAxisMetric() {
        return this.metrics.find((metric) => metric.id === this.rawInfo.chartSettings.scatter.yAxisMetric.id);
    }
}
