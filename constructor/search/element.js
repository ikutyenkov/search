const Model = require("../element.js");
const vars = require("../../../modules/functions/vars.js");

class Constructor extends Model {

    constructor(search, params)
    {
        params = vars.array_replace_recursive({
            "where" : {
                ["~" + (params.source ?? "name")] : search
            },
            "limit" : 20,
            "page" : 1
        }, params);

        super(search, params);
    }
}

module.exports = Constructor;