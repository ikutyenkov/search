class Model {

    constructor(field, multiplier, exemplar)
    {
        this._field = field;
        this._field_static = field.split('.').join('_');
        this._multiplier = multiplier;
        this._prepared = false;
        this._processed = false;
        this._executed = false;
        this._variables = false;
        this._calculation = false;
        this._exemplar = exemplar;

        this._compareTypes = {
            "keyword" : 'string',
            "text" : 'string',
            "search_as_you_type" :'string',
            "integer" : 'long',
            "long" : 'long'
        };
    }

    async variables()
    {
        return this._variables;
    }

    async prepare()
    {
        if (this._prepared)
            return this._prepared;

        let _pieces = this._field.split('.');

        this._prepared = false;

            for (let i = _pieces.length - 1; i >= 0; i--)
                this._prepared = "params._source." + _pieces.slice(0, i + 1).join('.') + " == null ? 0 : " + (!this._prepared ? "doc['" + this._field + "'].getValue() * 100" : this._prepared);

        return this._prepared = [(this._prepared ? this._compareTypes[this._exemplar ?? 'integer'] + " " + this._field_static + '_value' + " = (" + this._prepared + ");" : false)];
    }

    async processing()
    {
        return false;
    }

    async execute(data)
    {
        if (this._executed)
            return this._executed;

        if (!this._processed)
            return false;

        return null;
    }

    async calculation()
    {
        if (this._calculation)
            return this._calculation;

        return this._calculation = false;
    }
}

module.exports = Model;