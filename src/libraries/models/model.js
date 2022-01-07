/* eslint-disable no-underscore-dangle */
import _ from 'lodash';
import tracker from '../../plugins/tracker';

export default class Model {
    constructor(attributes = {}) {
        tracker.start('model-const');
        this._attributes = {};
        this.mapped = {};

        this.fill(attributes);
        tracker.stop('model-const', true);
    }

    set attributes(attributes) {
        this._attributes = attributes;
    }

    get attributes() {
        return this._attributes;
    }

    fill(attributes) {
        this.attributes = { ...this.attributes, ...attributes };
        _.each(attributes, (value, key) => {
            const modelDescriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(this), key);

            // We cannot set a value when there is a getter without a setter
            if (_.get(modelDescriptor, 'get') && !_.get(modelDescriptor, 'set')) return;

            this[key] = value;
        });
        return this;
    }
}
