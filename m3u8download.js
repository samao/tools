/*
 * @Author: iDzeir 
 * @Date: 2018-09-30 17:04:35 
 * @Last Modified by:   iDzeir 
 * @Last Modified time: 2018-09-30 17:04:35 
 */
const fetch = require('fetch');
const util = require('util');
const url = require('url');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const linelog = require('single-line-log').stdout;
const downloads = 'downloads';

let tsloaded = 0;
let tstotal = 0;

function log(...arg) {
    console.log.apply(null, arg);
}

function checkDirPath(pathname) {
    const { dir } = path.parse(pathname);
    const dirlist = dir.split('/');
    mkdirSync(dirlist.join(path.sep));
}

function mkdirSync(dirPath) {
    if (fs.existsSync(dirPath)) {
        return true;
    } else {
        if (mkdirSync(path.dirname(dirPath))) {
            fs.mkdirSync(dirPath);
            return true;
        }
        return false;
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
                    const percent = (100 * ++tsloaded) / tstotal;
                    linelog(`下载进度：${percent.toFixed(2)} %`);
                });
            } catch (e) {
                rej(e);
            }
        });
    };
    const failMap = [];
    for (let { dist, out } of map) {
        await loader(dist, out).catch(reason => failMap.push({ dist, out }));
    }

    if (failMap.length > 0) {
        log('重新下载失败的ts文件', failMap.length, '个');
        await downloadTs(failMap).catch(_ => {});
    }
    log('\r');
}

async function m3u8loader(bitrates, dir, remote) {
    const loader = function(m3u8Url) {
        return new Promise((resolve, reject) => {
            fetch.fetchUrl(m3u8Url, (err, meta, data) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(data);
            });
        });
    };

    const tsTask = [];

    for (let pathUrl of bitrates) {
        const m3u8Dir = path.parse(pathUrl).dir;

        checkDirPath(path.join('.', downloads, dir, pathUrl));
        const m3u8Url = `${remote}${dir}/${pathUrl}`;
        log(chalk.yellow(`清晰度`), m3u8Url);
        const data = await loader(m3u8Url);
        fs.createWriteStream(path.join('.', downloads, dir, pathUrl)).end(data);

        const tsMap = data.toString().match(/(.+\.ts)/gi);
        tsMap.forEach(tsUrl => {
            const tsDir = path.parse(tsUrl).dir;
            const root = path.join('.', dir, m3u8Dir);
            checkDirPath(path.join('.', downloads, dir, m3u8Dir, tsUrl));
            tsTask.push({ dist: `${remote}/${root}/${tsUrl}`, out: path.join('.', downloads, dir, m3u8Dir, tsUrl) });
        });
    }
    tstotal = tsTask.length;
    log(chalk.blue('开始下载ts文件，总数：'), tsTask.length, '个');
    await downloadTs(tsTask);
}

const [, , sourceUrl] = process.argv;

if (!sourceUrl) {
    log(chalk.red('Error'), '没有指定下载路径');
    return;
}

fetch.fetchUrl(sourceUrl, (error, meta, data) => {
    if (error) {
        log(chalk.red('Error'), error);
        return;
    }
    const { pathname, protocol, host } = url.parse(meta.finalUrl);
    checkDirPath(path.join('.', downloads, pathname));
    log(chalk.yellow('写入m3u8list文件'));
    const m3u8 = fs.createWriteStream(path.join('.', downloads, pathname));
    m3u8.end(data);

    const rootDir = path.parse(pathname).dir;
    const content = data.toString();
    const remote = `${protocol}//${host}`;
    if (/#EXT-X-ENDLIST/i.test(content)) {
        //单清晰度
        const tsTask = [];
        const tsMap = content.match(/(.+\.ts)/gi);
        tsMap.forEach(tsUrl => {
            const { dir } = path.parse(tsUrl);
            const root = path.join('.', rootDir);
            checkDirPath(path.join('.', downloads, rootDir, dir));
            tsTask.push({ dist: `${remote}/${root}/${tsUrl}`, out: path.join('.', downloads, rootDir, dir, tsUrl) });
        });
        tstotal = tsTask.length;
        log(chalk.blue('开始下载ts文件，总数：'), tsTask.length, '个');
        downloadTs(tsTask).then(() => {
            log(chalk.green.bold('下载完毕'));
        });
    } else {
        //多清晰配置
        const bitrates = data.toString().match(/(.+\.m3u8)/gi);
        m3u8loader(bitrates, rootDir, remote).then(() => {
            log(chalk.green.bold('下载完毕'));
        });
    }
});
