/**
 * 首页路由模块
 * 处理根路径的请求
 */

var express = require('express'); // 引入Express模块
var router = express.Router(); // 创建路由实例

/**
 * GET / - 首页请求处理
 * 渲染首页模板
 */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' }); // 渲染index模板，传递title参数
});

// 导出路由模块
module.exports = router;
