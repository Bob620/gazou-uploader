const gazou = require('gazou-client');

const Directory = require('./util/directory');

let options = {
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
	}
}

if (options.extraDirectories.length === 0)
	throw 'Please provide a directory to operate over';
const primaryDirectory = new Directory(options.extraDirectories[0]);

primaryDirectory.on('ready', () => {
	console.log(primaryDirectory);
});

primaryDirectory.on('error', console.log);

if (options.push) {

} else {

}