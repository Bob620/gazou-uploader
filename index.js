const fs = require('fs');

const gazou = require('gazou-client');

let options = {
	push: false,
	extraDirectories: []
};

const primaryDirectory = process.argv[0];

for (let i = 1; i < process.argv.length; i++) {
	switch (process.argv[i]) {
		case '--push':
		case '-p':
			options.push = true;
			break;
		case '--extradirectory':
		case '-d':
			options.extraDirectories.push(process.argv[i++]);
			break;
	}
}

if (primaryDirectory === undefined)
	throw 'Please provide a directory to operate over';



if (options.push) {

} else {

}