/*
 * @Author: iDzeir 
 * @Date: 2018-09-30 13:39:38 
 * @Last Modified by: iDzeir
 * @Last Modified time: 2018-10-10 12:31:38
 */
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { path: folder, pwd, output } = require('./commons/cmder');
const log = require('./commons/log');

async function unpack() {
    log('解压文件:', path.join(__dirname, folder));
    const begin = Date.now();
    const files = await paseFiles(folder);
    log('文件数:', files.size)
    await write(files);
    return Date.now() - begin;
}

async function paseFiles(fileUrl) {
    const decipher = crypto.createDecipher('aes192', pwd);

    const zipstream = decipher.update(fs.readFileSync(path.join(__dirname, fileUrl)));

    let offset = 0;
    const SIZE_BYTE = 4;
    const files = new Map();
    while (true) {
        const urlsize = zipstream.readUInt32BE(offset);
        offset += SIZE_BYTE;
        const url = zipstream.slice(offset, offset + urlsize);
        offset += urlsize;
        const fileSize = zipstream.readUInt32BE(offset);
        offset += SIZE_BYTE;
        const file = zipstream.slice(offset, offset + fileSize);
        offset += fileSize;
        files.set(url.toString(), file);
        if (offset >= zipstream.byteLength) {
            log('压缩文件解析完毕！！！');
            break;
        }
    }
    return files;
}

async function write(files) {
    for (let [url, file] of files) {
        await new Promise((res, rej) => {
            const filePath = path.join(output, url);
            require('./commons/mkdir')(path.parse(filePath).dir);
            const filestream = fs.createWriteStream(filePath);
            filestream.write(file, err => {
                if (err) {
                    rej(err);
                    return;
                }
                filestream.close();
                res();
            });
        });
    }
}

unpack().then(spend => log('解压完毕！！！耗时:', require('./commons/time')(spend)));
