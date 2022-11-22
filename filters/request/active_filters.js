const Model = require('./model.js');

class Filter extends Model {

    async _processing(target)
    {
        return target;
    }
}

module.exports = Filter;