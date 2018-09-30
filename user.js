var http = require('https');
var md5 = require('md5');

const appKey = '1c15888dc316e05a15fdd0a02ed6584f';
//start 为开始用户uid  number指用户数量 timefrequency为每次请求时间间隔
var start = 57017620;
var number = 100;
var end = start + number;

function sign(cid) {
    const signed = md5(['qn=0', 'player=1', 'ts=1538214532', `cid=${cid}`].sort().join('&') + appKey);
    return `https://interface.bilibili.com/v2/playurl?qn=0&player=1&cid=${cid}&ts=1538214532&sign=${signed}`;
}

function getjson() {
    var nowuid = start;
    //这里偷懒了下 直接在请求到指定数量后5s关闭链接
    if (nowuid >= end) {
        return;
    }
    //http.get请求
    http.get(sign(start), function(res) {
        var jsonx = '';
        res.on('data', function(data) {
            jsonx += data;
        });
        res.on('end', function() {
            require('xml2js').parseString(jsonx, (err, result) => {
                if (err) {
                    console.log('Error', err);
                } else {
                    if (result.video.result[0] === 'suee') {
                        const fileurls = result.video.durl[0].url;
                        console.log(`BiliBili 视频 cid=[${start}] 地址：`,fileurls[0]);
                    } else {
                        //console.log(start, result.video.message);
                    }
                }
                getjson();
            });
        });
    }).on('error', function(e) {
        console.error(e);
        console.log('error web server not found');
    });
    start++;
}
getjson();
