const Model = require("../params.js");
const vars = require("../../../modules/functions/vars.js");

class Constructor extends Model {

    constructor(search, params)
    {
        params = vars.array_replace_recursive({
            "table" : "param_values",
            "where" : {
                ["~" + (params.source ?? "value")] : search
            },
            "limit" : 3,
            "page" : 1,
            "fields" : ["value", "url", "preview_img"]
        }, params);

        super(search, params);
    }
}

module.exports = Constructor;