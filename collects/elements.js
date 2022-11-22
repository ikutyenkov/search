const Model = require('./model.js');
const configs = require("../../configs.json");
const filters = {}

for (let _filter in configs.filters.export.collects.elements) {

    try {
        filters[_filter] =  require('../filters/collects/' + _filter + '.js')
    } catch {}
}

class Collect extends Model {

    constructor(items, params) {
        super(items, params);
    }

    async prepare()
    {
        await super.prepare();

        for (let filter of Object.keys(filters)) {

            if (!(this.items = await (await new filters[filter](
                this.items,
                Object.assign(configs.filters.export.collects.elements[filter] ?? {}, this.params)
            )).filter())) this.prepared = false;
        }

        return this.prepared
    }

    async _prepareItem(id, item) {

        if (typeof item == 'object' && (!isNaN(id - 0) || !isNaN(id.slice(1) - 0)))
            return {[id]: item};

        return false;
    }
}

module.exports = Collect;