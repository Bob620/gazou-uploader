const EventEmitter = require('events');
const crypto = require('crypto');

const fs = require('fs');
const fsPromise = require('./fspromise');
const imageTypeRegex = /\.(png|jpg|jpeg|gif)$/ui;

class Directory extends EventEmitter{
	constructor(location, calculateHash = false) {
		super();

		this.data = {
			ready: false,
			location,
			calculateHash,
			images: new Map(),
			directories: new Map()
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
						this.data.directories.set(name, new Directory(`${this.data.location}/${name}`, this.data.calculateHash));
					else if (item.isFile()) {
						const ext = imageTypeRegex.exec(name);
						if (ext && ext[1]) {
							if (this.data.calculateHash) {
								const hash = crypto.createHash('sha1');
								hash.update(fs.readFileSync(`${this.data.location}/${name}`));
								stats.hash = hash.digest('hex');
							}
							stats.type = ext[1];
							this.data.images.set(name, stats);
						}
					}
				}
			} else // Node Version 10.10.0 and up
				for (const item of directory)
					if (item.isDirectory())
						this.data.directories.set(item.name, new Directory(`${this.data.location}/${item.name}`, this.data.calculateHash));
					else if (item.isFile()) {
						const ext = imageTypeRegex.exec(item.name);
						if (ext && ext[1]) {
							if (this.data.calculateHash) {
								const hash = crypto.createHash('sha1');
								hash.update(fs.readFileSync(`${this.data.location}/${item.name}`));
								item.hash = hash.digest('hex');
							}
							item.type = ext[1];
							this.data.images.set(item.name, item);
						}
					}

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

}

module.exports = Directory;