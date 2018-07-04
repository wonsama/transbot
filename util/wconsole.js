let fn = {}

fn.clear = () => {
	return process.stdout.write('\033c');
	// return process.stdout.write('\x1Bc');
}

module.exports = fn;