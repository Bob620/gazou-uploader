const fs = require('fs');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);

class Directory {
	constructor(location) {
		this.data = {
			location,
			images: new Map(),
			directories: new Map()
			
		}
	}

	getImage(name) {
		return readFile(`${this.data.location}/${this.data.images.get(name)}`);
	}

	getDirectory(name) {
		return readFile(`${this.data.location}/${this.data.directories.get(name)}`);
	}

	nextDirectory() {

	}

	nextImage() {

	}
}

module.exports = Directory;