/*
 * @Author: iDzeir 
 * @Date: 2018-10-10 10:28:58 
 * @Last Modified by: iDzeir
 * @Last Modified time: 2018-10-10 12:28:51
 */

const COMMANDER = {
    '-P': 'path',
    '-E': 'pwd',
    '-O': 'output'
};

function commandParser() {
    const [, , ...args] = process.argv;
    const map = {};
    if (args && args.length % 2 === 0) {
        do {
            const arg = args.shift();
            const data = args.shift();
            if (!COMMANDER.hasOwnProperty(arg)) {
                throw new SyntaxError('非法参数, 可使用参数：' + Object.keys(COMMANDER));
            }
            map[COMMANDER[arg]] = data;
        } while (args.length > 0);
    } else {
        throw new SyntaxError('包含未指定值的参数');
    }
    return map;
}

module.exports = commandParser();
