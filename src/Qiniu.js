import { v4 as uuidv4 } from 'uuid';

import * as qiniu from 'qiniu-js';

import { mergeDeep } from './util';

class Qiniu {
    constructor(options) {
        this.opts = mergeDeep(
            {
                async: false, // 是否异步获取配置信息，默认 false。如果为 true 时，getConfig 需要返回 Promise 对象
                root: '',
                domain: '',
                token: '', // token
                iat: '', // token 下发时间
                exp: 60, // token 有效期，默认：60s
                rename: true, // 重命名
                putExtra: {},
                config: {},
                // 动态获取配置信息，配合 async 使用
                getConfig: function () {},
                // 动态获取token
                getToken: function () {},
            },
            options
        );

        this.configComplete = false;
    }

    /**
     * 初始化
     * @private
     */
    _init() {
        return new Promise(async (resolve, reject) => {
            // 判断是否异步获取配置信息
            if (this.opts?.async) {
                // 是，判断是否已经获取过配置
                if (!this.configComplete) {
                    // 未获取，获取配置信息
                    this.opts
                        ?.getConfig()
                        .then((data) => {
                            this.opts = mergeDeep(this.opts, data);
                            this.configComplete = true;
                            resolve();
                        })
                        .catch(() => {
                            this.configComplete = false;
                            reject();
                        });
                } else {
                    // 已获取
                    resolve();
                }
            } else {
                //  不是
                this.configComplete = true;
                resolve();
            }
        });
    }

    /**
     * 上传
     * @param {String} key 文件资源名，为空字符串时则文件资源名也为空，为 null 或者 undefined 时则自动使用文件的 hash 作为文件名
     * @param {File} file File 对象
     * @param {Object} config
     */
    upload(key, file, config = {}) {
        return new Promise((resolve, reject) => {
            this._init().then(async () => {
                const result = await this._getToken();
                if (result) {
                    const opts = mergeDeep(this.opts, { config });
                    key = this._generateKey({ key, rename: opts?.rename });
                    const observable = qiniu.upload(
                        file,
                        key,
                        opts?.token,
                        this.opts?.putExtra,
                        opts?.config
                    );
                    const subscription = observable.subscribe({
                        next: (res) => {
                            if (
                                '[object Function]' ===
                                Object.prototype.toString.call(
                                    opts?.config?.next
                                )
                            ) {
                                opts?.config?.next?.call(
                                    this,
                                    res,
                                    subscription
                                );
                            }
                        },
                        error: (err) => {
                            reject(err);
                        },
                        complete: (res) => {
                            const { key, hash } = res;
                            resolve({
                                code: 200,
                                data: {
                                    hash,
                                    key,
                                    suffix: this._getSuffix(key),
                                    url: this._getUrl(key),
                                    size: file?.size,
                                },
                            });
                        },
                    });
                }
            });
        });
    }

    /**
     * 获取 token
     * @returns {Promise<unknown>}
     */
    _getToken() {
        return new Promise(async (resolve, reject) => {
            // 判断 token 是否过期
            if (!this._validateToken()) {
                const date = new Date();
                // 已过期，获取新 token
                const { token, iat, exp } = await this.opts
                    .getToken()
                    .catch(() => {
                        reject();
                    });
                this.opts = mergeDeep(this.opts, {
                    token,
                    iat,
                    exp,
                });
            }
            resolve(true);
        });
    }

    /**
     * 获取文件后缀
     * @param {String} fileName 文件名
     * @return {string}
     */
    _getSuffix(fileName) {
        return fileName.substring(fileName.lastIndexOf('.'), fileName.length);
    }

    /**
     * 获取 url
     * @param key
     * @return {*|string}
     */
    _getUrl(key) {
        return this._formatPath(`${this.opts.domain}/${key}`);
    }

    /**
     * 格式化路径
     */
    _formatPath(key) {
        const protocol = key.match(
            new RegExp('^((https|http|ftp|rtsp|mms))://', 'g')
        );
        return (
            (protocol && protocol.length ? protocol[0] : '') +
            key
                .replace(protocol, '')
                .replace(new RegExp('/{2,}', 'g'), '/')
                .replace(new RegExp('^/'), '')
        );
    }

    /**
     * 验证 token
     */
    _validateToken() {
        const { token, exp, iat } = this.opts;
        // token 不存在，无效
        if (!token) {
            return false;
        }
        // 有效期时长不存在，无效
        if (!exp) {
            return false;
        }
        // 当前时间大于有效期，无效
        const date = new Date();
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
    _generateKey({ key, rename }) {
        if (!key) return null;
        const path = key.substring(0, key.lastIndexOf('/'));
        const name = rename
            ? `${path}/${uuidv4()}${this._getSuffix(key)}`
            : key;
        return this._formatPath(`${this.opts.root}/${name}`);
    }
}

export default Qiniu;
