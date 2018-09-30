/*
 * @Author: iDzeir 
 * @Date: 2018-09-28 16:07:44 
 * @Last Modified by: iDzeir
 * @Last Modified time: 2018-09-30 13:43:04
 */
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { path: folder, pwd, output } = require('./commons/cmder');
const log = require('./commons/log');

const rootURL = path.join(__dirname, folder);

async function zip() {
    const begin = Date.now();
    log('打包目录:', rootURL);
    const files = await require('./commons/readdir')(rootURL, rootURL);
    log('包含文件:', files.size, '个');
    const buffers = await require('./commons/files2buffer')(files);
    log('总大小:', (buffers.byteLength / 1024 / 1024).toFixed(2), 'm');
    const outdir = path.parse(output).dir;
    log('文件输出目录:', outdir);
    require('./commons/mkdir')(outdir);
    await new Promise((res, rej) => {
        const clipher = crypto.createCipher('aes192', pwd);
        const zipstream = fs.createWriteStream(output);
        zipstream.write(clipher.update(buffers), error => {
            if (error) {
                rej(error);
                return;
            }
            zipstream.close();
            res();
        });
    });
    return Date.now() - begin;
}

zip()
    .then(spend => {
        log('打包完成！！！耗时:', (spend / 1000).toFixed(3), 's');
    })
    .catch(reason => console.log(reason));
