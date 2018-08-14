const Mkdirp = require('mkdirp');
const Fs = require("fs");
const Path = require('path');

const debug = require('debug')('contract-generator');

/**
 * 创建文件夹, 封装调用 mkdirp
 * @param {String} path 文件夹路径
 * @param {Function=} fn (EMPTY_PARAMS)
 * @returns {null} 无
 */
function mkdir(path, fn) {
    Mkdirp(path, Utils.MODE_0755, err => {
        if (err) throw err;
        debug('   创建文件夹 : ', path);
        if (typeof fn === 'function') fn();
    });
}

exports.mkdir = mkdir;

/**
 * 解析action回调后获取的数据
 * @param {Object} args 从action回调得到的arguments
 * @returns {Command} Commander对象
 */
function parseOption(args) {
    // 防止传入多个没有 --xx 的参数
    let arr = Array.prototype.slice.apply(args);
    let option = arr.pop();

    let parmas = {};
    for (let i in option) {
        if (option.hasOwnProperty(i)) {
            if (!i.match(/^_|^commands$|^options$|^parent$/)) {
                parmas[i] = option[i];
            }
        }
    }

    debug();
    debug('   传入参数为:  [ %s ]', arr.join('  '));
    debug('   开关选项为:  [ %j ]', parmas);
    debug();

    return option;
}

exports.parseOption = parseOption;

function parseParams(args) {
    // 防止传入多个没有 --xx 的参数
    let arr = Array.prototype.slice.apply(args);
    let option = arr.pop();

    let parmas = {};
    for (let i in option) {
        if (option.hasOwnProperty(i)) {
            if (!i.match(/^_|^commands$|^options$|^parent$/)) {
                parmas[i] = option[i];
            }
        }
    }

    return parmas;
}

exports.parseParams = parseParams;

function isOkFile(file) {
    if (!Fs.existsSync(file)) return false;

    const status = Fs.statSync(file);
    return status.isFile();
}

exports.isOkFile = isOkFile;

function isOkDirectory(dir) {
    if (!Fs.existsSync(dir)) return false;

    const status = Fs.statSync(dir);
    return status.isDirectory();
}

exports.isOkDirectory = isOkDirectory;

function mkOutputDirectory(dir) {
    Mkdirp(dir);
}

exports.mkOutputDirectory = mkOutputDirectory;

function writeOutputFile(dir, subdir, filename, contents) {
    Fs.writeFileSync(Path.join(dir, subdir, filename + '.js'), contents);
}

exports.writeOutputFile = writeOutputFile;

