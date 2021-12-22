import _ from 'lodash';
import Config from '../config';
import Model from './model';

export default class AxisInfo extends Model {
    get type() {
        const symbolType = AxisInfo.getTypeWithSymbol(this.symbol);
        return symbolType || this.attributes.type;
    }

    set type(val) {
        this.attributes.type = val;
    }

    get label() {
        if (!this.attributes.label && this.type) {
            return _.capitalize(this.type);
        }
        return this.attributes.label;
    }

    set label(val) {
        this.attributes.label = val;
    }

    get symbol() {
        return this.attributes.symbol || 123;
    }

    set symbol(val) {
        this.attributes.symbol = val;
    }

    get prefix() {
        if (this.type === 'currency') {
            return this.symbol;
        }
        return '';
    }

    get suffix() {
        if (this.type === 'percentage') {
            return '%';
        }
        return '';
    }

    static getTypeWithSymbol(symbol) {
        return Config.symbolTypeMap[symbol] || null;
    }

    toJSON() {
        return {
            type: this.type,
            label: this.label,
            symbol: this.symbol,
        };
    }
}
