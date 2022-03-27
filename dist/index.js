import * as qiniu from 'qiniu-js';
import crypto from 'crypto';

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
  try {
    var info = gen[key](arg);
    var value = info.value;
  } catch (error) {
    reject(error);
    return;
  }

  if (info.done) {
    resolve(value);
  } else {
    Promise.resolve(value).then(_next, _throw);
  }
}

function _asyncToGenerator(fn) {
  return function () {
    var self = this,
        args = arguments;
    return new Promise(function (resolve, reject) {
      var gen = fn.apply(self, args);

      function _next(value) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
      }

      function _throw(err) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
      }

      _next(undefined);
    });
  };
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

const rnds8Pool = new Uint8Array(256); // # of random values to pre-allocate

let poolPtr = rnds8Pool.length;
function rng() {
  if (poolPtr > rnds8Pool.length - 16) {
    crypto.randomFillSync(rnds8Pool);
    poolPtr = 0;
  }

  return rnds8Pool.slice(poolPtr, poolPtr += 16);
}

var REGEX = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i;

function validate(uuid) {
  return typeof uuid === 'string' && REGEX.test(uuid);
}

/**
 * Convert array of 16 byte values to UUID string format of the form:
 * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
 */

const byteToHex = [];

for (let i = 0; i < 256; ++i) {
  byteToHex.push((i + 0x100).toString(16).substr(1));
}

function stringify(arr, offset = 0) {
  // Note: Be careful editing this code!  It's been tuned for performance
  // and works in ways you may not expect. See https://github.com/uuidjs/uuid/pull/434
  const uuid = (byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + '-' + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + '-' + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + '-' + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + '-' + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]).toLowerCase(); // Consistency check for valid UUID.  If this throws, it's likely due to one
  // of the following:
  // - One or more input array values don't map to a hex octet (leading to
  // "undefined" in the uuid)
  // - Invalid input values for the RFC `version` or `variant` fields

  if (!validate(uuid)) {
    throw TypeError('Stringified UUID is invalid');
  }

  return uuid;
}

function v4(options, buf, offset) {
  options = options || {};
  const rnds = options.random || (options.rng || rng)(); // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`

  rnds[6] = rnds[6] & 0x0f | 0x40;
  rnds[8] = rnds[8] & 0x3f | 0x80; // Copy bytes to buffer, if provided

  if (buf) {
    offset = offset || 0;

    for (let i = 0; i < 16; ++i) {
      buf[offset + i] = rnds[i];
    }

    return buf;
  }

  return stringify(rnds);
}

/**
 * 深度合并
 * @param object
 * @param sources
 * @return {*}
 */
function mergeDeep(object, sources) {
  var key;

  for (key in sources) {
    object[key] = object[key] && object[key].toString() === '[object Object]' ? mergeDeep(object[key], sources[key]) : object[key] = sources[key];
  }

  return object;
}

