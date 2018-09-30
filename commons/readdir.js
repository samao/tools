/*
 * @Author: iDzeir 
 * @Date: 2018-09-30 11:14:44 
 * @Last Modified by: iDzeir
 * @Last Modified time: 2018-09-30 11:33:19
 */
const path = require('path');
const fs = require('fs');

const ignores = ['node_modules', 'package-lock.json', 'dist', 'bin-debug', 'bin-release'];

async function readDir(rootURL, pathUrl, root) {
    const map = root || new Map();
    let files = fs.readdirSync(pathUrl);
    for (let file of files) {
        if (!file.startsWith('.')) {
            const furl = path.join(pathUrl, file);
            if (fs.statSync(furl).isDirectory()) {
                if (!ignores.includes(file)) await readDir(rootURL, furl, map);
            } else {
                map.set(path.relative(rootURL, furl), furl);
            }
        }
    }
    return map;
}

module.exports = readDir;