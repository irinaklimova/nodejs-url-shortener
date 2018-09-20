const http = require('http');
const fs = require('fs');
const bigInt = require('big-integer');
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/test', {useNewUrlParser: true});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
	console.log('connection');
});

const urlSchema = new mongoose.Schema({
	url:  String
});

const Url = mongoose.model('Url', urlSchema);

const hostname = 'localhost';
const port = 8086;
const hex_map = '0123456789abcdef';
const base62_map = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

const server = http.createServer((req, res) => {
	if (req.url.indexOf('url') !== -1) {
		const urlText = req.url.substring(5);
		if (urlText) {
			Url.findOne({url: urlText}, (err, data) => {
				if (data) {
					res.writeHeader(200);
					res.write(toShortUrl(data._id));
					res.end();
				} else {
					var url = new Url({url: urlText});
					url.save(function (err, data) {
						if (err) return console.error(err);
						res.writeHeader(200);
						res.write(toShortUrl(data._id));
						res.end();
					});
				}
			});
		}
	} else if (req.url.indexOf('.css') !== -1) {
		fs.readFile(`public${req.url}`, (err, data) => {
			res.writeHeader(200, {'Content-Type': 'text/css'});
			res.write(data);
			res.end();
		});
	} else if (req.url.indexOf('.js') !== -1) {
		fs.readFile(`public${req.url}`, (err, data) => {
			res.writeHeader(200, {'Content-Type': 'application/javascript'});
			res.write(data);
			res.end();
		});
	} else if (req.url.indexOf('.png') !== -1) {
		fs.readFile(`public${req.url}`, (err, data) => {
			res.writeHeader(200, {'Content-Type': 'image/png'});
			res.write(data);
			res.end();
		});
	} else if (req.url.indexOf('.jpg') !== -1) {
		fs.readFile(`public${req.url}`,(err, data) => {
			res.writeHeader(200, {'Content-Type': 'image/jpeg'});
			res.write(data);
			res.end();
		});
	} else if (req.url === '/') {
		fs.readFile('public/index.html', (err, data) => {
			res.writeHeader(200, {'Content-Type': 'text/html'});
			res.write(data);
			res.end();
		});
	} else if (req.url.indexOf('.ico') !== -1) {
		res.writeHeader(200, {'Content-Type': 'text/html'});
		res.end();
	} else {
		const id = from64BaseToHex(req.url.substring(1));
		Url.findOne({_id: id}, (err, data) => {
			if (data) {
				res.writeHead(302, {
					'Location': data.url
				});
				res.end();
			} else {
				res.writeHead(302, {
					'Location': '/'
				});
				res.end();
			}
		});
	}
});

function toShortUrl(id) {
	return `${hostname}:${port}/${fromHexTo62Base(id.toString())}`
}

function fromHexTo62Base(hex) {
	return toBase(hex, hex_map, base62_map);
}

function from64BaseToHex(hash) {
	return toBase(hash, base62_map, hex_map);
}

function toBase(value, source_map, base_map) {
	let dec = bigInt(0);
	for (let i = 0; i < value.length; i++) {
		dec = dec.plus(bigInt(source_map.indexOf(value[i])).multiply(bigInt(source_map.length).pow(value.length - i - 1)));
	}
	let array = [];
	const baseLength = base_map.length;
	while(bigInt(dec).greaterOrEquals(baseLength)) {
		array.push(base_map[bigInt(dec).mod(baseLength)]);
		if (bigInt(dec).divide(baseLength) < baseLength) {
			array.push(base_map[bigInt(dec).divide(baseLength)]);
			break;
		}
		dec = bigInt(dec).divide(baseLength);
	}
	return array.reverse().join('');
}


server.listen(port, hostname, () => {
	console.log(`Server running at http://${hostname}:${port}/`);
});