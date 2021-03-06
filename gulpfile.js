var gulp = require('gulp'),
  argv = require('yargs').argv,
  browserify = require('browserify'),
  browserSync = require('browser-sync'),
  babelify = require('babelify'),
  buffer = require('gulp-buffer'),
  changed = require('gulp-changed'),
  cp = require('child_process'),
  debug = require('gulp-debug'),
  gulpif = require('gulp-if'),
  jekyll = process.platform === 'win32' ? 'jekyll.bat' : 'jekyll',
  prefix = require('gulp-autoprefixer'),
  reload = browserSync.reload,
  rename = require("gulp-rename"),
  runSequence = require('gulp4-run-sequence'),
  sass = require('gulp-sass'),
  sourcemaps = require('gulp-sourcemaps'),
  tap = require('gulp-tap'),
  uglify = require('gulp-uglify'),
  imagemin = require('gulp-imagemin');


gulp.task('jekyll-build', function(done) {
  return cp.spawn('bundle', ['exec', 'jekyll', 'build', '--watch', '--incremental'], {
      stdio: 'inherit'
    })
    .on('close', done);
});


gulp.task('dev-server', function() {
  return browserSync({
    server: {
      baseDir: 'docs/'
    }
  });
});

gulp.task('share', function() {
  return browserSync.init({
    server: {
      baseDir: "docs"
    },
    ghostMode: false
  });
});

gulp.task('javascripts', function() {
  return gulp.src(['./_scripts/**/*.js'])
    .pipe(gulpif(!argv.force, changed('./assets/scripts', {
      extension: '.js'
    })))
    .pipe(
      tap(function(file) {
        file.contents = browserify(file.path, {
          debug: true,
          paths: ["./node_modules", "./assets/_scripts"]
        })
        .transform(babelify, {
          presets: ["@babel/preset-env", "@babel/preset-react"]
        })
        .bundle()
        .on("error", function(err) {
          console.log(err);
          this.emit("end");
        });
      })
    )
    .pipe(buffer())
    .pipe(sourcemaps.init({
        loadMaps: true
    }))
    // .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./assets/scripts'))
    .pipe(gulp.dest('./docs/assets/scripts'))
    .pipe(reload({ stream: true }));
});


gulp.task('stylesheets', function() {
  return gulp.src(['./_scss/**/*.scss', './node_modules/bootstrap/scss/bootstrap.scss'])
    // .pipe(gulpif(!argv.force, changed('./assets/css', {
    //     extension: '.css'
    // })))
    .pipe(sass({
      outputStyle: 'compressed',
      includePaths: [
        './_scss/',
        './node_modules/bootstrap/scss/bootstrap.scss'
      ]
    })).on('error', function(err) {
      browserSync.notify(err.message, 10000);
      console.log(err);
      this.emit('end');
    })
    .pipe(prefix(['last 15 versions', '> 5%'], {
      cascade: true
    }))
    .pipe(debug({
      title: 'SCSS Compiled:'
    }))
    .pipe(gulp.dest('./assets/css'))
    .pipe(reload({ stream: true }));
});

gulp.task('optimize_images', function() {
  return gulp.src('./assets/assets/images/**/*.{jpg, bmp, gif, png, jpeg, svg}')
    .pipe(imagemin())
    .pipe(debug({
      title: 'Crunched:'
    }))
    .pipe(gulp.dest('./assets/images'))
    .pipe(reload({ stream: true }));
});

gulp.task('watch', function () {
  gulp.watch('./_scss/**/*.scss', gulp.series('stylesheets'));
  gulp.watch('./node_modules/bootstrap/scss/bootstrap.scss', gulp.series('stylesheets'));
  gulp.watch('./_scripts/**/*.js', gulp.series('javascripts'));
  gulp.watch(['./docs/**/*']).on("change", reload);
});

gulp.task('server', function(callback) {
  runSequence(['jekyll-build', 'dev-server', 'watch'], callback);
})

gulp.task('default', function() {
  console.log("try running 'gulp server'...");
});
