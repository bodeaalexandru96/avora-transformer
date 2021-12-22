import _ from 'lodash';
import RawInfoData from './rawInfo-data.model';
import RawInfoFrequencies from './rawInfo-frequencies';
import Metric from './metric.model';
import Model from './model';

export default class RawInfo extends Model {
    get component() {
        if (['bar', 'pie', 'line', 'donut', 'spline', 'symbol', 'mixed', 'horizontal', 'sunburst', 'treemap', 'bullet',
            'gauge', 'funnel', 'arearange', 'scatter', 'bubble', 'sankey', 'ml'].includes(this.type)) {
            return 'card-chart';
        }

        if (this.attributes.type === 'numeric') {
            return this.visibleMetrics.length > 1 ? 'card-table' : 'card-numeric';
        }
        return `card-${this.attributes.type}`;
    }

    get data() {
        return this.mapped.data;
    }

    set data(data) {
        this.attributes.data = data;
        this.mapped.data = (new RawInfoData({ ...data, rawInfo: this }));
    }

    get metrics() {
        return this.mapped.metrics;
    }

    set metrics(metrics) {
        this.attributes.metrics = metrics;
        this.mapped.metrics = _.map(metrics, (metric) => (new Metric({ ...metric, organisation: this.organisation })));
    }

    get visibleMetrics() {
        const metrics = this.mapped.metrics;
        return _(this.chartSettings.metrics)
            .map((attrs) => {
                const base = _.find(metrics, ({ id, relationId }) => [id, relationId].includes(attrs.id));
                return base ? base.fill(attrs) : new Metric({ ...attrs, organisation: this.organisation });
            })
            .reject('hidden')
            .value();
    }

    isMetric(column) {
        const metricIds = this.chartSettings.metrics.map((metric) => metric.id);
        const columnId = column.relationId || column.id;

        return metricIds.includes(columnId);
    }

    get isTotalTable() {
        return this.metrics.length > 1 && this.selectedFrequency === 'Total' && !this.groupings.length;
    }

    get shouldNestedHeaders() {
        return this.groupings.length && this.visibleMetrics.length > 1 && this.selectedFrequency !== 'Total';
    }

    get chartSettings() {
        let chartSettings;

        if (this.attributes.chartSettings) {
            chartSettings = this.attributes.chartSettings;
        }

        return _.defaultsDeep(chartSettings || {}, {
            leftYAxis: {
                autoScale: true,
                show: true,
            },
            metrics: this.metrics.map(({ id, name, hidden }) => ({
                chartType: this.type,
                hidden,
                id,
                leftYAxis: true,
                name,
                type: 'metric',
                useSymbols: false,
            })),
            legend: {},
            rightYAxis: {},
            spider: {},
            valueLabels: {},
            xAxis: {
                show: true,
            },
            stacked: this.attributes.subType === 'stacked',
        });
    }

    set chartSettings(val) {
        this.attributes.chartSettings = val;
    }

    get frequencies() {
        return new RawInfoFrequencies(this);
    }

    get drill() {
        return { isActive: _.get(this.attributes, 'drill.isActive', false) };
    }

    get hasYAxis() {
        return [
            'line', 'spline', 'symbol', 'mixed', 'bar', 'horizontal', 'arearange', 'bubble', 'bullet', 'stacked',
        ].includes(this.attributes.subType);
    }

    get hasData() {
        if (!this.visibleMetrics.length) {
            return true;
        }
        return !!(this.data.rows && this.data.rows.length);
    }

    get hasCustomHeight() {
        if (!this.attributes.customHeight !== undefined && this.attributes.customHeight > 150) {
            return true;
        }

        return false;
    }

    // todo: delete after DEV-6063
    get tableTotals() {
        if (this.attributes.tableTotals) {
            return this.attributes.tableTotals;
        }

        if (this.showTableTotals) {
            return [null, 67856, 261406, -194854, 1903514];
        }
        return [];
    }

    getDefaultColor(i) {
        let color = null;

        if (this.theme && this.theme.useCustomTheme
            && !this.theme.colors.useOrganisationChartColors) {
            color = this.theme.colors.chart[i];
        }

        return color;
    }
}
