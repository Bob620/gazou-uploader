const EventEmitter = require('events');

const fsPromise = require('./fspromise');
const imageTypeRegex = /\.(png|jpg|jpeg|gif)$/gmui;

class Directory extends EventEmitter{
	constructor(location) {
		super();

		this.data = {
			ready: false,
			location,
			images: new Map(),
			directories: new Map(),
			iterImages: undefined,
			iterDirectories: undefined
		};

		this.repopulate().then(() => {}).catch(err => {});
	}

	isReady() {
		return this.data.ready;
	}

	async repopulate() {
		this.data.ready = false;
		try {
			const directory = await fsPromise.readDir(this.data.location, {withFileTypes: true});

			// Support node v10.10.0 dirent support for faster processing
			// Otherwise do a normal setup (2 fs calls)
			if (directory[0].isDirectory === undefined) {
				for (const name of directory) {
					let stats = await fsPromise.stat(`${this.data.location}/${name}`);
					stats.name = name;
					if (stats.isDirectory())
						this.data.directories.set(name, stats);
					else if (stats.isFile() && name.match(imageTypeRegex))
						this.data.images.set(name, stats);
				}
			} else // Node Version 10.10.0 and up
				for (const item of directory)
					if (item.isDirectory())
						this.data.directories.set(item.name, item);
					else if (item.isFile() && item.name.match(imageTypeRegex))
						this.data.images.set(item.name, item);

			this.data.iterDirectories = this.data.directories.entries();
			this.data.iterImages = this.data.images.entries();

			this.data.ready = true;
			this.emit('ready', this);
		} catch(err) {
			this.emit('error', err);
		}
	}

	getImage(name) {
		return fsPromise.readFile(`${this.data.location}/${this.data.images.get(name)}`);
	}

	getDirectory(name) {
		return fsPromise.readDir(`${this.data.location}/${this.data.directories.get(name)}`);
	}

	getDirectoryIterator() {
		return this.data.directories.entries();
	}

	getImageIterator() {
		return this.data.images.entries();
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