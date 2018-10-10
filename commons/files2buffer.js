/*
 * @Author: iDzeir 
 * @Date: 2018-09-30 11:18:13 
 * @Last Modified by: iDzeir
 * @Last Modified time: 2018-10-10 12:28:55
 */
const fs = require('fs');

async function pack(files) {
    const all = [];
    for (let [key, url] of files) {
        const file = fs.readFileSync(url);
        const keySize = Buffer.byteLength(key);
        const buffer = Buffer.allocUnsafe(4 + keySize + 4);
        buffer.writeUInt32BE(keySize);
        buffer.write(key, 4);
        buffer.writeInt32BE(file.byteLength, 4 + keySize);
        all.push(buffer, file);
    }
    return Buffer.concat(all);
}
module.exports = pack;
