const { XMLParser } = require('fast-xml-parser');
console.log('XMLParser loaded successfully');
const parser = new XMLParser();
const output = parser.parse('<root>Hello</root>');
console.log(output);
