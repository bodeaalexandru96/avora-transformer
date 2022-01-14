import _ from 'lodash';
import Formatter from '../formatters';
import Model from './model';
import HighChartConfig from '../config/highchart.config';
import { summarizeNum } from '../filters/number';
import AxisInfo from './axis-info.model';

export default class RawInfoColumn extends Model {
    constructor(col, index, rawInfo) {
        const column = _.isObject(col) ? { ...col } : { key: col, title: col };
        let metric = {};
        if (column.key) {
            metric = _.find(rawInfo.metrics, ({ columns }) => columns.includes(column.key));
            // custom sql metrics
            column.settings = _.find(rawInfo.chartSettings.metrics, ({ id }) => metric.relationId === id);
            column.position = _.findIndex(rawInfo.columnPosition, ({ id }) => metric.relationId === id);
        }

        if (column.relationId) {
            metric = _.find(rawInfo.metrics, ({ relationId }) => column.relationId === relationId);
            column.position = _.findIndex(rawInfo.columnPosition, ({ id }) => column.relationId === id);
            column.settings = _.find(rawInfo.chartSettings.metrics, ({ id }) => column.relationId === id);
            column.key = { id: column.relationId };
        }

        if (!index && rawInfo.groupings.length) {
            column.groupings = rawInfo.groupings;
        }

        super(column);
        this.rawInfo = rawInfo;
        this.metric = metric || {};
    }

    get title() {
        if (this.attributes.time) {
            const options = {
                isTable: this.rawInfo.type === 'table',
                isPieDonut: this.rawInfo.type !== 'table',
                withYear: true,
                showWeekNumbers: this.rawInfo.showWeekNumbers,
            };
            
            return Formatter.dateFrequencyFormatter(this.time, this.rawInfo.selectedFrequency, options);
        }

        return this.attributes.title || this.metric.name;
    }

    get formattingTitle() {
        return this.attributes.title || this.metric.name;
    }

    get key() {
        return this.attributes.key || this.metric.id;
    }

    set key(val) {
        this.attributes.key = val;
    }

    get data() {
        if (this.rawInfo.groupings.length) {
            return _.snakeCase(this.title.replace(/%/g, 'percent'));
        }
        
        return undefined;
    }

    get zIndex() {
        return this.rawInfo.data.columns.length - this.position;
    }

    get settings() {
        return this.attributes.settings || { leftYAxis: true };
    }

    set settings(val) {
        this.attributes.settings = val;
    }

    get organisation() {
        return this.rawInfo.organisation;
    }

    get chartType() {
        if (this.rawInfo.subType !== 'mixed') return undefined;

        const typeMatch = {
            line: 'line',
            bar: 'column',
            filled_bar: 'column',
            filled_line: 'area',
        };

        const filled = this.rawInfo.chartSettings.fillChart || this.rawInfo.fillChart;
        const type = `${filled ? 'filled_' : ''}${this.settings.chartType}`;
        return _.get(typeMatch, type, this.settings.chartType);
    }

    get columnAvg() {
        const position = this.tableFunctions.getVisibleColumnIndex(this.title, this.key ? this.key.id : null, this.time);
        // if we have a grouping, the results contain values for that grouping as a whole, even if we see 3 columns (under the hood, that's 1 column)
        const index = this.rawInfo.groupings.length > 1 ? position - this.rawInfo.groupings.length + 1 : position;
        // index = (this.rawInfo.data.columns[0].title === 'Date' ? index + 1 : index); // written by Rapha, but I couldn't find yet a case where it's used
        const rows = this.rawInfo.data.rows || this.rawInfo.data.results;
        const rowValuesWithoutNull = rows.map((row) => row[index]).filter((x) => x);
        return _.meanBy(rowValuesWithoutNull);
    }

