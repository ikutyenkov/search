const elasticsearch = require("../../modules/connections/elasticsearch.js");
const request = require("./search.js");

class Constructor {

    constructor(search, params, collect)
    {
        this.model = new request(params.table);
        this.params = params;
        this.search = search;
        this.collect = collect;
        this._prepare = false;
        this._execute = false;
    }

    async prepare()
    {
        if (this._prepare)
            return this._prepare;

        await this.model.fields(this.params.fields ?? []);
        await this.model.where(this.params.where ?? {});
        await this.model.filter(this.params.filter ?? {});
        await this.model.limit(this.params.limit);
        await this.model.page(this.params.page);
        await this.model.agg(this.params.agg ?? {});
        await this.model.boost(this.params.boost ?? {});

        return this._prepare = true;
    }

    async execute()
    {
        await this.prepare();

        if (!this._execute)
            this._execute = await this.model.execute();

        return await (new this.collect(
            await elasticsearch.fetch(
                this._execute
            ),
            this.params
        )).get();
    }

    async getTotal()
    {
        let _total = 0;
        let _page = (this.params.page - 0 > 1 ? this.params.page : 1);

        if (typeof this._execute.body != 'undefined' && typeof this._execute.body.hits != 'undefined' && typeof this._execute.body.hits.total != 'undefined')
            _total = this._execute.body.hits.total.value;

        return {"page" : _page, "from" : _page * this.params.limit, "size" : this.params.limit, "total" : _total};
    }

    async getExecute()
    {
        return this._execute;
    }
}

module.exports = Constructor;