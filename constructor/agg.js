const elasticsearch = require("../../modules/connections/elasticsearch.js");
const collect = require("../collects/agg.js");

class Constructor {

    constructor(search, params, context)
    {
        this.params = params;
        this.context = context;
        this._prepare = false;
        this._execute = false;
    }

    async prepare()
    {
        if (this._prepare)
            return this._prepare;

        return this._prepare = this.context[this.params.source] ?? null;
    }

    async execute()
    {
        if (await this.prepare()) {

            if (!this._execute) {

                let _donor = await this._prepare.getExecute();

                if (typeof _donor.body == 'object' && typeof _donor.body.aggregations == 'object')
                    this._execute = _donor.body.aggregations;
            }

            return await (new collect(this._execute, this.params)).get();
        }

        return {};
    }
}

module.exports = Constructor;