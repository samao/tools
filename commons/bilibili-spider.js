/*
 * @Author: iDzeir 
 * @Date: 2018-10-10 14:25:03 
 * @Last Modified by: iDzeir
 * @Last Modified time: 2018-10-11 18:06:12
 */
const { fetchVideo, getVideoUrl: spider } = require('./bilibili-video');
const log = require('./log');
const path = require('path');

module.exports = async function run(tasks, output = 'downloads') {
    const begin = Date.now();
    const taksMap = tasks();
    const results = [];
    let fail = 0;
    log('保存目录:', path.join(__dirname, '..', output));
    for (let pageUrl of taksMap) {
        const result = await spider(pageUrl);
        if (result.ok === 1) {
            const downloaded = await fetchVideo(result.data, output);
            log('---------------------------');
            if (downloaded) {
                results.push(result.data);
            } else {
                fail++;
            }
        } else {
            fail++;
        }
    }

    return {
        results,
        spend: Date.now() - begin,
        fail
    };
};
