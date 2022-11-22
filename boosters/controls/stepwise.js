const Model = require("./model.js");

class Control extends Model {

    async processing()
    {
        if (this._processed)
            return this._processed;

        this._multiplier -= 0;

        if (!isNaN(this._multiplier) && this._multiplier > 0)
            return this._processed = {[this._field] : ['terms']};

        return false;
    }

    async execute(data)
    {
        if (this._executed)
            return this._executed;

        if (typeof data[this._field + '_terms'] == 'object' && typeof data[this._field + '_terms'].buckets == 'object' && data[this._field + '_terms'].buckets.length > 0) {

            data[this._field + '_terms'].buckets.sort((a, b) => {return a.key - b.key;});

            let _length = (data[this._field + '_terms'].buckets.length > 10 ? 10 : Object.keys(data[this._field + '_terms'].buckets).length);
            let _step = Math.floor(Object.keys(data[this._field + '_terms'].buckets).length / _length);
            let _multiplier = (this._multiplier > 1 ? (this._multiplier - 1) : - this._multiplier) / _length;
            let _scopes = {};

            for (let i = 0; i < _length; i++)
                _scopes[ (data[this._field + '_terms'].buckets[ (i * _step) ].key - 0)  * 100] = (_multiplier * (i + 1)).toFixed(2) * 100;

            if (Object.keys(_scopes).length > 0) {

                this._variables = ["List " + this._field_static + "_multiplier_keys = new ArrayList(); " + this._field_static + "_multiplier_keys.add(" + Object.keys(_scopes).join("L); " + this._field_static + "_multiplier_keys.add(") + "L);"];
                this._variables.push("List " + this._field_static + "_multiplier_values = new ArrayList(); " + this._field_static + "_multiplier_values.add(" + Object.values(_scopes).join("L); " + this._field_static + "_multiplier_values.add(") + "L);");
                this._variables.push("long " + this._field_static + "_multiplier_sum = 0;");
                this._variables.push("for (int i = 0; i < " + this._field_static + "_multiplier_keys.length; i++) {" + this._field_static + "_multiplier_sum = (" + this._field_static + "_value >= " + this._field_static + "_multiplier_keys[i] ? " + this._field_static + "_multiplier_values[i] : " + this._field_static + "_multiplier_sum);}");

                return this._field_static + "_multiplier_sum";
            }
        }

        return false;
    }
}

module.exports = Control;