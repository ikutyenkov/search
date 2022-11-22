const now = require("../../node_modules/performance-now");
const Model = require("./model.js");
const words = require("./words.js");
const elasticsearch = require("../../modules/connections/elasticsearch.js");
const configs = require("../../configs.json");
const params = new (require("../../modules/params/module.js"))('goods');
var constructors = {};

const filters = {}

for (let _filter in configs.filters.export.suggest) {

    try {
        filters[_filter] =  require('../filters/request/' + _filter + '.js');
    } catch {}
}

class Script extends Model {

    async prepare()
    {
        if (typeof this.user.init == 'undefined' || typeof this.user.init.suggest == 'undefined')
            throw new Error('User not authorized, operation is denied.');

        if (typeof this.params.q == 'string' && this.params.q.length > 0) {

            if (this.isPrepared)
                return this.isPrepared;

            for (let filter of Object.keys(filters)) {

                this.params.q = await (await new filters[filter](
                    this.params.q,
                    Object.assign(configs.filters.export.suggest[filter] ?? {}, {"init": this.user.init})
                ))
                    .filter();
            }

            this.word = words.get(this.params.q);

            return this.isPrepared = true;
        } else {
            throw new Error('Incorrect search string');
        }
    }

    async execute()
    {

        await this.prepare();

        if (await this.word.isCached()) {
            return {"error": false, "result" : this.word.get('suggests')};
        } else {

            let _result = {};
            let _constructors = {};
            let _execute = {"start" : (now() / 1000000).toFixed(5)};

            for (let _sourceName of Object.keys(this.user.init.suggest.sources)) {

                _execute[_sourceName] = now();
                let _source = this.user.init.suggest.sources[_sourceName];

                if (typeof constructors[_source.collect] == 'undefined')
                    constructors[_source.collect] = require("../constructor/suggest/" + _source.collect + ".js");

                _constructors[_sourceName] = new constructors[_source.collect](
                    this.params.q,
                    (_source.collect === 'element' || _source.collect === 'agg') ? Object.assign(_source, {"table" : this.user.init.table}) : _source,
                    _constructors
                );

                _result[_sourceName] = (await _constructors[_sourceName].execute());
                _execute[_sourceName] = ((now() - _execute[_sourceName]) / 1000000).toFixed(5);
            }

            this.word.set('suggests', _result);
            _execute["total"] = ((now() / 1000000).toFixed(5) - _execute['start']).toFixed(5);

            return {"error" : false, "result" : _result, "executed" : _execute};
        }
    }

}

module.exports = Script;