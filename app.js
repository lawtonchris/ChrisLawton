var createError = require('http-errors');
var express = require('express');
const logger = require('morgan');
var path = require('path');
const PORT = 3000;

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var swimReportRouter = require('./routes/swimReport');

var app = express();

//Download Buoy file and Start cron job to download buoy data
//const downloadBuoyData = require('./jobs/downloadBuoyData');
//downloadBuoyData('44007', 6);

const getHighTides = require('./jobs/getHighTides');
getHighTides();

const { get } = require('http');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/swimreport',swimReportRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

/*
const server = app.listen(PORT, function () {
    console.log('listening to port ' + PORT);
});
*/
module.exports = app;
