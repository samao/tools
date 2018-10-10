/*
 * @Author: iDzeir 
 * @Date: 2018-09-30 14:45:40 
 * @Last Modified by: iDzeir
 * @Last Modified time: 2018-10-10 12:28:46
 */
const fetch = require('fetch');
const md5 = require('md5');
const xml2js = require('xml2js');
const fs = require('fs');
const url = require('url');
const path = require('path');
const log = require('./log');

const sign = cid => {
    const appKey = '1c15888dc316e05a15fdd0a02ed6584f';
    const signed = md5(['qn=0', 'player=1', 'ts=1538214532', `cid=${cid}`].sort().join('&') + appKey);
    return `https://interface.bilibili.com/v2/playurl?qn=0&player=1&cid=${cid}&ts=1538214532&sign=${signed}`;
};

const headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.13; rv:62.0) Gecko/20100101 Firefox/62.0',
    Referer: 'https://static.hdslb.com/play.swf'
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
    log('爬取视频文件', title);
    const folder = url.parse(vurl);
    require('./mkdir')(path.parse(path.join(__dirname, '..', vfolder, folder.pathname)).dir);
    const save = path.join(__dirname, '..', vfolder, folder.pathname.substr(1));
    await new Promise((res, rej) => {
        log('地址：', vurl);
        const video = new fetch.FetchStream(vurl, {
            headers
        });
        video.pipe(fs.createWriteStream(save));
        video.on('end', err => {
            if (err) {
                log('爬取失败：', err);
                rej(err);
                return;
            }
            log('爬取成功：', save);
            res(true);
        });
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
