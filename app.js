const Interface = require("./class/Interface.js");
const server = require("./handlers/server.js");

server.start().then();
Interface.trigger('app-start');