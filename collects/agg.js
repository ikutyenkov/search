const Model = require('./model.js');
const configs = require("../../configs.json");
const filters = {}

for (let _filter in configs.filters.export.collects.agg) {

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
                Object.assign(configs.filters.export.collects.agg[filter] ?? {}, this.params)
            )).filter())) this.prepared = false;
        }

        return this.prepared
    }

    async _prepareItem(id, item) {

        if (typeof item == 'object' && typeof item.buckets == 'object') {

            id = id.split('_').slice(0, -1).join('_');
            let _item = {[id] : {}};

                for (let i = 0; i < item.buckets.length; i++)
                    _item[id][ '_' + item.buckets[i].key ] = {"count" : item.buckets[i].doc_count};

            return _item;
        }

        return false;
    }
}

module.exports = Collect;