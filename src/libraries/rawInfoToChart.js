import _ from 'lodash';
import RawInfoToData from './rawInfoToData';
import ChartPieDecorator from './decorators/ChartPieChart.decorator';
import ChartGaugeDecorator from './decorators/ChartGauge.decorator';
import ChartPlotOptionsDecorator from './decorators/ChartPlotOptions.decorator';
import ChartResponsiveDecorator from './decorators/ChartResponsive.decorator';
import ChartSeriesDecorator from './decorators/ChartSeries.decorator';
import ChartTrendlineDecorator from './decorators/ChartTrendline.decorator';
import ChartTypeDecorator from './decorators/ChartType.decorator';
import ChartxAxisDecorator from './decorators/ChartxAxis.decorator';
import ChartyAxisDecorator from './decorators/ChartyAxis.decorator';
import ChartScatterDecorator from './decorators/ChartScatter.decorator';

class RawInfoToChart extends RawInfoToData {
    get isHighchart() {
        return [
            'line', 'spline', 'symbol', 'mixed', 'bar', 'horizontal', 'sunburst', 'treemap', 'bullet',
            'gauge', 'pie', 'donut', 'funnel', 'arearange', 'scatter', 'bubble', 'sankey',
        ].includes(this.type);
    }

    transform() {
        const decorators = [
            ChartTypeDecorator,
            ChartSeriesDecorator,
            ChartxAxisDecorator,
            ChartyAxisDecorator,
            ChartPlotOptionsDecorator,
            ChartTrendlineDecorator,
            ChartResponsiveDecorator,
            ChartPieDecorator,
            ChartScatterDecorator,
            ChartGaugeDecorator,
        ];

        const defaultOptions = {
            chart: {
                backgroundColor: 'transparent',
                zoomType: 'xy',
                polar: !!this.rawInfo.chartSettings.spider.enabled,
                type: this.type,
                name: this.rawInfo.name,
            },
            legend: {
                enabled: this.rawInfo.chartSettings.legend.show || _.isUndefined(this.rawInfo.chartSettings.legend.show),
            },
            tooltip: {
                crosshairs: true,
                shared: true,
                outside: true,
                valueDecimals: 2,
                hideDelay: 0,
                followPointer: true,
            },
            drilldown: {
                series: [],
            },
            settings: {
                showLabels: this.rawInfo.chartSettings.valueLabels.show,
            },
        };

        if (this.rawInfo.hasCustomHeight) {
            defaultOptions.chart.height = this.rawInfo.customHeight;// restrict height of chart especially line
        }
        
        if ((this.rawInfo.anomalies && this.rawInfo.anomalies.length) || this.rawInfo.isContext) {
            defaultOptions.tooltip.outside = false;
        }

        return _.reduce(decorators, (options, decorator) => {
            return decorator.decorate(options, this.rawInfo);
        }, defaultOptions);
    }
}

export default RawInfoToChart;
