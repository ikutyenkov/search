const Model = require("./model.js");
const vars = require("../../modules/functions/vars.js");
const collect = require("../collects/params.js");
const params = new (require("../../modules/params/module.js"))('goods');

class Constructor extends Model {

    constructor(search, params)
    {
        super(search, params, collect);
    }

    async prepare()
    {
        for (let _key in (this.params.filter ?? {})) {

            if (_key === 'external_id' && typeof this.params.filter[_key] == 'string' && isNaN(this.params.filter[_key] - 0))
                this.params.filter[_key] = (await params.getByName( this.params.filter[_key] )).id || 0;
        }

        return await super.prepare();
    }
}

module.exports = Constructor;