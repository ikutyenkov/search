const configs = require("../../configs.json");
const vars = require("../../modules/functions/vars.js");

class Handler {

    constructor(initObject) {
        this._init = initObject;
    }

    async prepare()
    {
        if (typeof this._init.user == 'string' && this._init.user.length > 0 && typeof this._init.key == 'string' && this._init.key.length > 0) {

            if (typeof configs.users[this._init.user] != 'undefined' && configs.users[this._init.user].key === this._init.key) {

                return vars.array_replace_recursive(
                    configs.users[this._init.user],
                    vars.onlyApproveKeysOnObject(
                        configs.users[this._init.user]['approve_request_params'] ?? {},
                        this._init
                    )
                );
            } else {
                throw new Error('Auth: user is incorrect or access is denied');
            }

        } else {
            throw new Error('Auth: params is empty');
        }

        return false;
    }
}

module.exports = Handler;