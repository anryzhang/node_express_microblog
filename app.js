var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var partials = require('express-partials');

//使用时新添加的，上面的依赖包是创建文件时自带的。
var settings = require('./settings');//数据库连接依赖包

//session会话存储于数据库依赖包（与教程中的区别）
var session = require('express-session');//session使用
var MongoStore = require('connect-mongo')(session);//mongodb使用

//加载路由控制
var routes = require('./routes/index');

//引入 flash 模块来实现页面通知
var flash = require('connect-flash');

// 函数创建了一个应用的实例,后面的所有操作都是针对于这个实例进行的
var app = express();

// app.set 是 Express 的参数设置工具,接受一个键(key)和一个值(value),可用的参数如下所示
// 1. basepath:基础地址,通常用于 res.redirect() 跳转。
// 2. views:视图文件的目录,存放模板文件。
// 3. view engine:视图模板引擎。
// 4. view options:全局视图参数对象。
// 5. view cache:启用视图缓存。
// 6. case sensitive routes:路径区分大小写。
// 7. strict routing:严格路径,启用后不会忽略路径末尾的“ / ”。
// 8. jsonp callback:开启透明的 JSONP 支持。
// view engine setup

app.set('views', path.join(__dirname, 'views')); // 为设置存放模板文件的路径，其中__dirname为全局变量，存放当前脚本所在目录
app.set('view engine', 'ejs');

app.use(partials());
// Express 依赖于 connect,提供了大量的中间件,可以通过 app.use 启用
// 1. bodyParser 的功能是解析客户端请求,通常是通过 POST 发送的内容。
// 2. router 是项目的路由支持。
// 3. static 提供了静态文件支持。 
// 4. errorHandler 是错误控制器。

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));     // express依赖于connect这里就内建中间件会输出一些日志
app.use(bodyParser.json()); // 用以解析请求体，这里就会把字符串动态转换为json对象
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// 先要链接数据库
app.use(session({
  secret: settings.cookieSecret,
  key: settings.db,  //cookie name
  cookie: {maxAge: 1000 * 60 * 60 * 24 * 30},//30 days
  resave: false,
  saveUninitialized: true,
  store: new MongoStore({
    url: 'mongodb://127.0.0.1/'+settings.db
  })}));

app.use(flash());//定义使用 flash 功能

// 为了实现用户不同登录状态下显示不同的页面成功或者错误提示信息
app.use(function(req,res,next){
   //res.locals.xxx实现xxx变量全局化，在其他页面直接访问变量名即可
   //访问session数据：用户信息
   res.locals.user = req.session.user;
   //获取要显示错误信息
    var error = req.flash('error');//获取flash中存储的error信息
  
    res.locals.error = error.length ? error : null;

    //获取要显示成功信息
    var success = req.flash('success');
    
    res.locals.success = success.length ? success : null;
    next();//控制权转移，继续执行下一个app。use()
});
//定义匹配路由
app.use('/', routes); //指向了routes目录下的index.js文件


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
