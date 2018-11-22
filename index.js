const readline = require('readline');
const child_process = require('child_process');

const config = require('./config/config');

const Gazou = require('gazou-client');

const Directory = require('./util/directory');

let gazou;
let options = {
	storageLocation: config && config.globalStorage ? config.globalStorage.directory : undefined,
	noStorage: false,
	push: false,
	extraDirectories: [],
	structure: []
};

for (let i = 1; i < process.argv.length; i++) {
	switch (process.argv[i]) {
		case '--push':
		case '-p':
			options.push = true;
			break;
		case '--extradirectory':
		case '-d':
			options.extraDirectories.push(process.argv[++i]);
			break;
		case '--server':
		case '-s':
			options.server = process.argv[++i];
			break;
		case '--userid':
		case '-u':
			options.userId = process.argv[++i];
			break;
		case '--storage':
		case '-k':
			options.storageLocation = process.argv[++i];
			break;
		case '--nostorage':
		case '-n':
			options.noStorage = true;
			break;
		case '--filestructure':
		case '-f':
			options.structure.push(process.argv[++i]);
			break;
	}
}

options.noStorage = !((!options.noStorage || config.globalStorage.enabled) && (options.storageLocation || config.globalStorage.directory));

if (options.extraDirectories.length === 0)
	throw 'Please provide a directory to operate over';

if (options.server || config.autoConnect.url)
	gazou = new Gazou(options.server ? options.server : config.autoConnect.url);
else
	throw 'Please provide a server to connect to';

if (!options.userId && !config.autoConnect.userId)
	throw 'Please provide a userId to connect with';

gazou.connect().then(async () => {
	await gazou.authInit(options.userId ? options.userId : config.autoConnect.userId);

	const directory = await new Promise((resolve, reject) => {
		const directory = new Directory(options.extraDirectories[0], true);
		directory.once('ready', resolve);
		directory.once('error', reject);
	});

	console.log(`${options.extraDirectories[0]} parsed`);

	await gazou.authSubmit(await new Promise(resolve => {
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout
		});

		rl.question('Token: ', token => {
			rl.close();
			resolve(token);
		});
	}));

	console.log(`Logged into Gazou at ${options.server ? options.server : config.autoConnect.url}`);



	let uploaded = [];

	if (options.structure[0] === 'twitter')
		for (const [twitterHandle, dir] of directory.data.directories) {
			const serverHasImages = await gazou.hasHash(Array.from(dir.data.images.values()).map(({hash}) => {
				return hash
			}));

			for (const [, image] of dir.data.images)
				if (!serverHasImages.includes(image.hash)) {
					child_process.exec(`start "" "${dir.data.location}\\${image.name}"`, () => {
					});

					const {artist, tags} = await requestImageMeta(twitterHandle);

					if (artist || tags) {
						const {uuid, uploadLink} = await gazou.upload(image.hash, image.type, artist, tags);

						uploaded.push(uuid);
						await gazou.uploadImage(uploadLink, `${dir.data.location}\\${image.name}`);
					}

					if (artist)
						await gazou.setArtist(artist, {
							addLinks: {
								twitter: `https://twitter.com/${twitterHandle}`
							}
						});
				}
		}
	else {
		const serverHasImages = await gazou.hasHash(Array.from(directory.data.images.values()).map(({hash}) => {
			return hash
		}));

		for (const [, image] of directory.data.images)
			if (!serverHasImages.includes(image.hash)) {
				child_process.exec(`start "" "${directory.data.location}\\${image.name}"`, () => {
				});

				const {artist, tags} = await requestImageMeta();

				if (artist || tags) {
					const {uuid, uploadLink} = await gazou.upload(image.hash, image.type, artist, tags);

					uploaded.push(uuid);
					await gazou.uploadImage(uploadLink, `${directory.data.location}\\${image.name}`);
				}
			}
	}

	console.log(uploaded);

}).catch(err => {
	console.error(err);
});

function requestImageMeta(defaultArtist='unknown') {
	return new Promise(resolve => {
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout
		});

		let output = {
			artist: '',
			tags: []
		};

		rl.question(`Artist[${defaultArtist}]: `, artist => {
			if (artist === '!!!skip!!!') {
				resolve({});
				rl.close();
				return;
			}

			if (artist === 'unknown')
				artist = '';

			output.artist = artist ? artist : defaultArtist;

			rl.question('Tags: ', tags => {
				output.tags = tags.split(', ');

				console.log(output);

				rl.question('Correct? ', ans => {
					if (ans[0] === 'y') {
						rl.close();
						resolve(output);
					} else
						resolve(requestImageMeta(defaultArtist));
				});
			});
		});
	});
}