const http = require('http');
const fs = require('fs');
const path = require('path');
const querystring = require('querystring');
const request = require('request');
const cheerio = require('cheerio');

class wallpaper {
	constructor() {
		this.page = [1, 84];
    this.list = [];
  }

	getList(page) {
		const index = page === 1 ? '' : '_' + page;
		return new Promise((resolve, reject) => {
			request({
				url: 'https://www.macappstore.net/wallpaper/index' + index +'.html',
			}, (err, response, body) => {
				if (err || !body) return reject(err);
				const $ = cheerio.load(body, {decodeEntities: false});
				const perList = [];
				$('.wrap.wallpaper li').each((i, item) => {
					perList.push({
						url: $(item).find('a').attr('href'),
						src: $(item).find('img').attr('originalsrc'),
						ratio: $(item).find('span').eq(3).text()
					});
				});
				resolve({
					page,
					list: perList
				});
			});
		});
	}

	start() {
		http.createServer((req, res) => {
			res.send = (content, type, status = 200) => {
				if (type === 'json') {
					res.writeHead(status, {'Content-type': 'application/json;charset=utf-8'});
					res.write(JSON.stringify(content));
					res.end();
				} else {
					res.writeHead(status, {'Content-type': 'text/html;text/html;charset=utf-8'});
					res.write(content);
					res.end();
				};
			};

			let postData = '';
			req.on('data', data => {postData += data;});
			req.on('end', () => {
				if (req.url.indexOf('/getList') >= 0) {
					const page = parseInt(querystring.parse(postData).page);
					if (page === NaN || page < this.page[0] || page > this.page[1]) {
						return res.send({
							status: 201,
							msg: 'out of pages'
						}, 'json');
					};

					this.getList(page).then(ret => {
						res.send({
							status: 200,
							data: ret,
							msg: 'success'
						}, 'json');
					}).catch(err => {
						res.send({
							status: 201,
							msg: err
						}, 'json');
					});
				} else {
					res.send(fs.readFileSync(path.resolve(__dirname, 'index.html')));
				}
			});
		}).listen(3098);
		console.log('server start on 3098');
	}
};

const server = new wallpaper().start();
