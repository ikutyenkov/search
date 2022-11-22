const Model = require("./model.js");

class Control extends Model {

    constructor(field, multiplier, exemplar) {

        let _fieldPieces = field.split('.');
        let _value = _fieldPieces.pop();
        field = _fieldPieces.join('.');

        super(field, multiplier, exemplar);

        this._value = _value;
    }

    async processing()
    {
        return false;
    }

    async prepare()
    {
        if (this._prepared)
            return this._prepared;

        await super.prepare();

        this._prepared.push("long " + this._field_static + "_multiplier_sum = 0;");
        this._prepared.push("List " + this._field_static + "_multiplier_keys = new ArrayList();");
        this._prepared.push("List " + this._field_static + "_multiplier_values = new ArrayList();");

        return this._prepared;
    }

    async execute(data)
    {
        if (this._executed)
            return this._executed;

        this._variables = [(this._field_static + "_multiplier_keys.add(" + ((this._value - 0) * 100) + "L);")];
        this._variables.push(this._field_static + "_multiplier_values.add(" + ((this._multiplier > 1 ? (this._multiplier - 1) : - this._multiplier) * 100) + "L);");

        return this._executed = this._field_static + "_multiplier_sum";
    }

    async calculation()
    {
        if (this._calculation)
            return this._calculation;

        return this._calculation = ["for (int i = 0; i < " + this._field_static + "_multiplier_keys.length; i++) {" + this._field_static + "_multiplier_sum = (" + this._field_static + "_value == " + this._field_static + "_multiplier_keys[i] ? " + this._field_static + "_multiplier_values[i] : " + this._field_static + "_multiplier_sum);}"];
    }
}

module.exports = Control;