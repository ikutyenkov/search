const Model = require('./model.js');
const vars = require("../../../modules/functions/vars.js");

class Filter extends Model {

    constructor(collect, params)
    {
        super(collect, params);
    }

    async _prepare()
    {
        if (typeof this.params.target == 'string' && this.params.target !== '') this.params.target = [this.params.target];

        return true;
    }

    async _processing(item)
    {
        if (typeof this.params.target == 'object' && this.params.target) {

            for (let index in this.params.target) {

                if (typeof item[ this.params.target[index] ] != 'undefined')
                    item[ this.params.target[index] ] = (typeof item[ this.params.target[index] ] == 'object') ? this._processingObject(item[ this.params.target[index] ]) : this._processingValue(item[ this.params.target[index] ]);
            }
        } else {
            item = this._processingObject(item);
        }

        return item;
    }

    _processingObject(object)
    {
        let _object = {};

        for (let key in object)
            _object[this._processingValue(key)] = object[key];

        return _object;
    }

    _processingValue(value)
    {
        let _valueClear = vars.intKeyToNumeric(value);

        if (['number'].includes(typeof _valueClear) && !isNaN(_valueClear - 0)) {

            let _value = _valueClear - 0;

            if (!isNaN(_value)) value = ((_valueClear != value) ? '_' : 0) + _value / 1000;
        }

        return value;
    }
}

module.exports = Filter;