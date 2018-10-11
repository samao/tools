/*
 * @Author: iDzeir 
 * @Date: 2018-09-30 14:45:40 
 * @Last Modified by: iDzeir
 * @Last Modified time: 2018-10-11 18:20:25
 */
const fetch = require('fetch');
const md5 = require('md5');
const xml2js = require('xml2js');
const fs = require('fs');
const url = require('url');
const path = require('path');
const log = require('./log');
const headers = require('./bilibili-headers');
const linelog = require('single-line-log').stdout;
const chalk = require('chalk');

const sign = cid => {
    const appKey = '1c15888dc316e05a15fdd0a02ed6584f';
    const signed = md5(['qn=0', 'player=1', 'ts=1538214532', `cid=${cid}`].sort().join('&') + appKey);
    return `https://interface.bilibili.com/v2/playurl?qn=0&player=1&cid=${cid}&ts=1538214532&sign=${signed}`;
};

async function parser(pageUrl) {
    return await new Promise((res, rej) => {
        fetch.fetchUrl(
            pageUrl.replace(/\?.+/, ''),
            {
                headers
            },
            (error, meta, data) => {
                if (error) {
                    rej(error);
                    return;
                }
                const html = data.toString();
                try {
                    const title = html
                        .match(/<title[^>]+>([^<]+)/i)[1]
                        .replace('_哔哩哔哩 (゜-゜)つロ 干杯~-bilibili', '');
                    const keyid = html.match(/player\.html\?([^ ]+)/i)[1];
                    const aid = meta.finalUrl.match(/av(\d+)/i)[1];
                    const cid = keyid.match(/cid=(\d+)/i)[1];
                    res({ aid, cid, title });
                } catch (er) {
                    rej(er);
                }
            }
        );
    });
}

async function getVideoUrl(pageUrl) {
    try {
        const { aid, cid, title } = await parser(pageUrl);
        const vurl = await new Promise((res, rej) => {
            fetch.fetchUrl(
                sign(cid),
                {
                    headers
                },
                (error, meta, data) => {
                    if (error) {
                        rej(error);
                        return;
                    }
                    xml2js.parseString(data.toString(), (err, xml) => {
                        const { result } = xml.video;
                        //console.log(xml.video)
                        if (result[0] === 'suee') {
                            try {
                                const durl = xml.video.durl[0];
                                res(durl.url[0]);
                            } catch (er) {
                                rej(er);
                            }
                        } else {
                            rej('获取视频地址失败:' + meta.finalUrl);
                        }
                    });
                }
            );
        });
        return { ok: 1, data: { aid, cid, title, vurl, pageUrl } };
    } catch (e) {
        return { ok: 0, result: '不存在视频,' + pageUrl };
    }
}

async function fetchVideo({ aid, cid, title, vurl, pageUrl }, vfolder) {
    log('爬取视频文件:', title);
    const folder = url.parse(vurl);
    require('./mkdir')(path.parse(path.join(__dirname, '..', vfolder, folder.pathname)).dir);
    const save = path.join(__dirname, '..', vfolder, folder.pathname.substr(1));
    await new Promise((res, rej) => {
        log('视频文件地址：', vurl);
        const video = new fetch.FetchStream(vurl, {
            headers
        });
        video.once('meta', () => {
            const total = parseInt(video.meta.responseHeaders['content-length']);
            if (fs.existsSync(save)) {
                const stat = fs.statSync(save);
                if (total === stat.size) {
                    log('已下载文件跳过下载');
                    video.destroy();
                    res();
                    return;
                }
            }
            addlister();
        });
        const addlister = () => {
            let byteloaded = 0;
            const buffers = [];
            video.on('data', chunks => {
                byteloaded += Buffer.byteLength(chunks);
                const total = parseInt(video.meta.responseHeaders['content-length']);
                linelog(
                    chalk.bold.red('当前视频下载进度:'),
                    chalk.bold.yellow(Number((100 * byteloaded) / total).toFixed(2) + '%')
                );
                buffers.push(chunks);
            });
            video.once('end', err => {
                if (err) {
                    log('爬取失败：', err);
                    rej(err);
                    return;
                }
                var videofile = fs.createWriteStream(save);
                videofile.end(Buffer.concat(buffers), err => {
                    if (err) {
                        log('写入文件失败:', err);
                        rej(err);
                        return;
                    }
                    log('\r爬取成功：', save);
                    res(true);
                });
            });
        };
    });
    return await new Promise((res, rej) => {
        const file = path.join(path.parse(save).dir, 'info.json');
        const infostream = fs.createWriteStream(file);
        infostream.write(
            JSON.stringify({
                aid,
                cid,
                title,
                pageUrl
            }),
            err => {
                if (err) {
                    log('记录视频信息失败:', err);
                    rej(err);
                    return;
                }
                log('视频信息保存', file);
                res(true);
            }
        );
    });
}

module.exports = {
    getVideoUrl,
    fetchVideo
};
