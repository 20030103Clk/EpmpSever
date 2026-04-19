/**
 * 主应用配置文件
 * 负责初始化Express应用、配置中间件和路由
 */

// 引入依赖模块
var express = require('express'); // Express框架
var path = require('path'); // 路径处理模块
var cookieParser = require('cookie-parser'); // Cookie解析中间件
var logger = require('morgan'); // 日志中间件

// 引入路由模块
var indexRouter = require('./routes/index'); // 首页路由
var usersRouter = require('./routes/users'); // 用户路由

// 创建Express应用实例
var app = express();

// 配置中间件
app.use(logger('dev')); // 开发环境日志
app.use(express.json()); // 解析JSON请求体
app.use(express.urlencoded({ extended: false })); // 解析URL编码的请求体
app.use(cookieParser()); // 解析Cookie
app.use(express.static(path.join(__dirname, 'public'))); // 静态文件服务

// 配置路由
app.use('/', indexRouter); // 首页路由
app.use('/users', usersRouter); // 用户路由

// 404 错误处理中间件
app.use(function(req, res) {
  res.status(404).json({ code: 404, msg: '接口不存在' });
});

// 500 服务器错误处理中间件
app.use(function(err, req, res) {
  res.status(500).json({ code: 500, msg: '服务器错误' });
});

// 导出应用实例
module.exports = app;
