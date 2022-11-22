class Model {

    constructor(items, params) {
        this.items = {};
        this._import = items;
        this.prepared = false;
        this.params = params ?? {};
    }

    async prepare()
    {
        if (this.prepared)
            return this.prepared;

        for (let _index of Object.keys(this._import))
            this.items = Object.assign(this.items, await this._prepareItem(_index, this._import[_index]) || {});

        return this.prepared = true;
    }

    async _prepareItem(id, item) {
        return {[ "_" + Object.keys(this.items).length ] : item};
    }

    async get()
    {
        if (!this.prepared)
            await this.prepare();

        return this.items;
    }
}

module.exports = Model;