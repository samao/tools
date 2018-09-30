/*
 * @Author: iDzeir 
 * @Date: 2018-09-30 13:42:36 
 * @Last Modified by: iDzeir
 * @Last Modified time: 2018-09-30 13:43:15
 */
const chalk = require('chalk');

const log = (title, ...context) => console.log.call(null, chalk.bold.red(title), chalk.bold.yellow(context.join(' ')));

module.exports = log;
