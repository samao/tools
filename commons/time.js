/*
 * @Author: iDzeir 
 * @Date: 2018-10-10 12:09:15 
 * @Last Modified by: iDzeir
 * @Last Modified time: 2018-10-10 12:28:23
 */
module.exports = ms => {
    const msecond = ms % 1000;
    const second = ((ms / 1000) | 0) % 60;
    const min = ((ms / (1000 * 60)) | 0) % 60;
    const hour = (ms / (1000 * 60 * 60)) | 0;
    return `${hour > 0 ? hour + '小时,' : ''}${min > 0 ? min + '分钟,' : ''}${
        second > 0 ? second + '秒,' : ''
    }${msecond}毫秒`;
};
