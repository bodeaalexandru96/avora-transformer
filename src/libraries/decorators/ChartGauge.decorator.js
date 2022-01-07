import _ from 'lodash';
import tracker from '../../plugins/tracker';

export default class ChartGaugeDecorator {
    constructor(rawInfo) {
        this.rawInfo = rawInfo;
        this.value = 0;
    }

    gaugePlotOptionsSeries(series) {
        const gaugeOptions = {
            marker: {
                enabled: false,
            },
            dataLabels: {
                format: _.toString(this.value),
                style: {
                    textOutline: false,
                },
            },
        };
        return { ...series, ...gaugeOptions };
    }

    get series() {
        return {
            data: [this.value],
            dataLabels: {
                y: 40,
                borderWidth: 0,
                useHTML: true,
            },
            innerRadius: '100%',
            radius: '80%',
            dial: {
                backgroundColor: '#434343',
                borderColor: '#434343',
            },
            pivot: {
                backgroundColor: '#434343',
                borderColor: '#434343',
            },
            custom: {
                groupings: this.rawInfo.groupings,
                formatting: {
                    info: {
                        type: 'numeric',
                        symbol: '',
                    },
                },
                metric: {
                    id: this.getMetric().id,
                    name: this.getMetric().name,
                    type: this.getMetric().type,
                    numberOfDecimals: this.getMetric().decimals,
                },
            },
        };
    }

    get pane() {
        const pane = {
            center: ['50%', '85%'],
            size: '100%',
            startAngle: -90,
            endAngle: 90,
            background: {
                backgroundColor: '#EEEEEE',
                innerRadius: '60%',
                outerRadius: '100%',
                shape: 'arc',
            },
        };
        return pane;
    }

    get yAxisPlotBands() {
        if (this.rawInfo.goal !== null) {
            return [{
                color: this.goalColor,
                from: this.min,
                to: this.rawInfo.goal,
                innerRadius: '60%',
                outerRadius: '100%',
            }, {
                color: this.goalReached ? 'rgba(22, 160, 133, .2)' : 'rgba(192, 57, 43, .2)',
                from: this.min,
                to: this.value,
                innerRadius: '60%',
                outerRadius: '80%',
            }];
        }
        return [];
    }

    get min() {
        let min = 0;
        
        const value = this.value;
        const goal = this.rawInfo.goal;

        const smallerValue = Math.min(value, goal);
        
        if (smallerValue < 0) min = smallerValue * 1.2;
        
        if (smallerValue === 0) {
            if (smallerValue === goal) min = -(value * 0.2);
        }
        
        return this.roundNumber(min);
    }
    
    get max() {
        let max = 0;
        
        const value = this.value;
        const goal = this.rawInfo.goal;
        const greaterValue = Math.max(value, goal);
        
        if (greaterValue > 0) {
            max = greaterValue * 1.2;
        }
        
        if (greaterValue === 0) {
            if (greaterValue === value) max = value * 0.2;
        }
        
        return this.roundNumber(max);
    }

    get goalReached() {
        if (this.isIncrease) {
            return this.value >= this.rawInfo.goal;
        }
        
        return this.value <= this.rawInfo.goal;
    }

    get goalColor() {
        const color = this.getMetric() && this.getMetric().color;
        
        return color || '#7FC3F1';
    }

    get isIncrease() {
        return this.getMetric() && this.getMetric().isIncrease;
    }

    /**
     * Round number to nearest 10, 100, 1000, etc. unit
     * For example 55 will become 60 and 563.550 will become 600k
     */
    roundNumber(number) {
        const isNegative = number < 0;

        number = Math.abs(number);
        
        const rounding = parseInt(1 + '0'.repeat(parseInt(number).toString().length - 1));
        
        number = number ? Math.ceil(number / rounding) * rounding : number;
        
        return isNegative ? -number : number;
    }

    getMetric() {
        return this.rawInfo.metrics.find((metric) => !metric.hidden);
    }

    static decorate(options, rawInfo) {
        tracker.start('decorate-gauge');
        if (!['gauge'].includes(rawInfo.type)) {
            tracker.stop('decorate-gauge');
            return options;
        }

        const self = new ChartGaugeDecorator(rawInfo);
        const result = self.decorateOptions(options);

        tracker.stop('decorate-gauge');
        return result;
    }

    decorateOptions(options) {
        // calculate the value
        this.rawInfo.data.rows.forEach((val) => { this.value += val[1]; });
        const numberOfDecimals = this.getMetric().decimals;
        if (_.isNumber(numberOfDecimals)) {
            this.value = Math.round(this.value * (10 ** numberOfDecimals)) / (10 ** numberOfDecimals);
        } else {
            this.value = Math.round(this.value);
        }

        options.legend = {
            ...options.legend,
        };
        
        options.chart = {
            ...options.chart,
            renderTo: {},
            backgroundColor: 'transparent',
            events: {},
        };

        options.tooltip = {
            ...options.tooltip,
            crosshairs: false,
            shared: true,
            enabled: false,
        };
        
        options.plotOptions.series = this.gaugePlotOptionsSeries(options.plotOptions.series);
        options.pane = this.pane;
        options.series = [this.series];

        options.yAxis = _.map(options.yAxis, (el) => {
            return {
                ...el,
                title: true,
                visible: this.rawInfo.chartSettings.leftYAxis.show,
                lineWidth: 0,
                minorTickInterval: null,
                tickAmount: 2,
                tickWidth: 0,
                startOnTick: true,
                labels: { y: 16 },
                tickPositions: [this.min, this.max],
                min: this.min,
                max: this.max,
                plotBands: this.yAxisPlotBands,
                index: 0,
                events: {},
                endOnTick: undefined,
                gridLineInterpolation: undefined,
                custom: {
                    prefix: '',
                    suffix: '',
                },
            };
        });

        options.xAxis = {
            ...options.xAxis,
            categories: undefined,
            title: false,
        };

        return options;
    }
}
