import _ from 'lodash';
import Formatter from '../formatters';
import AxisInfo from './axis-info.model';
import Model from './model';

const METRIC_TYPE = {
    SQL_BASED: 'sqlTable',
    DYNAMIC: 'dynamicRelation',
};

const DEFAULTS = {
    name: '',
    source: '',
    owner: null,
    active: true,
    statement: '',
    type: 'Chart',
    description: '',
    dateColumn: null,
    isIncrease: true,
    frequencies: null,
    dateFieldIndex: 0,
    availableTypes: [],
    functionType: 'sum',
    availableColumns: [],
    numberOfDecimals: null,
    defaultFrequency: null,
    complexity: 'dynamicRelation',
    yAxis: new AxisInfo({ symbol: 123 }).toJSON(),
};

export default class Metric extends Model {
    constructor(attributes) {
        super({ ...DEFAULTS, ...attributes });
    }

    get dateFieldIndex() {
        return _.isNumber(this.attributes.dateFieldIndex) ? this.attributes.dateFieldIndex : DEFAULTS.dateFieldIndex;
    }

    set dateFieldIndex(val) {
        this.attributes.dateFieldIndex = val;
    }

    get isIncrease() {
        return this.attributes.isIncrease !== undefined ? this.attributes.isIncrease : DEFAULTS.isIncrease;
    }

    set isIncrease(val) {
        this.attributes.isIncrease = val;
    }

    get numberOfDecimals() {
        return _.isNumber(this.attributes.numberOfDecimals) ? this.attributes.numberOfDecimals : null;
    }

    set numberOfDecimals(val) {
        this.attributes.numberOfDecimals = val;
    }

    get decimals() {
        if (!_.isNull(this.numberOfDecimals)) {
            return this.numberOfDecimals;
        }

        return 2;
    }

    get label() {
        return this.name;
    }

    get yAxis() {
        return new AxisInfo(this.attributes.yAxis || { symbol: 123 });
    }

    set yAxis(val) {
        this.attributes.yAxis = val;
    }

    getYAxisInfo() {
        const info = _.cloneDeep(this.attributes.yAxis) || new AxisInfo(this.attributes.subType, this.attributes.symbol);

        if (info.type === 'numeric') info.symbol = '123';
        if (info.type === 'time') info.symbol = 'time';

        return info;
    }

    getUnitInfo() {
        return this.subType && new AxisInfo(this.subType, this.symbol);
    }

    getFormattingInfo() {
        return this.getYAxisInfo() || this.getUnitInfo();
    }

    isSQLBased() {
        return this.complexity === METRIC_TYPE.SQL_BASED || this.complexity === 'nested';
    }

    get filters() {
        return _(this.getters['metricFilters/mappedFilters'])
            .keyBy('id')
            .pick(this.state.metrics.filters[this.id])
            .sortBy('chainLetter')
            .value();
    }

    get filterRule() {
        return _.get(this.state.metricFilters, `rules.${this.id}`);
    }

    get rawInfos() {
        return _(this.getters['metrics/affectedRawInfos'])
            .keyBy('id')
            .pick(this.state.metrics.rawInfos[this.id])
            .sortBy('name')
            .value();
    }

    get dateColumn() {
        return _(this.getters['columns/mappedList']).keyBy('id').get(this.attributes.dateColumn);
    }

    set dateColumn(val) {
        this.attributes.dateColumn = val;
    }

    get statement() {
        return this.convertStatementFromServer(this.attributes.statement);
    }

    set statement(val) {
        this.attributes.statement = val;
    }

    convertStatementFromServer(statement) {
        const tables = this.groupByTableAndSortByLength(this.table.availableColumns);

        if (statement) {
            tables.forEach((items) => {
                items.forEach((column) => {
                    statement = statement.replaceAll(`{${column.id}}`, `${column.table.name}.${column.name}`);
                });
            });
        }

        return statement;
    }

    convertStatementForServer(statement) {
        const tables = this.groupByTableAndSortByLength(this.table.availableColumns);

        if (statement) {
            tables.forEach((items) => {
                items.forEach((column) => {
                    statement = statement.replaceAll(`${column.table.name}.${column.name}`, `{${column.id}}`);
                });
            });
        }

        return statement;
    }

    /**
     * Group columns by table and sort them by name (longest first).
     * After that sort tables in same manner (longest table first)
     */
    // eslint-disable-next-line class-methods-use-this
    groupByTableAndSortByLength(columns = []) {
        columns = columns.sort((a, b) => b.name.length - a.name.length);

        const tables = _.groupBy(columns, 'table.name');

        return Object.keys(tables).sort((a, b) => b.length - a.length).reduce((result, key) => {
            result.set(key, tables[key]);
            return result;
        }, new Map());
    }

    formatValue(value) {
        const org = _.pick(this.organisation, ['useRounding', 'numberOfDecimals']);

        if (this.yAxis.type === 'numeric') {
            return Formatter.numericFormatter(value, this.decimals, org);
        }
        if (this.yAxis.type === 'percentage') {
            return Formatter.percentFormatter(value, this.decimals, org);
        }
        if (this.yAxis.type === 'currency') {
            return Formatter.currencyFormatter(value, this.yAxis.symbol, this.decimals, org);
        }
        if (this.yAxis.type === 'time') {
            return Formatter.durationFormatter(value);
        }
        return value || '';
    }

    formatTrendValue(value) {
        const org = _.pick(this.organisation, ['useRounding', 'numberOfDecimals']);

        if (this.yAxis.type === 'numeric') {
            return value > 0 ? `+${Formatter.numericFormatter(value, this.decimals, org)}`
                : Formatter.numericFormatter(value, this.decimals, org);
        }
        if (this.yAxis.type === 'percentage') {
            return value > 0 ? `+${Formatter.percentFormatter(value, this.decimals, org)}`
                : Formatter.percentFormatter(value, this.decimals, org);
        }
        if (this.yAxis.type === 'currency') {
            return Formatter.trendCurrencyFormatter(value, this.yAxis.symbol, this.decimals, org);
        }
        if (this.yAxis.type === 'time') {
            return Formatter.durationFormatter(value);
        }
        return value || '';
    }

    getChartType(filled) {
        const typeMatch = {
            line: 'line',
            bar: 'column',
            filled_bar: 'column',
            filled_line: 'area',
        };
        const type = `${filled ? 'filled_' : ''}${this.chartType}`;
        return _.get(typeMatch, type, this.chartType);
    }
}
