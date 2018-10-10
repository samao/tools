/*
 * @Author: iDzeir 
 * @Date: 2018-09-30 15:55:36 
 * @Last Modified by: iDzeir
 * @Last Modified time: 2018-10-10 12:22:28
 */
const {fetchVideo, getVideoUrl:spider} = require('./commons/bilibili');
const log = require('./commons/log');
const path = require('path');

const [, , range, output = 'downloads'] = process.argv;

function tasks() {
    log('##########爬取bilibili视频##########');
    log('帮助：')
    log('\t 1.按网址爬取');
    log('\t 2.输入单个aid');
    log('\t 3.输入aid范围');
    log('\r');
    if (range.startsWith('http') || range.startsWith('https')) {
        log('网址爬取:', range);
        return [range];
    } else if (/\d+-\d+/.test(range)) {
        log('范围爬取:', range);
        const [begin, end] = range.split('-').map(e => Number(e));
        const tmap = [];
        for (let start = begin; start <= end; ++start) {
            tmap.push(`https://www.bilibili.com/video/av${start}`);
        }
        return tmap;
    } else {
        log('单个视频', range)
        const aid = parseInt(range);
        if (Number.isNaN(aid)) {
            //参数错误
            log('爬取错误目标:', aid)
            return [];
        } else {
            return [`https://www.bilibili.com/video/av${aid}`];
        }
    }
    log('爬取任务开启！！！')
}

async function run() {
    const begin = Date.now();
    const taksMap = tasks();
    const results = [];
    let fail = 0;
    log('保存目录', path.join(__dirname, output));
    for (let pageUrl of taksMap) {
        const result = await spider(pageUrl);
        if (result.ok === 1) {
            log('-----------');
            const downloaded = await fetchVideo(result.data, output);
            log('-----------');
            if(downloaded) {
                results.push(result.data);
            }else{
                fail++;
            }
        }else{
            fail++;
        }
    }

    return {
        results,
        spend: Date.now() - begin,
        fail
    };
}

run().then(({spend, results, fail}) => {
    log('---------------------------')
    log('耗时:', require('./commons/time')(spend));
    log('成功:', results.length);
    log('失败:', fail);
    log('##########爬取结束##########');
});
