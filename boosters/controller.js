const vars = require("../../modules/functions/vars.js");
let controllers = {};

class Controller {

    constructor(instance, collect, exemplar) {

        this._instance = Object.assign(Object.create(Object.getPrototypeOf(instance)), instance);
        this._collect = collect;
        this._prepared = false;
        this._executed = false;
        this._processed = false;
        this._variables = false;
        this._calculations = false;
        this.controls = {};
        this._exemplar = vars.objectTreeToLine(exemplar);
        this._repeateLines = {"aggs" : [], "prepare" : [], "variables" : [], "calculations" : [], "executed" : []};

        this._initControllers();
    }

    _initControllers()
    {
        for (let _field in this._collect ?? {}) {

            for (let _control in this._collect[_field]) {

                try {

                    if (typeof this.controls[_control] == 'undefined')
                        controllers[_control] = require("./controls/"  + _control + ".js");

                    this.controls[_field] = new controllers[_control](_field, this._collect[_field][_control], this._exemplar[_field] ?? undefined);
                } catch (e){
                    delete this._collect[_field];
                }
            }
        }
    }

    async prepare()
    {
        if (this._prepared)
            return this._prepared;

        for (let _field in this._collect ?? {}) {

            for (let _control in this._collect[_field]) {

                let _prepared = await this.controls[_field].prepare();

                if (_prepared && !this.isRepeat('prepare', _prepared)) {

                    if (typeof this._prepared != 'object')
                        this._prepared = [];

                    this._prepared = this._prepared.concat(_prepared);
                }
            }
        }

        return this._prepared;
    }

    async variables()
    {
        if (this._variables)
            return this._variables;

        for (let _field in this._collect ?? {}) {

            for (let _control in this._collect[_field]) {

                let _variables = await this.controls[_field].variables();

                if (typeof _variables == 'object') {

                    for (let i = 0; i < (_variables.length ?? 0); i++) {

                        if (_variables[i] !== false) {

                            if (typeof this._variables != 'object')
                                this._variables = [];

                            this._variables.push(_variables[i]);
                        }
                    }
                }
            }
        }

        return this._variables;
    }

    async calculations()
    {
        if (this._calculations)
            return this._calculations;

        for (let _field in this._collect ?? {}) {

            for (let _control in this._collect[_field]) {

                let _calculations = await this.controls[_field].calculation();

                if (typeof _calculations == 'object') {

                    for (let i = 0; i < _calculations.length; i++) {

                        if (_calculations[i] !== false && !this.isRepeat('calculations', _calculations[i])) {

                            if (typeof this._calculations != 'object')
                                this._calculations = [];

                            this._calculations.push(_calculations[i]);
                        }
                    }
                }
            }
        }

        return this._calculations;
    }

    async processing()
    {
        if (this._processed)
            return this._processed;

        let _aggCollect = {};

        for (let _field in this._collect ?? {}) {

            for (let _control in this._collect[_field]) {

                let _processed = await this.controls[_field].processing();

                if (_processed && !this.isRepeat('aggs', _processed))
                    _aggCollect = vars.array_replace_recursive(_aggCollect, _processed);
            }
        }

        await (this._instance.limit.bind(this._instance))(0);
        await (this._instance.page.bind(this._instance))(1);
        await (this._instance.agg.bind(this._instance))(_aggCollect);
        await (this._instance.prepare.bind(this._instance))();

        return this._processed = (await (this._instance.execute.bind(this._instance))()).body.aggregations ?? {};
    }

    async execute()
    {
        if (this._executed)
            return this._executed;

        if (await this.processing()) {

            this._executed = [];

            for (let _field in this._collect ?? {}) {

                for (let _control in this._collect[_field]) {

                    let _executed = await this.controls[_field].execute(this._processed);

                    if (_executed) {

                        if (!this.isRepeat('executed', _executed))
                            this._executed.push(_executed);
                    } else {
                        delete this._collect[_field][_control];
                    }
                }
            }

            return this._executed;
        }

        return false;
    }

    isRepeat(method, values)
    {
        let _simpleValue = (typeof values == 'object' ? JSON.stringify(values) : values);

        if (!this._repeateLines[method].includes(_simpleValue)) {

            this._repeateLines[method].push(_simpleValue);
            return false;
        }

        return true;
    }

}

module.exports = Controller;