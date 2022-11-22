const Model = require("./model.js");

class Control extends Model {

    async processing()
    {
        if (this._processed)
            return this._processed;

        this._multiplier -= 0;

        if (!isNaN(this._multiplier) && this._multiplier > 0)
            return this._processed = {[this._field] : ['max', 'avg']};

        return false;
    }

    async execute(data)
    {
        if (this._executed)
            return this._executed;

        data[this._field + '_avg'].value = Math.floor(data[this._field + '_avg'].value ?? 0);
        data[this._field + '_max'].value = Math.floor(data[this._field + '_max'].value ?? 0);

        let _multiplier = (this._multiplier > 1 ? (this._multiplier - 1) : - this._multiplier);
        let _multiplierAvg = data[this._field + '_avg'].value / data[this._field + '_max'].value;

            _multiplierAvg = (_multiplier * (_multiplierAvg > 0.5 ? _multiplierAvg : 0.5));

        if (await super.execute(data) !== false && typeof data[this._field + '_max'] != 'undefined' && data[this._field + '_max'].value > 0)
            return this._field_static + '_value'
                + " <= "
                + data[this._field + '_avg'].value * 100 + "L"
                + " ? ("
                + this._field_static + '_value'
                + " / "
                + data[this._field + '_avg'].value + "L"
                + " * "
                + _multiplierAvg
                + ") : ((("
                + this._field_static + '_value'
                + " - "
                + data[this._field + '_avg'].value + "L"
                + ") / "
                + data[this._field + '_max'].value + "L"
                + " * "
                + (_multiplier - _multiplierAvg) + ") + "
                + _multiplierAvg * 100
                + ")";

        return false;
    }
}

module.exports = Control;