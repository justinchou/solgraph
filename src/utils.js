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





// 解析类型(属性, 参数, 返回值)
function _parseType(type) {
  if (typeof type === 'string') return type;

  if (type && typeof type === 'object') {
    if (type.type === 'MappingExpression') return `map(${type.from.literal}=>${type.to.literal})`;
  }

  console.log(type);
}

// 解析函数修饰符
function _parseFunctionModifer(modifiers, modifierRet) {
  if (!modifiers || !Array.isArray(modifiers) || modifiers.length <= 0) return [];

  const visiableMark = ['public', 'private', 'internal', 'external'];

  let visibility = 'public';
  modifiers
    .filter(modifier => modifier.type === 'ModifierArgument')
    .map(modifier => {
      if (visiableMark.indexOf(modifier.name) === -1) modifierRet.push(modifier.name);
      else visibility = modifier.name;
    });

  return visibility;
}

// 解析函数参数/返回值
function _parseParams(params, isVoid) {
  if (!params || !Array.isArray(params) || params.length <= 0) return isVoid ? '(void)' : '()';

  let paramStr = '(';
  let paramArr = params
    .filter(param => param.type === 'InformalParameter')
    .map(param => {
      return `${param.id ? param.id + ':' : ''}${_parseType(param.literal.literal)}`
    });

  (paramArr.length === 0 && !isVoid) && paramArr.push('void');

  paramStr += paramArr.join(', ') + ')';

  return paramStr;
}

function _parseVariable(contractBody) {
  const name        = contractBody.name            ;
  const type        = contractBody.literal.literal ;
  const visibility  = contractBody.visibility      ;
  const is_constant = contractBody.is_constant     ;
  const value       = contractBody.value           ;

  // const variable = {name, type, visibility, is_constant, value};
  // console.log(variable);

  return `${visibility === 'public' ? '+' : '-'} ${name}${value ? '= ' + value : ''} : ${type}${is_constant ? ' CONST' : ''}`;
}

function _parseFunction(contractBody) {
  const name         = contractBody.name         ; 
  const params       = _parseParams(contractBody.params);
  const modifiers    = []                        ;
  const visibility   = _parseFunctionModifer(contractBody.modifiers, modifiers);
  const body         = contractBody.body         ;
  const returnParams = _parseParams(contractBody.returnParams, true);
  const is_abstract  = contractBody.is_abstract  ;

  // const func = {name, params, modifiers, visibility, returnParams, is_abstract};
  // console.log(func);

  return `${(visibility === 'public' || visibility === 'external') ? '+' : '-'} ${name}${params} : ${returnParams} ${modifiers.join(',')}${is_abstract ? ' ABSTRACT' : ''}`;
}

function _parseEvent(contractBody) {

  return ``;
}

function _parseModifer(contractBody) {
  const name       = contractBody.name         ;
  const params     = _parseParams(contractBody.params);
  const modifiers  = []                        ;
  const visibility = _parseFunctionModifer(contractBody.modifiers, modifiers);

  // const modifier = {name, params, modifiers, visibility};
  // console.log(modifier);

  return `${name}${params}`;
}

function _parseStruct(contractBody) {

  return ``;
}

function _parseUsing(contractBody) {

  return ``;
}

const ContractBodyType = {
  "StateVariableDeclaration" : _parseVariable,
  "FunctionDeclaration"      : _parseFunction,
  "EventDeclaration"         : _parseEvent,
  "ModifierDeclaration"      : _parseModifer,
  "StructDeclaration"        : _parseStruct,
  "UsingStatement"           : _parseUsing,
};
exports.ContractBodyType = ContractBodyType;


