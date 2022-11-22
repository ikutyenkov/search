const Model = require('./model.js');
const configs = require("../../configs.json");

class Collect extends Model {

    async isCached()
    {
        return false;
    }

    async get(cacheName)
    {

    }

    async set(cacheName, result)
    {

    }

}

module.exports = Collect;