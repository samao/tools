/*
 * @Author: iDzeir 
 * @Date: 2018-10-10 14:29:11 
 * @Last Modified by: iDzeir
 * @Last Modified time: 2018-10-10 15:27:16
 */
const fetch = require('fetch');
const log = require('./commons/log');

const [, , output = 'downloads'] = process.argv;

async function dancelist() {
    return await new Promise((res, rej) => {
        fetch.fetchUrl(
            'https://api.bilibili.com/x/web-interface/ranking/region?rid=20',
            {
                headers: require('./commons/bilibili-headers')
            },
            (err, meta, data) => {
                if (err) {
                    log('宅舞排行获取失败：', err);
                    rej(err);
                    return;
                }
                const list = JSON.parse(data);
                const danceUrls = [];
                if (list.code !== 0) {
                    rej('获取排行榜失败：', list.message);
                    return;
                }
                for (let { aid } of list.data) {
                    danceUrls.push(`https://www.bilibili.com/video/av${aid}`);
                }
                res(danceUrls);
            }
        );
    });
}

async function run() {
    const begin = Date.now();
    const list = await dancelist();
    log('宅舞排行榜:', `${list.length} 个视频`);
    await require('./commons/bilibili-spider')(() => list, output);
    return Date.now() - begin;
}

run().then(spend => {
    log('任务耗时:', require('./commons/time')(spend));
});
