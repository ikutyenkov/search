const Model = require('./model.js');

class Filter extends Model {

    constructor(collect, params)
    {
        super(collect, params);
    }

    async _prepare()
    {
        if (typeof this.params.target == 'string' && this.params.target !== '') this.params.target = [this.params.target];

        return true;
    }

    async _processing(item)
    {
        if (typeof this.params.target == 'object' && this.params.target) {

            for (let index in this.params.target) {

                if (typeof item[ this.params.target[index] ] != 'undefined') {

                    if (typeof item[ this.params.target[index] ] == 'object') {
                        this._processingObject(item[ this.params.target[index] ]);
                    } else {
                        this._processingKey(item, this.params.target[index]);
                    }
                }
            }
        }

        return item;
    }

    _processingObject(object)
    {
        let _object = {};

        for (let key in object)
            this._processingKey(object, key)

        return _object;
    }

    _processingKey(object, key)
    {
        if (key[0] === '_') {
            object[key.slice(1)] = object[key];
            delete object[key];
        }
    }
}

module.exports = Filter;