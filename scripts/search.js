const Model = require("./model.js");
const now = require("../../node_modules/performance-now");
const words = require("./words.js");
const configs = require("../../configs.json");
var constructors = {};

const filters = {}

for (let _filter in configs.filters.export.search) {

    try {
        filters[_filter] =  require('../filters/request/' + _filter + '.js');
    } catch {}
}

class Script extends Model {

    async prepare()
    {
        if (typeof this.params.q == 'string' && this.params.q.length > 0) {

            if (this.isPrepared)
                return this.isPrepared;

            for (let filter of Object.keys(filters)) {

                this.params.q = await (await new filters[filter](
                    this.params.q,
                    Object.assign(configs.filters.export.search[filter] ?? {}, {"init": this.user.init})
                ))
                    .filter();
            }
            console.log(this.params.q);
            this.word = words.get(this.params.q);

            return this.isPrepared = true;
        } else {
            throw new Error('Incorrect search string');
        }
    }

    async execute()
    {

        await this.prepare();

        if (typeof this.user.init == 'undefined' || typeof this.user.init.search == 'undefined')
            throw new Error('User not authorized, operation is denied.');

        if (await this.word.isCached()) {
            return Object.assign(this.word.get('search'), {"error": false});
        } else {

            let _result = {};
            let _paginator = {};
            let _constructors = {};
            let _execute = {"start" : (now() / 1000000).toFixed(5)};

            for (let _sourceName of Object.keys(this.user.init.search.sources)) {

                _execute[_sourceName] = now();
                let _source = this.user.init.search.sources[_sourceName];

                if (typeof constructors[_source.collect] == 'undefined')
                    constructors[_source.collect] = require("../constructor/search/" + _source.collect + ".js");

                _constructors[_sourceName] = new constructors[_source.collect](
                    this.params.q,
                    (_source.collect === 'element' || _source.collect === 'agg') ? Object.assign(_source, {"table" : this.user.init.table, "page" : this.params.page ?? 1}) : _source,
                    _constructors
                );

                _result[_sourceName] = (await _constructors[_sourceName].execute());
                _execute[_sourceName] = ((now() - _execute[_sourceName]) / 1000000).toFixed(5);

                if (_source.collect === 'element')
                    _paginator = await _constructors[_sourceName].getTotal() || {};
            }

            this.word.set('search', _result);
            _execute["total"] = ((now() / 1000000).toFixed(5) - _execute['start']).toFixed(5);

            return  {"error" : false, "result" : _result, "paginator" : _paginator, "executed" : _execute};
        }
    }

}

module.exports = Script;