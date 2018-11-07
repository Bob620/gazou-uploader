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
	extraDirectories: []
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

	const serverHasImages = await gazou.hasHash(Array.from(directory.data.images.values()).map(({hash}) => {
		return hash
	}));

	for (const [, image] of directory.data.images) {
		if (!serverHasImages.includes(image.hash)) {
			await new Promise((resolve, reject) => {
				child_process.exec(`${directory.location}/${image.name}`, () => {
					resolve();
				});
			});
		}
	}

}).catch(err => {
	console.error(err);
});
