var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// 404 处理
app.use(function(req, res) {
  res.status(404).json({ code: 404, msg: '接口不存在' });
});

// 错误处理
app.use(function(err, req, res) {
  res.status(500).json({ code: 500, msg: '服务器错误' });
});

module.exports = app;
