// @flow
const { randomBytes } = require("crypto");

module.exports = () => randomBytes(8).toString("base64");
