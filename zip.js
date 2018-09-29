/*
 * @Author: iDzeir 
 * @Date: 2018-09-28 16:07:44 
 * @Last Modified by: iDzeir
 * @Last Modified time: 2018-09-29 16:45:28
 */
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { path: folder, pwd, output } = require('./commons/cmder');

const ignores = ['node_modules', 'package-lock.json', 'dist', 'bin-debug', 'bin-release'];

const rootURL = path.join(__dirname, folder);

console.log('打包目录：', rootURL);

async function readDir(pathUrl, root) {
    const map = root || new Map();
    let files = fs.readdirSync(pathUrl);
    for (let file of files) {
        if (!file.startsWith('.')) {
            const furl = path.join(pathUrl, file);
            if (fs.statSync(furl).isDirectory()) {
                if (!ignores.includes(file)) await readDir(furl, map);
            } else {
                map.set(path.relative(rootURL, furl), furl);
            }
        }
    }
    return map;
}

readDir(rootURL).then(files => {
    console.log(`发现文件：${files.size} 个`);
    async function pack() {
        const all = [];
        for (let [key, url] of files) {
            const file = fs.readFileSync(url);
            const keySize = Buffer.byteLength(key);
            const buffer = Buffer.allocUnsafe(4 + keySize);
            buffer.writeUInt32BE(keySize);
            buffer.write(key, 4);
            all.push(buffer, file);
        }
        return Buffer.concat(all);
    }
    pack().then(buffers => {
        const clipher = crypto.createCipher('aes192', pwd);
        require('./commons/mkdir')(path.parse(output).dir);
        const zipfile = fs.createWriteStream(output);
        zipfile.write(clipher.update(buffers), error => {
            if (error) {
                console.log('FAIL');
                return;
            }
            zipfile.close();
        });
    });
});
