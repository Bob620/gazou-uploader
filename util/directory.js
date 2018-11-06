const fsPromise = require('./fspromise');
const imageTypeRegex = /\.(png|jpg|jpeg|gif)$/gmui;

class Directory {
	constructor(location) {
		this.data = {
			ready: false,
			location,
			images: new Map(),
			directories: new Map(),
			iterImages: undefined,
			iterDirectories: undefined
		};

		this.repopulate().then(() => {
			this.data.ready = true;
		}).catch(err => {
			this.data.ready = false;
			throw err;
		});
	}

	isReady() {
		return this.data.ready;
	}

	async repopulate() {
		const directory = await fsPromise.readDir(this.data.location, {withFileTypes: true});

		for (const item of directory) {
			if (item.isDirectory())
				this.data.directories.set(item.name, item);
			else if (item.isFile() && item.name.match(imageTypeRegex))
				this.data.images.set(item.name, item);
		}

		this.data.iterDirectories = this.data.directories.entries();
		this.data.iterImages = this.data.images.entries();
	}

	getImage(name) {
		return fsPromise.readFile(`${this.data.location}/${this.data.images.get(name)}`);
	}

	getDirectory(name) {
		return fsPromise.readDir(`${this.data.location}/${this.data.directories.get(name)}`);
	}

	nextDirectory() {
		if(this.data.directories.size === 0 && this.data.iterDirectories)
			return undefined;
		else
			this.data.iterDirectories.next().value;
	}

	nextImage() {
		if(this.data.images.size === 0 && this.data.iterImages)
			return undefined;
		else
			this.data.iterImages.next().value;
	}
}

module.exports = Directory;