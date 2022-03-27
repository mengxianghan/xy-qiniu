## 安装

### NPM

```shell
npm install --save xy-qiniu
```

## 使用

```javascript
import Qiniu from 'xy-qiniu'

const options = {}
const store = new Qiniu(options)
```

## Options

| 名称 | 必填 | 说明 |
|:----|:----|:----|
| async | 否 | 是否异步获取配置信息，默认 false。如果为 true 时，getConfig 需要返回 Promise 对象 |
| root | 否 | 根目录，默认为空 |
| domain | 否 | 域名，用于获取完整 url |
| reanme | 否 | 重命名，将文件名重命名为 uuid 格式，默认：true |
| config | 否 | 配置 |
| config.next | 否 | subscribe 中的 next 函数，<a href="https://developer.qiniu.com/kodo/1283/javascript" target="_blank">查看详细</a> |
| getConfig | 否 | 动态获取配置信息，async 为 true 时必填，返回一个 Promise 对象 |
| getToken | 否 | 获取token，动态刷新token使用，返回一个 Promise 对象 |

## Methods

### .upload('key', 'file' [, 'config'])

文件上传

## 依赖

[qiniu-js](https://www.npmjs.com/package/qiniu-js)

## 参考

[对象储存](https://developer.qiniu.com/kodo/1283/javascript)
