const Model = require('./model.js');
const params = require("../../../modules/params/module.js");
const vars = require("../../../modules/functions/vars.js");

class Filter extends Model {

    constructor(collect, params)
    {
        super(collect, params);
        this.paramsCollect = false;
        this._prepared = false;
    }

    async _prepare()
    {
        if (this._prepared)
            return this._prepared;

        this.paramsCollect = false;

        if (typeof this.params.table != '') {

            this.paramsCollect = new params(this.params.table);
            await this.paramsCollect.prepare();
            return this._prepared = true;
        }

        return this._prepared = false;
    }

    async _processing(item, index)
    {
        if (await this._prepare() &&  typeof index != 'undefined') {

            let _paramIndexPieces = index.split('.');
            let _param = await this.paramsCollect.get(vars.intKeyToNumeric(_paramIndexPieces[1] ?? _paramIndexPieces[0]));

            if (_param) {

                let _processed = {};

                for (let _id in item) {

                    let _value = await _param.get(vars.intKeyToNumeric(_id));
                    let _parent = await _param.getParent(vars.intKeyToNumeric(_id));

                    if (_value !== false) {

                        let _item = {"value": _value};

                            if (_parent)
                                _item['parent'] = _parent;

                        _processed[_id] = Object.assign(item[_id], _item);
                    }

                }
                this.collect['params.' + _param.name] = _processed;
            }
        }

        return false;
    }
}

module.exports = Filter;