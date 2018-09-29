const fs = require('fs');
const crypto = require('crypto');

var decipher = crypto.createDecipher('aes192', 'admin');

var decrypted = decipher.update(fs.readFileSync('code.zip'));