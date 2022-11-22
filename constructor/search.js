const elasticsearch = require("../../modules/connections/elasticsearch.js");
const vars = require("../../modules/functions/vars.js");
const boostConroller = require("../boosters/controller.js");

class Constructor {

    constructor(table)
    {
        this._table = table;
        this._fields = {};
        this._where = {};
        this._boost = false;
        this._filter = {};
        this._order = false;
        this._limit = false;
        this._page = false;
        this._agg = false;
        this._prepare = false;
        this._mapping = false;
    }

    async _getMapping()
    {
        if (this._mapping)
            return this._mapping;

        this._mapping = vars.objectTreeToLine((await elasticsearch.getClearMapping(this._table)), (object, objectHandler, lineHandler, key, line) => {

            line[key + '.*'] = true;

            // if (key == 'params') {
            //
            //     for (let _param in object)
            //         object[_param] = {'*' : object[_param]};
            // }

            return vars.objectTreeToLine(object, objectHandler, lineHandler, key, line);
        });

            if (!this._mapping)
                throw new Error('incorrect table "' + this._table + '"');

        return this._mapping;
    }

    async _clearSource(source, exemplar, withoutTypeCompare)
    {
        source = (typeof exemplar == 'object' && exemplar) ? vars.array_replace_recursive(exemplar, source): source;
        exemplar = (typeof exemplar != 'object' || !exemplar) ? await this._getMapping() : exemplar;

        if (typeof source == 'object' && source) {

            for (let _key in source) {

                let _searchKey = (['=', '!', '^', '~'].includes(_key[0]) ? _key.substr(1) : _key);

                if (typeof exemplar[_searchKey] == 'undefined' || (!withoutTypeCompare && !vars.compareType((typeof exemplar[_searchKey]['type'] != 'undefined') ? exemplar[_searchKey]['type'] : exemplar[_searchKey], source[_key])))
                    delete source[_key];
            }

            return source;
        }

        return {};
    }

    _getConditionObject(field, value) {

        let _object = {"condition" : "=", "field" : field, "value" : value};

        if (['=', '!', '^', '~'].includes(field[0])) {
            _object.condition = field[0];
            _object.field = field.substr(1);
        }

        if (typeof _object.value != 'object' || typeof _object.value.length != 'false')
            _object.value = {"value" : _object.value}

        return _object;
    }

    _setCondition(collect, field, value)
    {
        let _prepare = this._getConditionObject(field, value);
        let _fieldObject;

        if (typeof _prepare.value.value == 'object') {

            let _group = (_prepare.condition === '!') ? 'must_not' : 'should';
            _fieldObject = {"bool": {[_group] : []}};

            for (let i = 0; i < _prepare.value.value.length; i++)
                _fieldObject['bool'][_group].push(this._getField(_prepare.field, {"value" : _prepare.value.value[i]}, _prepare.condition));
        } else {
            _fieldObject = this._getField(_prepare.field, _prepare.value, _prepare.condition);
        }

        if (_fieldObject) {

            let _target = (_prepare.condition === '!' ? 'must_not' : 'must');

                if (typeof collect[_target] != 'object')
                    collect[_target] = [];

            collect[_target].push(_fieldObject);
        }

    }

    getPriority(field)
    {
        let _pieces = field.split('^');
        let _boost = (_pieces[1] ?? false) - 0;

        if (_pieces.length === 2 && !isNaN(_boost))
            return {"field" : _pieces[0], "boost" : _boost};

        return {"field" : field, "boost" : 1};
    }

    _getField(field, value, condition)
    {
        if (condition === '~') {

            let _valueBoost = this.getPriority(value.value);
            let _fieldBoost = this.getPriority(field);

            return {
                [value.type ?? "match"]: {
                    [_fieldBoost.field]: {
                        "query": _valueBoost.field,
                        "fuzziness": "auto",
                        "boost": _valueBoost.boost ?? _fieldBoost.boost
                    }
                }
            };
        } else if (condition === '^') {

            if (typeof value.value == 'object') {

                return {
                    [value.type ?? "multi_match"]: {
                        "query": field,
                        "fields": value.value,
                        "fuzziness": "auto"
                    }
                };
            } else {
                return false;
            }
        }

        return {
            "term": {
                [field]: value.value
            }
        };
    }

    async prepare()
    {
        if (this._prepare !== false)
            return this._prepare;

        let _request = {"index" : this._table, "body" : {}};

            _request['body'] = vars.array_replace_recursive(_request['body'], this._where || {});
            _request['body'] = vars.array_replace_recursive(_request['body'], this._fields || {});
            _request['body'] = vars.array_replace_recursive(_request['body'], this._filter || {});
            _request['body'] = vars.array_replace_recursive(_request['body'], this._order || {});
            _request['body'] = vars.array_replace_recursive(_request['body'], (this._page !== false ? {"from" : (this._page - 1) * (this._limit || 0)} : false) || {});
            _request['body'] = vars.array_replace_recursive(_request['body'], (this._limit !== false ? {"size" : this._limit} : false) || {});
            _request['body'] = vars.array_replace_recursive(_request['body'], (this._agg ? {"aggs" : this._agg} : false) || {});
            _request['body'] = vars.array_replace_recursive(_request['body'], (this._boost !== false ? {"sort" : this._boost} : false) || {});

            //console.log(['query', JSON.stringify(_request)]);
        if (Object.keys(_request.body).length === 0)
            throw new Error('incorrect request body');

        return this._prepare = _request;
    }

