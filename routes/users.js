/**
 * 用户路由模块
 * 处理用户相关的请求
 */

var express = require('express'); // 引入Express模块
var router = express.Router(); // 创建路由实例

/**
 * GET /users - 用户列表请求处理
 * 返回用户资源
 */
router.get('/', function(req, res, next) {
  res.send('respond with a resource'); // 返回用户资源
});

// 导出路由模块
module.exports = router;
