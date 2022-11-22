const Model = require("./model.js");
const Collect = require("../collects/word.js");

class Script extends Model {

    constructor() {

        super();
        this.words = {};
    }

    get(word)
    {
        if (typeof this.words[word] == 'undefined')
            this.words[word] = new Collect(word);

        return this.words[word];
    }
}

module.exports = new Script();