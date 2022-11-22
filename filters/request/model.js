class Model {

    constructor(target, params)
    {
        this.target = target;
        this.params = params ?? {};
    }

    async filter()
    {
        if (await this._prepare() === false)
            return false;

        if (typeof this.target == 'object') {

            for (let i = 0; i < this.target.length; i++) {

                let _filtered = await this._processing(this.target[i]);

                if (_filtered === false) {
                    delete this.target;
                } else {

                    if (typeof _filtered == 'object') {

                        this.target[i] = _filtered[0];

                        for (let j = 1; j < _filtered.length; j++)
                            this.target.push(_filtered[j]);

                    } else {
                        this.target[i] = _filtered;
                    }
                }
            }
        } else {
            this.target = await this._processing(this.target);
        }

        return (await this._postProcessing() ? this.target : false);
    }

    async _prepare()
    {
        return typeof this.target != 'undefined';
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