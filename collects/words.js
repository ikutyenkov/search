const Model = require('./model.js');
const configs = require("../../configs.json");
const filters = {}

    for (let _filter in configs.filters.export.collects.words) {

        try {
            filters[_filter] =  require('../../filters/collects/' + _filter + '.js')
        } catch {}
    }

class Collect extends Model {

    constructor(items, params) {
        super(items, params);
    }

    async _prepareItem(id, item) {

        if (typeof item == 'object' && typeof item['value'] != 'undefined')
            return {[id]: item};

        return false;
    }
}

module.exports = Collect;