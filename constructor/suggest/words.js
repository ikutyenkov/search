const Model = require("../model.js");
const vars = require("../../../modules/functions/vars.js");
const collect = require("../../collects/words.js");

class Constructor extends Model {

    constructor(search, params)
    {
        params = vars.array_replace_recursive({
            "table" : "popular_words",
            "where" : {
                ["~" + (params.source ?? "value")] : search
            },
            "limit" : 3,
            "page" : 1,
            "fields" : [params.source ?? "value"],
            "boost" : {"stats.month" : {"multiplier" : 1.5}}
        }, params);

        super(search, params, collect);
    }
}

module.exports = Constructor;