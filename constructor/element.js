const Model = require("./model.js");
const collect = require("../collects/elements.js");
const params = new (require("../../modules/params/module.js"))('goods');
const vars = require("../../modules/functions/vars.js");
const elasticsearch = require("../../modules/connections/elasticsearch.js");

class Constructor extends Model {

    constructor(search, params)
    {
        super(search, params, collect);
    }

    async prepare()
    {
        if (this._prepare)
            return this._prepare;
let _rand = Math.random();
        if (typeof this.params.agg != 'undefined') {

            for (let _index in this.params.agg.sources) {

                let _pieces = this.params.agg.sources[_index].split('params.');

                if (_pieces.length === 2) {

                    if (_pieces[1] == '*') {

                        this.params.agg.sources = [];
                        let _mapping = await elasticsearch.getMapping(this.params.table);

                        for (let _id in (_mapping.properties.params.properties ?? {}))
                            this.params.agg.sources.push('params.' + _id);
                    } else if (isNaN(vars.intKeyToNumeric(_pieces[1]) - 0)) {
                        this.params.agg.sources[_index] = 'params._' + ((await params.getByName(_pieces[1])).id || 0);
                    }
                }
            }
        }

        if (typeof this.params.filter != 'undefined') {

            for (let _index in this.params.filter) {

                let _paramName = this.getParamName(_index);

                if (_paramName) {

                    let _param = await params.getByName(_paramName);

                    if (_param) {

                        if (typeof this.params.filter[_index] == 'string' && isNaN(this.params.filter[_index] - 0))
                            this.params.filter[_index] = [ this.params.filter[_index] ];

                        if (typeof this.params.filter[_index] == 'object' && typeof this.params.filter[_index].length != 'undefined') {

                            for (let i = 0; i < this.params.filter[_index].length; i++) {

                                if (isNaN(vars.intKeyToNumeric(this.params.filter[_index][i])))
                                    this.params.filter[_index][i] = (await _param.search(this.params.filter[_index][i]) * 1000) || 0;
                            }
                        } else {

                            if (isNaN(vars.intKeyToNumeric(this.params.filter[_index])))
                                this.params.filter[_index] = (await _param.search(this.params.filter[_index]) * 1000) || 0;
                        }

                        this.params.filter['params._' + _param.id] = this.params.filter[_index];

                        for (let _parent of Object.values(this.params.filter['params._' + _param.id])) {

                            let _childs = await _param.getChild(_parent / 1000);

                            if (_childs) {

                                if (typeof this.params.filter['params._' + _param.id] != 'object')
                                    this.params.filter['params._' + _param.id] = [this.params.filter['params._' + _param.id]];

                                for (let _child of _childs) {
                                    this.params.filter['params._' + _param.id].push(_child * 1000);
                                }
                            }
                        }
                    }

                    delete this.params.filter[_index];
                }
            }
        }

        if (typeof this.params.boost != 'undefined') {

            for (let _index in this.params.boost) {

                let _paramPieces = this.getParamName(_index);

                if (_paramPieces) {

                    _paramPieces = _paramPieces.split('.');
                    let _value = _paramPieces.pop();
                    let _param = await params.getByName(_paramPieces.join('.'));

                    if (_param) {

                        if (isNaN(vars.intKeyToNumeric(_value)))
                            _value = await _param.search(_value) * 1000;

                        if (_value !== false)
                            this.params.boost['params._' + _param.id + '.' + _value] = this.params.boost[_index];
                    }

                    delete this.params.boost[_index];
                }
            }
        }

        return await super.prepare();
    }

    getParamName(name)
    {
        let _pieces = name.split('params.');

        if (_pieces.length >= 2 && isNaN(vars.intKeyToNumeric(_pieces[1]) - 0))
            return _pieces[1];

        return false;
    }
}

module.exports = Constructor;