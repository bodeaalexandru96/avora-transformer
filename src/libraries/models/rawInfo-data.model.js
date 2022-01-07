/* eslint-disable max-classes-per-file */
import _ from 'lodash';
import RawInfoColumn from './rawInfo-column';
import Model from './model';

export default class RawInfoData extends Model {
    get columns() {
        return this.attributes.columns;
    }

    set columns(val) {
        this.attributes.columns = val;
        this.mappedColumns = _(this.attributes.columns)
            .map((col, index) => (new RawInfoColumn(col, index, this.attributes.rawInfo)))
            .value();
    }

    get rows() {
        return this.attributes.results || [];
    }

    get date() {
        return this.dateInfo;
    }

    get averages() {
        return _.reduce(this.mappedColumns, (averages, _col, index) => {
            const groups = this.rawInfo.groupings.length - 1;
            if (groups < index) {
                averages[(index + groups)] = _.meanBy(this.rows, (row) => row[index - groups]);
            }
            return averages;
        }, {});
    }
}
