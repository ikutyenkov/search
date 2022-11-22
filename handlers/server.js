const configs = require("../../configs.json");
const events = require("../../modules/events/module.js");
const callable = require("../../modules/callable/module.js");
const express = require('../../node_modules/express');
const init = require("./init.js");
const http = require("http");
const { Server } = require("../../node_modules/socket.io");
const fs = require('fs');
const elasticsearch = require("../../modules/connections/elasticsearch.js");
const util = require('util');

const scripts = {
    "search" : require("../scripts/search.js"),
    "suggest" : require("../scripts/suggest.js"),
    "words" : require("../scripts/words.js")
};

class Handler {

    constructor()
    {
        events.subscribe('Search', 'app-start', this.start.bind(this));
        events.subscribe('server', 'start', this.listen.bind(this));
    }

    async start()
    {
        this.users = [];
        this.app = express();
        this.server = http.createServer(this.app);

        this.io = new Server(this.server, {

            cors: {
                "origin": "*",
                "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
                "preflightContinue": false,
                "optionsSuccessStatus": 204
            }
        });

        this.app.use(express.json({limit: '256kb'}));
        this.app.use(express.urlencoded({limit: '256kb', extended: true}));

        this.server.listen(configs.searchServer.port, () => {
            console.log('listening on *:' + configs.searchServer.port);
            events.trigger('server', 'start', configs.searchServer.port);
        });
    }

    async listen()
    {
        this.app.all('/search/*',  async (req, res) => {

            let _result;
            res.setHeader('Content-Type', 'application/json');

            if (typeof req.body == 'object' && req.body) {

                try {

                    let _init = await (new init(req.body.init ?? {})).prepare();
                    let id = handler.users.length;

                    handler.users.push({"init" : _init, "id" : id});

                    try {
                        _result = await (new scripts.search(handler.users[id], req.body)).execute();
                    } catch (e) {
                        _result ={"error" : true, "error_str" : e.message};
                    }
                } catch (e) {
                    _result = {"error" : true, "error_str" : e.message};
                }
            }

            if (typeof _result.error == 'undefined' || _result.error)
                res.status(500);

            return res.send(JSON.stringify(_result || {"error" : true, "error_str" : "Incorrect request"}));
        });

        this.app.all('/suggest/*', async (req, res) => {

            let _result;
            res.setHeader('Content-Type', 'application/json');

            if (typeof req.body == 'object' && req.body) {

                try {

                    let _init = await (new init(req.body.init ?? {})).prepare();
                    let id = handler.users.length;

                    handler.users.push({"init" : _init, "id" : id});

                    try {
                        _result = await (new scripts.suggest(handler.users[id], req.body)).execute();
                    } catch (e) {
                        console.log(e);
                        _result = {"error" : true, "error_str" : e.message};
                    }
                } catch (e) {
                    console.log(e);
                    _result = {"error" : true, "error_str" : e.message};
                }
            }

            if (typeof _result.error == 'undefined' || _result.error)
                res.status(500);

            return res.send(JSON.stringify(_result || {"error" : true, "error_str" : "Incorrect request"}));
        });

        this.app.all('/isset/*', async (req, res) => {

            let _result;
            res.setHeader('Content-Type', 'application/json');

            if (typeof req.body == 'object' && req.body) {

                // try {
                //
                //     let _init = await (new init(req.body.init ?? {})).prepare();
                //     let id = handler.users.length;
                //
                //     handler.users.push({"init" : _init, "id" : id});

                    try {
                        _result = {
                            "result" : {}
                        };
                    } catch (e) {
                        console.log(e);
                        _result = {"error" : true, "error_str" : e.message};
                    }
                // } catch (e) {
                //     console.log(e);
                //     _result = {"error" : true, "error_str" : e.message};
                // }
            }

            if (typeof _result.error == 'undefined' || _result.error)
                res.status(500);

            return res.send(JSON.stringify(_result || {"error" : true, "error_str" : "Incorrect request"}));
        });

        this.io.on('connection', (socket) => {

            let id = handler.users.length;
            handler.users.push({"id" :id, "callableControl" : new callable()});

            socket.on("disconnect", (reason) => {
                events.trigger('server', 'disconnected_user', id);
                delete handler.users[id];
            });

            socket.on("init", async (reason, callback) => {

                try {

                    if (handler.users[id].callableControl.approve('init', reason)) {

                        let _init = await (new init(reason ?? {})).prepare();

                        handler.users[id]['init'] = _init;

                        if (util.isFunction(callback))
                            callback({"error": false, "user": {"id": id}});
                    }
                } catch (e) {
                    if (util.isFunction(callback))
                        callback({"error": true, "error_str": e.message});
                }
            });

            socket.on("search", async (reason, callback) => {

                let _result = {}

                    try {
                        _result = await (new scripts.search(handler.users[id], reason)).execute();
                    } catch (e) {
                        _result = {"error" : true, "error_str" : e.message};
                    }

                if (util.isFunction(callback)) {
                    callback(_result);
                } else {
                    socket.emit('search_callback', _result);
                }
            });

            socket.on("suggest", async (reason, callback) => {

                let _result = {}

                    try {
                        _result = await (new scripts.suggest(handler.users[id], reason)).execute();
                    } catch (e) {
                        _result = {"error" : true, "error_str" : e.message};
                    }

                if (util.isFunction(callback)) {
                    callback(_result);
                } else {
                    socket.emit('suggest_callback', _result);
                }
            });
        });
    }


}

const handler = new Handler();

module.exports = handler;