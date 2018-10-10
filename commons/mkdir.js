/*
 * @Author: iDzeir 
 * @Date: 2018-09-29 16:21:02 
 * @Last Modified by: iDzeir
 * @Last Modified time: 2018-10-10 12:29:04
 */
const fs = require('fs');
const path = require('path');

module.exports = function mk(dir) {
    if (fs.existsSync(dir)) {
        return true;
    } else {
        if (mk(path.dirname(dir))) {
            fs.mkdirSync(dir);
            return true;
        }
        return false;
    }
};
