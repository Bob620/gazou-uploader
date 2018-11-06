const fs = require('fs');
const { promisify } = require('util');

module.exports = {
	readFile: promisify(fs.readFile),
	readDir: promisify(fs.readdir),
	stat: promisify(fs.stat)
};
