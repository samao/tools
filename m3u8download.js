const fetch = require('fetch');
const util = require('util');
const url = require('url');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const linelog = require('single-line-log').stdout;

let tsloaded = 0;
let tstotal = 0;

function log(...arg) {
	console.log.apply(null, arg);
}


function checkDirPath(pathname) {
	const { dir } = path.parse(pathname);
	const dirlist = dir.split('\/');
	mkdir(dirlist);
}

function mkdir(dirlist) {
	let folder = path.join(__dirname);
	if(dirlist.length > 0) {
		do {
			folder = path.join(folder, dirlist.shift());
			if(fs.existsSync(folder)) {
				continue;
			}
			log(chalk.yellow('create '), folder);
			fs.mkdirSync(folder);
		}while(dirlist.length > 0);
	}
}

async function downloadTs(map) {
	const loader = function(url, out) {
		return new Promise((res, rej) => {
			try {
				var stream = new fetch.FetchStream(url);
				stream.pipe(fs.createWriteStream(path.join('.', out)));
				stream.on('end', () => {
					res();
					const percent = ( 100 * ++tsloaded / tstotal );
					linelog(`下载进度：${percent.toFixed(2)} %`);
				});
			}catch(e) {
				rej(e)
			}
		});
	}
	const failMap = [];
	for(let {dist, out} of map) {
		await loader(dist, out).catch(reason => failMap.push({dist, out}));
	}

	if(failMap.length > 0) {
		log('重新下载失败的ts文件', failMap.length, '个');
		await downloadTs(failMap).catch(_ => {});
	}
	log('\r');
}

async function m3u8loader(bitrates, dir, remote) {

	const loader = function(m3u8Url) {
		return new Promise((resolve, reject) => {
			fetch.fetchUrl(m3u8Url, (err, meta, data) => {
				if(err) {
					reject(err);
					return;
				}
				resolve(data)
			})
		});
	}

	const tsTask = [];

	for(let pathUrl of bitrates) {
		const m3u8Dir = path.parse(pathUrl).dir;

		checkDirPath(path.join('.', dir, m3u8Dir));
		const m3u8Url = `${remote}${dir}/${pathUrl}`;
		log(chalk.yellow(`清晰度`), m3u8Url);
		const data = await loader(m3u8Url);
		fs.createWriteStream(path.join('.', dir, pathUrl)).end(data);

		const tsMap = data.toString().match(/(.+\.ts)/ig);
		tsMap.forEach(tsUrl => {
			const tsDir = path.parse(tsUrl).dir;
			const root = path.join('.', dir, m3u8Dir);
			checkDirPath(path.join(root, tsUrl));
			tsTask.push({dist: `${remote}/${root}/${tsUrl}`, out: path.join(root, tsUrl)})
		});
	}
	tstotal = tsTask.length;
	log(chalk.blue('开始下载ts文件，总数：'), tsTask.length, '个')
	await downloadTs(tsTask);
}

//http://zuikzy.51moca.com/2018/08/24/0RxUys9rxMVnbRZN/playlist.m3u8
fetch.fetchUrl('http://zuikzy.51moca.com/2018/08/24/0RxUys9rxMVnbRZN/playlist.m3u8', (error, meta, data) => {
	if(error) {
		log(chalk.red('Error'), error);
		return
	}
	const { pathname, protocol, host} = url.parse(meta.finalUrl);
	checkDirPath(path.join('.', pathname));
	log(chalk.yellow('写入m3u8list文件'));
	const m3u8 = fs.createWriteStream(path.join('.', pathname));
	m3u8.end(data);

	const rootDir = path.parse(pathname).dir;
	const content = data.toString();
	const remote = `${protocol}//${host}`
	if(/#EXT-X-ENDLIST/i.test(content)) {
		//单清晰度
		const tsTask = [];
		const tsMap = content.match(/(.+\.ts)/ig);
		tsMap.forEach(tsUrl => {
			const { dir } = path.parse(tsUrl);
			const root = path.join('.', rootDir);
			checkDirPath(path.join(root, dir));
			tsTask.push({dist: `${remote}/${root}/${tsUrl}`, out: path.join(root, tsUrl)})
		});
		tstotal = tsTask.length;
		log(chalk.blue('开始下载ts文件，总数：'), tsTask.length, '个')
		downloadTs(tsTask).then(() => {
			log(chalk.green.bold('下载完毕'))
		})
	}else{
		//多清晰配置
		const bitrates = data.toString().match(/(.+\.m3u8)/ig);
		m3u8loader(bitrates , rootDir, remote).then(() => {
			log(chalk.green.bold('下载完毕'));
		});
	}
})


