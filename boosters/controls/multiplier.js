const Model = require("./model.js");

class Control extends Model {

    async processing()
    {
        if (this._processed)
            return this._processed;

        this._multiplier -= 0;

        if (!isNaN(this._multiplier) && this._multiplier > 0)
            return this._processed = {[this._field] : ['max']};

        return false;
    }

    async execute(data)
    {
        if (this._executed)
            return this._executed;

        data[this._field + '_max'].value = Math.floor(data[this._field + '_max'].value ?? 0);

        let _multiplier = (this._multiplier > 1 ? (this._multiplier - 1) : - this._multiplier);

        if (await super.execute(data) !== false && typeof data[this._field + '_max'] != 'undefined' && data[this._field + '_max'].value > 0)
            return "(" + this._field_static + '_value'
                + " / "
                + data[this._field + '_max'].value + "L"
                + ") * "
                + _multiplier;

        return false;
    }
}

module.exports = Control;