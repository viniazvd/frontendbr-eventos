'use strict'

import gulp from 'gulp'
import plumber from 'gulp-plumber'
import stylus from 'gulp-stylus'
import poststylus from 'poststylus'
import rucksack from 'rucksack-css'
import fontMagician from 'postcss-font-magician'
import gcmq from 'gulp-group-css-media-queries'
import cssnano from 'gulp-cssnano'
import sourcemaps from 'gulp-sourcemaps'
import lost from 'lost'
import rupture from 'rupture'
import concat from 'gulp-concat'
import uglify from 'gulp-uglify'
import ejs from 'gulp-ejs'
import imagemin from 'gulp-imagemin'
import browserSync from 'browser-sync'
import ghPages from 'gulp-gh-pages'
import svgmin from 'gulp-svgmin'
import svgstore from 'gulp-svgstore'
import cheerio from 'gulp-cheerio'
import jspm from 'gulp-jspm'
import standard from 'gulp-standard'

const srcPaths = {
  js: 'src/js/**/*.js',
  mainJS: 'src/js/index.js',
  css: 'src/styl/**/*.styl',
  mainStyl: 'src/styl/main.styl',
  ejs: 'src/templates/**/*.ejs',
  img: 'src/img/**/*',
  icons: 'src/svg/icons/*',
  svg: 'src/svg/',
  data: 'src/data/**/*',
  gulpfile: 'gulpfile.babel.js'
}

const buildPaths = {
  build: 'build/**/*',
  js: 'build/js/',
  css: 'build/css/',
  ejs: 'build/',
  img: 'build/img',
  svg: 'build/svg/',
  data: 'build/data'
}

gulp.task('css', () => {
  gulp.src(srcPaths.mainStyl)
    .pipe(sourcemaps.init())
    .pipe(stylus({
      use: [
        rupture(),
        poststylus([
          lost(),
          fontMagician(),
          rucksack({ autoprefixer: true })
        ])
      ]
    }))
    .pipe(gcmq())
    .pipe(cssnano())
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(buildPaths.css))
})

gulp.task('lint', () => {
  gulp.src([srcPaths.js, srcPaths.gulpfile])
    .pipe(standard())
    .pipe(standard.reporter('default', {}))
})

gulp.task('js', ['lint'], () => {
  return gulp.src(srcPaths.mainJS)
    .pipe(sourcemaps.init())
    .pipe(plumber())
    .pipe(jspm({ selfExecutingBundle: true }))
    .pipe(concat('main.min.js'))
    .pipe(uglify())
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(buildPaths.js))
})

gulp.task('ejs', () => {
  const settings = { ext: '.html' }
  const config = {
    data: {
      // analytics: { ga: 1010 }
    }
  }
  gulp.src(srcPaths.ejs)
    .pipe(plumber())
    .pipe(ejs(config, settings))
    .pipe(gulp.dest(buildPaths.ejs))
})

gulp.task('images:img', () => {
  gulp.src(srcPaths.img)
    .pipe(plumber())
    .pipe(imagemin({
      optimizationLevel: 3,
      progressive: true,
      interlaced: true
    }))
    .pipe(gulp.dest(buildPaths.img))
})

gulp.task('images:svg', () => {
  gulp.src(`${srcPaths.svg}/logo.svg`)
    .pipe(gulp.dest(buildPaths.svg))
})

gulp.task('images', ['images:img', 'images:svg'])

gulp.task('icons', () => {
  gulp.src(srcPaths.icons)
    .pipe(svgmin())
    .pipe(svgstore({ fileName: 'icons.svg', inlineSvg: true }))
    .pipe(cheerio({
      run: ($, file) => {
        $('svg').addClass('hide')
        $('[fill]').removeAttr('fill')
      },
      parserOptions: { xmlMode: true }
    }))
    .pipe(gulp.dest(buildPaths.svg))
})

gulp.task('copy-data', () => {
  gulp.src(srcPaths.data)
    .pipe(gulp.dest(buildPaths.data))
})

gulp.task('watch', () => {
  gulp.watch(srcPaths.ejs, ['ejs'])
  gulp.watch(srcPaths.css, ['css'])
  gulp.watch(srcPaths.js, ['js'])
  gulp.watch(srcPaths.img, ['images'])
})

gulp.task('browser-sync', () => {
  var files = [
    buildPaths.build
  ]

  browserSync.init(files, {
    server: {
      baseDir: './build/'
    }
  })
})

gulp.task('pages', () => {
  gulp.src(buildPaths.build)
    .pipe(ghPages())
})

gulp.task('default', ['css', 'ejs', 'js', 'images', 'icons', 'copy-data', 'watch', 'browser-sync'])
gulp.task('build', ['css', 'ejs', 'js', 'images', 'copy-data'])
gulp.task('deploy', ['css', 'ejs', 'js', 'images', 'copy-data', 'pages'])