    simpleFormatter(value) {
        let formatted = value;
        let symbol = '';
        const org = _.pick(this.organisation, ['useRounding', 'numberOfDecimals', 'dateFormat']);

        if (this.formula) {
            const axis = (new AxisInfo({ symbol: this.formula.type }));
            symbol = this.formula.type;
            formatted = Formatter.guessAndFormat(null, value, this.formula.decimals, org, axis.type, symbol);
        } else if (this.metric.yAxis) {
            symbol = this.metric.yAxis.symbol;
            formatted = this.metric.formatValue(value);
        } else {
            formatted = Formatter.guessAndFormat(this.title, value, undefined, org);

            if (this.metric.type === '%') {
                symbol = '%';
            }
        }

        formatted = Formatter.isDateAndTime(formatted) ? formatted : Formatter.numberGetPrefixSuffix(formatted, true);

        if (this.groupings) {
            try {
                formatted = JSON.parse(formatted).join(', ');
            } catch (e) {
                console.log('error');
            }
        }

        const custom = this.getCustomFormats(value) || [];

        formatted = _.reduce(custom, (formattedValue, rule) => {
            if (_.isNumber(rule.decimals)) { // if we have a custom decimals value besides the organisation one
                formattedValue = Formatter.formatDecimals(formattedValue, rule.decimals, org);
            }
            if (rule.useShortNumbers) {
                formattedValue = summarizeNum(formattedValue, symbol);
            }

            if (rule.prefix) {
                formattedValue = `${rule.prefix}${formattedValue}`;
            }

            if (rule.suffix) {
                formattedValue = `${formattedValue}${rule.suffix}`;
            }

            if (!rule.commaSeparator) {
                formattedValue = formattedValue.toString().replace(/,/g, '');
            }
            return formattedValue;
        }, formatted);

        return formatted;
    }

    getCustomFormats(value) {
        if (_.isUndefined(value) || _.isNull(value)) return [];
        return this.rawInfo.formatting
            .filter(({ columns }) => {
                if (!this.key) {
                    return false;
                }
                if (_.isObject(_.first(columns))) {
                    return _.find(columns, this.key);
                }
                return _.includes(columns, this.key);
            })
            .filter((format) => {
                let current = value;
                let valueFrom = format.value;
                let valueTo = format.valueTo;

                if (['decimal', 'percentage'].includes(format.columnType || this.type)) {
                    current = parseFloat(Formatter.numericFormatter(value, false, this.organisation).toString().replace('%', ''));
                    valueFrom = parseFloat(format.value);
                    valueTo = parseFloat(format.valueTo);
                }

                switch (format.operator) {
                    case 'gte':
                        return current >= valueFrom;
                    case 'lte':
                        return current <= valueFrom;
                    case 'gt':
                        return current > valueFrom;
                    case 'lt':
                        return current < valueFrom;
                    case 'between':
                        return current <= valueTo && current >= valueFrom;
                    case 'eq':
                        return current === valueFrom;
                    case 'aa':
                        return current > this.columnAvg;
                    case 'ba':
                        return current < this.columnAvg;
                    default:
                        return true;
                }
            });
    }

    get type() {
        if (this.metric.yAxis) {
            return this.metric.yAxis.type;
        }
        return undefined;
    }

    formatting(value) {
        const formatting = {};
        
        if (this.metric.yAxis) {
            formatting.symbol = this.metric.yAxis.symbol;
            formatting.type = this.metric.yAxis.type;
            formatting.decimals = _.get(this.metric, 'numberOfDecimals', this.rawInfo.organisation.decimalCount);
        } else {
            formatting.type = Formatter.formatGuesser(this.title, value);
            if (formatting.type === 'percentage') {
                formatting.symbol = '%';
            }
            formatting.decimals = this.rawInfo.organisation.decimalCount;
        }

        formatting.custom = this.getCustomFormats(value) || [];

        return { ...formatting, useShortNumbers: this.rawInfo.chartSettings.dataShortNumbers };
    }

    getColor(i) {
        if (this.attributes.color) {
            return this.attributes.color;
        }
        
        if (this.metric.color) {
            return this.metric.color;
        }

        return this.rawInfo.getColor(i) || HighChartConfig.colors.all[i];
    }
}
