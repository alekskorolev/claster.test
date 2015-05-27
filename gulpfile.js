/*jslint browser: true, devel: true, node: true, nomen: true, es5: true*/
/*global  angular, $ */
var gulp = require('gulp'),
  mocha = require('gulp-mocha');

gulp.task('unit', function (cb) {
  "use strict";
  return gulp.src('test/index.js', {
    read: false
  })
    .pipe(
      mocha({
        reporter: 'spec'
      })
    );
});

gulp.task('unit-watch', function (cb) {
  "use strict";
  gulp.start('unit');
  gulp.watch(['test/*.js', 'app/**/*.js', 'app/*.js'], ['unit']);
});