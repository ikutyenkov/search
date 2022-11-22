const Model = require('./model.js');
const params = require("../../../modules/params/module.js");

class Filter extends Model {

    constructor(collect, params)
    {
        super(collect, params);
        this.paramsCollect = false;
    }

    async _prepare()
    {
        this.paramsCollect = false;

        if (typeof this.params.table != '') {

            this.paramsCollect = new params(this.params.table);
            await this.paramsCollect.prepare();
            return true;
        }

        return false;
    }

    async _processing(item, index)
    {
        if (await this._prepare() &&  typeof item['params'] != 'undefined') {

            let processed = {};

            if (this.paramsCollect) {

                for (let _id of Object.keys(item['params'])) {

                    let _param = await this.paramsCollect.get(_id);

                    if (_param) {

                        let _value = await _param.get(item['params'][_id]);

                        if (_value !== false)
                            processed[_param.name] = _value;
                    }
                }
            }

            item['params'] = processed;
        }

        return item;
    }
}

module.exports = Filter;