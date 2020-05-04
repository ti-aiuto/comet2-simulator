const fs = require('fs');
const text = fs.readFileSync(process.argv[2]);

const result = [];
text.toString().trim().replace(/\r\n?/g, "\n").split("\n").forEach(function(line) {
	result.push([...line.split("\t"), '', '', '', ''].slice(0, 4));
});

console.log(result);