    async execute()
    {
        return await elasticsearch.search(await this.prepare());
    }

    async fields(collect, exemplar)
    {
        collect = await this._clearSource(vars.objectFromArray(collect, 0), exemplar, true) || {};

        for (let _key in collect) {

            if (typeof this._fields._source == 'undefined')
                this._fields = {"_source" : []};

            this._fields._source.push(_key);
        }

        this._prepare = false;

        return this;
    }

    async where(collect, exemplar)
    {
        collect = await this._clearSource(collect, exemplar) || {};

        for (let _key in collect) {

            if (typeof this._where.query == 'undefined')
                this._where.query = {"bool" : {}};

            this._setCondition(this._where.query.bool, _key, collect[_key]);
        }

        this._prepare = false;

        return this;
    }

    async boost(collect, exemplar)
    {
        //collect = await this._clearSource(collect, exemplar, true) || {};
        if (Object.keys(collect).length > 0) {

            let _controller = new boostConroller(this, collect, await elasticsearch.getClearMapping(this._table));
            let _boosters = await _controller.execute() || false;

            if (typeof _boosters == 'object' && _boosters.length > 0) {

                this._boost = [
                    {
                        "_script": {
                            "type": "number",
                            "script": {
                                "source": (await _controller.prepare() ? (await _controller.prepare()).join(' ') : "")
                                    + (await _controller.variables() ? (await _controller.variables()).join(' ') : "")
                                    + (await _controller.calculations() ? (await _controller.calculations()).join(' ') : "")
                                    + "return _score / 100 * (100 + ("
                                    + _boosters.join(") + (") + "));"
                            },
                            "order": "desc"
                        }
                    },
                    "_score"
                ];
            }
        }

        return this;
    }

    async filter(collect, exemplar)
    {
        collect = await this._clearSource(collect, exemplar) || {};

        for (let _key in collect) {

            if (typeof this._filter.query == 'undefined')
                this._filter.query = {"bool" : {"filter" : []}};

            this._filter.query.bool.filter.push({"terms" : {[_key] : (typeof collect[_key] != 'object') ? [ collect[_key] ] : collect[_key]}});
        }

        this._prepare = false;

        return this;
    }

    async order(collect, exemplar)
    {
        collect = await this._clearSource(collect, exemplar) || {};

            for (let _key in collect) {

                if (typeof this._order['sort'] == 'undefined')
                    this._order['sort'] = {};

                if (collect[_key] === 'desc' || collect[_key] === 'asc')
                    this._order['sort'][_key] = {"order" : collect[_key], "missing" : '_last', "unmapped_type" : 'keyword'};
            }

        this._prepare = false;

        return this;
    }

    async limit(size, exemplar)
    {
        this._limit = (!isNaN(size - 0) && size <= (exemplar ?? 100)) ? size - 0 : 0;
        this._prepare = false;

        return this;
    }

    async page(number)
    {
        this._page = !isNaN(number - 0) ? number - 0 : 0;
        this._prepare = false;

        return this;
    }

    async convertMultiSource(collect)
    {
        for (let _field in collect) {

            let _sourcePieces = _field.split('.*');

            if (_sourcePieces.length > 1) {

                let _replace = vars.objectTreeToLine(vars.onlyApproveKeysOnObject(vars.pathToObject(_field), await elasticsearch.getClearMapping(this._table)), undefined, (key, value) => {
                    return collect[_field];
                });

                delete collect[_field];
                collect = vars.array_replace_recursive(_replace, collect);
            }
        }

        return collect;
    }

    async agg(_collect) {

        let collect = await this.convertMultiSource(await this._clearSource(Object.assign({}, _collect), undefined, true));

        if (Object.keys(collect).length > 0) {

            this._agg = {};

            for (let _field in collect) {

                if (typeof collect[_field] != 'object' || typeof collect[_field].length == 'undefined')
                    collect[_field] = [collect[_field]];

                for (let i = 0; i < collect[_field].length; i++) {

                    if (typeof collect[_field][i] == 'string')
                        collect[_field][i] = {'type' : collect[_field][i]};

                    collect[_field][i].type = collect[_field][i].type ?? 'terms';

                    if (['terms', 'sum', 'min', 'max', 'avg'].includes(collect[_field][i].type)) {

                        this._agg[_field + '_' + collect[_field][i].type] = {[collect[_field][i].type]: {'field': _field}};

                        if (collect[_field][i].type === 'terms')
                            this._agg[_field + '_' + collect[_field][i].type][collect[_field][i].type]['size'] = collect[_field][i].limit ?? 999999;
                    }
                }
            }
        }
    }
}

module.exports = Constructor;