var Qiniu = /*#__PURE__*/function () {
  function Qiniu(options) {
    _classCallCheck(this, Qiniu);

    this.opts = mergeDeep({
      async: false,
      // 是否异步获取配置信息，默认 false。如果为 true 时，getConfig 需要返回 Promise 对象
      root: '',
      domain: '',
      token: '',
      // token
      iat: '',
      // token 下发时间
      exp: 60,
      // token 有效期，默认：60s
      rename: true,
      // 重命名
      putExtra: {},
      config: {},
      // 动态获取配置信息，配合 async 使用
      getConfig: function getConfig() {},
      // 动态获取token
      getToken: function getToken() {}
    }, options);
    this.configComplete = false;
  }
  /**
   * 初始化
   * @private
   */


  _createClass(Qiniu, [{
    key: "_init",
    value: function _init() {
      var _this = this;

      return new Promise( /*#__PURE__*/function () {
        var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(resolve, reject) {
          var _this$opts;

          var _this$opts2;

          return regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
              switch (_context.prev = _context.next) {
                case 0:
                  // 判断是否异步获取配置信息
                  if ((_this$opts = _this.opts) !== null && _this$opts !== void 0 && _this$opts.async) {
                    // 是，判断是否已经获取过配置
                    if (!_this.configComplete) {
                      // 未获取，获取配置信息
                      (_this$opts2 = _this.opts) === null || _this$opts2 === void 0 ? void 0 : _this$opts2.getConfig().then(function (data) {
                        _this.opts = mergeDeep(_this.opts, data);
                        _this.configComplete = true;
                        resolve();
                      })["catch"](function () {
                        _this.configComplete = false;
                        reject();
                      });
                    } else {
                      // 已获取
                      resolve();
                    }
                  } else {
                    //  不是
                    _this.configComplete = true;
                    resolve();
                  }

                case 1:
                case "end":
                  return _context.stop();
              }
            }
          }, _callee);
        }));

        return function (_x, _x2) {
          return _ref.apply(this, arguments);
        };
      }());
    }
    /**
     * 上传
     * @param {String} key 文件资源名，为空字符串时则文件资源名也为空，为 null 或者 undefined 时则自动使用文件的 hash 作为文件名
     * @param {File} file File 对象
     * @param {Object} config
     */

  }, {
    key: "upload",
    value: function upload(key, file) {
      var _this2 = this;

      var config = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
      return new Promise(function (resolve, reject) {
        _this2._init().then( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
          var result, _this2$opts, opts, observable, subscription;

          return regeneratorRuntime.wrap(function _callee2$(_context2) {
            while (1) {
              switch (_context2.prev = _context2.next) {
                case 0:
                  _context2.next = 2;
                  return _this2._getToken();

                case 2:
                  result = _context2.sent;

                  if (result) {
                    opts = mergeDeep(_this2.opts, {
                      config: config
                    });
                    key = _this2._generateKey({
                      key: key,
                      rename: opts === null || opts === void 0 ? void 0 : opts.rename
                    });
                    observable = qiniu.upload(file, key, opts === null || opts === void 0 ? void 0 : opts.token, (_this2$opts = _this2.opts) === null || _this2$opts === void 0 ? void 0 : _this2$opts.putExtra, opts === null || opts === void 0 ? void 0 : opts.config);
                    subscription = observable.subscribe({
                      next: function next(res) {
                        var _opts$config;

                        if ('[object Function]' === Object.prototype.toString.call(opts === null || opts === void 0 ? void 0 : (_opts$config = opts.config) === null || _opts$config === void 0 ? void 0 : _opts$config.next)) {
                          var _opts$config2, _opts$config2$next;

                          opts === null || opts === void 0 ? void 0 : (_opts$config2 = opts.config) === null || _opts$config2 === void 0 ? void 0 : (_opts$config2$next = _opts$config2.next) === null || _opts$config2$next === void 0 ? void 0 : _opts$config2$next.call(_this2, res, subscription);
                        }
                      },
                      error: function error(err) {
                        reject(err);
                      },
                      complete: function complete(res) {
                        var key = res.key,
                            hash = res.hash;
                        resolve({
                          code: 200,
                          data: {
                            hash: hash,
                            key: key,
                            suffix: _this2._getSuffix(key),
                            url: _this2._getUrl(key),
                            size: file === null || file === void 0 ? void 0 : file.size
                          }
                        });
                      }
                    });
                  }

                case 4:
                case "end":
                  return _context2.stop();
              }
            }
          }, _callee2);
        })));
      });
    }
    /**
     * 获取 token
     * @returns {Promise<unknown>}
     */

  }, {
    key: "_getToken",
    value: function _getToken() {
      var _this3 = this;

      return new Promise( /*#__PURE__*/function () {
        var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(resolve, reject) {
          var _yield$_this3$opts$ge, token, iat, exp;

          return regeneratorRuntime.wrap(function _callee3$(_context3) {
            while (1) {
              switch (_context3.prev = _context3.next) {
                case 0:
                  if (_this3._validateToken()) {
                    _context3.next = 9;
                    break;
                  }

                  _context3.next = 4;
                  return _this3.opts.getToken()["catch"](function () {
                    reject();
                  });

                case 4:
                  _yield$_this3$opts$ge = _context3.sent;
                  token = _yield$_this3$opts$ge.token;
                  iat = _yield$_this3$opts$ge.iat;
                  exp = _yield$_this3$opts$ge.exp;
                  _this3.opts = mergeDeep(_this3.opts, {
                    token: token,
                    iat: iat,
                    exp: exp
                  });

                case 9:
                  resolve(true);

                case 10:
                case "end":
                  return _context3.stop();
              }
            }
          }, _callee3);
        }));

        return function (_x3, _x4) {
          return _ref3.apply(this, arguments);
        };
      }());
    }
    /**
     * 获取文件后缀
     * @param {String} fileName 文件名
     * @return {string}
     */

  }, {
    key: "_getSuffix",
    value: function _getSuffix(fileName) {
      return fileName.substring(fileName.lastIndexOf('.'), fileName.length);
    }
    /**
     * 获取 url
     * @param key
     * @return {*|string}
     */

  }, {
    key: "_getUrl",
    value: function _getUrl(key) {
      return this._formatPath("".concat(this.opts.domain, "/").concat(key));
    }
    /**
     * 格式化路径
     */

  }, {
    key: "_formatPath",
    value: function _formatPath(key) {
      var protocol = key.match(new RegExp('^((https|http|ftp|rtsp|mms))://', 'g'));
      return (protocol && protocol.length ? protocol[0] : '') + key.replace(protocol, '').replace(new RegExp('/{2,}', 'g'), '/').replace(new RegExp('^/'), '');
    }
    /**
     * 验证 token
     */

  }, {
    key: "_validateToken",
    value: function _validateToken() {
      var _this$opts3 = this.opts,
          token = _this$opts3.token,
          exp = _this$opts3.exp,
          iat = _this$opts3.iat; // token 不存在，无效

      if (!token) {
        return false;
      } // 有效期时长不存在，无效


      if (!exp) {
        return false;
      } // 当前时间大于有效期，无效


      var date = new Date();

      if (date.getTime() > iat + exp * 60 * 1000) {
        return false;
      }

      return true;
    }
    /**
     * 生成 key
     * @param {String} key
     * @param {Boolean} rename 重命名
     */

  }, {
    key: "_generateKey",
    value: function _generateKey(_ref4) {
      var key = _ref4.key,
          rename = _ref4.rename;
      if (!key) return null;
      var path = key.substring(0, key.lastIndexOf('/'));
      var name = rename ? "".concat(path, "/").concat(v4()).concat(this._getSuffix(key)) : key;
      return this._formatPath("".concat(this.opts.root, "/").concat(name));
    }
  }]);

  return Qiniu;
}();

export { Qiniu as default };
