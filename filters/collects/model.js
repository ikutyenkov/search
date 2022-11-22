class Model {

    constructor(collect, params)
    {
        this.collect = Object.assign({}, collect);
        this.params = params ?? {};
    }

    async filter()
    {
        if (await this._prepare()) {

            for (let index of Object.keys(this.collect)) {

                this.collect[index] = await this._processing(this.collect[index], index);
                    if (!this.collect[index]) delete this.collect[index];
            }
        }

        return (await this._postProcessing() ? this.collect : false);
    }

    async _prepare()
    {
        return true;
    }

    async _processing(item)
    {
        return item;
    }

    async _postProcessing()
    {
        return true;
    }
}

module.exports = Model;