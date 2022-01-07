import tracker from '../../plugins/tracker';

export default class ChartResponsiveDecorator {
    constructor(rawInfo) {
        this.rawInfo = rawInfo;
    }

    get responsive() {
        const rules = [
            {
                // try making legend names more responsive
                condition: {
                    callback() {
                        if (this.legend.options.layout === 'vertical') {
                            if (this.chartWidth <= 500) {
                                window.maxLegendLength = 30;
                            } else if (this.chartWidth <= 700) {
                                window.maxLegendLength = 40;
                            } else if (this.chartWidth <= 1000) {
                                window.maxLegendLength = 50;
                            } else {
                                window.maxLegendLength = null;
                            }
                        } else if (this.chartWidth <= 500) {
                            window.maxLegendLength = 50;
                        } else if (this.chartWidth <= 700) {
                            window.maxLegendLength = 70;
                        } else if (this.chartWidth <= 1000) {
                            window.maxLegendLength = 90;
                        } else {
                            window.maxLegendLength = null;
                        }

                        return true;
                    },
                },
                chartOptions: {
                    legend: {
                        labelFormatter() {
                            if (!window.maxLegendLength) return this.name;

                            return this.name.length > window.maxLegendLength ? `${this.name.substring(0, window.maxLegendLength)}...` : this.name;
                        },
                    },
                },
            },
            {
                condition: {
                    maxWidth: 500,
                },
                chartOptions: {
                    yAxis: [{
                        title: false,
                    }, {
                        title: false,
                    }],
                    legend: {
                        enabled: false,
                    },
                    chart: {
                        spacingBottom: 15,
                    },
                },
            },
            {
                condition: {
                    maxWidth: 400,
                },
                chartOptions: {
                    legend: {
                        enabled: false,
                    },
                    chart: {
                        spacingBottom: 15,
                    },
                },
            },
            {
                condition: {
                    maxWidth: 200,
                },
                chartOptions: {
                    yAxis: [{
                        labels: {
                            enabled: false,
                        },
                    }, {
                        visible: false,
                    }],
                },
            },
            {
                condition: {
                    maxHeight: 150,
                },
                chartOptions: {
                    xAxis: [{
                        visible: false,
                    }, {
                        visible: false,
                    }],
                    legend: {
                        enabled: false,
                    },
                    chart: {
                        spacingBottom: 15,
                    },
                },
            },

        ];

        if (this.rawInfo.hasYAxis) {
            rules.push({
                condition: {
                    maxWidth: 400,
                },
                chartOptions: {
                    yAxis: [{
                        visible: false,
                    }, {
                        visible: false,
                    }],
                },
            });
        }

        return { rules };
    }

    static decorate(options, rawInfo) {
        tracker.start('decorate-responsive');
        const self = new ChartResponsiveDecorator(rawInfo);
        const results = { ...options, responsive: self.responsive };
        tracker.stop('decorate-responsive');
        return results;
    }
}
