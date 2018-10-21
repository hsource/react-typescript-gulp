const babelify = require('babelify');
const browserify = require('browserify');
const babel = require('gulp-babel');
const gulp = require('gulp');
const cache = require('gulp-cached');
const livereload = require('gulp-livereload');
const nodemon = require('gulp-nodemon');
const rev = require('gulp-rev');
const sass = require('gulp-sass');
const sourcemaps = require('gulp-sourcemaps');
const ts = require('gulp-typescript');
const path = require('path');
const tinyify = require('tinyify');
const tsify = require('tsify');
const buffer = require('vinyl-buffer');
const source = require('vinyl-source-stream');
const watchify = require('watchify');

const tsProject = ts.createProject('tsconfig.json');

function handleError(error) {
  console.error(error);
  this.emit('end');
}

function createBuildServerJSTask({
  name,
  globs,
  destination,
  serverWatchGlobs = undefined,
  checkTypescript = false,
}) {
  if (serverWatchGlobs) {
    serverWatchGlobs[name] = globs;
  }

  gulp.task(name, function() {
    let task = gulp
      .src(globs)
      .pipe(cache(name))
      .pipe(sourcemaps.init());

    if (checkTypescript) {
      task = task.pipe(tsProject());
    }

    return task
      .pipe(
        babel({
          presets: [
            '@babel/preset-typescript',
            '@babel/preset-react',
            ['@babel/preset-env', { targets: { node: 'current' } }],
          ],
        }),
      )
      .on('error', handleError)
      .pipe(sourcemaps.write('.'))
      .pipe(gulp.dest(destination));
  });
}

function createBuildClientJSTask({
  name,
  sourceFile,
  destFile,
  destDir,
  production = false,
  watch = false,
  checkTypescript = false,
  vendorPackages = [],
  ignorePackages = [],
}) {
  gulp.task(name, function() {
    const b = browserify(sourceFile, {
      extensions: ['.js', '.json', '.ts', '.tsx'],
      debug: !production,
      cache: {},
      packageCache: {},
    });

    if (watch) {
      b.plugin(watchify);
    }

    if (checkTypescript) {
      b.plugin(tsify);
    }

    b.transform(babelify, {
      extensions: ['.js', '.json', '.ts', '.tsx'],
      presets: [
        ['@babel/preset-env', { targets: { browsers: ['> 0.5%'] } }],
        '@babel/preset-typescript',
        '@babel/preset-react',
      ],
      plugins: [
        ['@babel/plugin-proposal-decorators', { legacy: true }],
        ['@babel/plugin-proposal-class-properties', { loose: true }],
      ],
    });

    if (production) {
      b.plugin(tinyify);
    }

    vendorPackages.forEach(function(package) {
      b.external(package);
    });
    ignorePackages.forEach(function(package) {
      b.ignore(package);
    });

    function bundle(rebundle) {
      const stream = b
        .bundle()
        .on('error', handleError)
        .pipe(source(destFile))
        .pipe(buffer())
        .pipe(gulp.dest(destDir));

      if (rebundle) {
        stream.on('end', function() {
          console.log('Rebundled ' + destFile);
        });
      }

      return stream;
    }

    b.on('update', function() {
      bundle(true);
    });

    return bundle(false);
  });
}

function createWatchTask(name, watchGlobs) {
  gulp.task(name, function(cb) {
    Object.keys(watchGlobs).forEach(function(taskName) {
      const glob = watchGlobs[taskName];
      gulp.watch(glob, [taskName]);
    });
    cb();
  });
}

function createRevRenameTask(name, glob, dest, manifestDest, production) {
  gulp.task(name, function(cb) {
    if (production) {
      return gulp
        .src(glob)
        .pipe(rev())
        .pipe(gulp.dest(dest))
        .pipe(rev.manifest()) // Used for rev-replace-references
        .pipe(gulp.dest(manifestDest));
    }
    return gulp.src('.');
  });
}

function createBuildViewsTask({
  name,
  glob,
  dest,
  revManifestPath = '',
  production = false,
  watchGlobs = undefined,
}) {
  gulp.task('build-views', function buildViews() {
    if (watchGlobs) {
      watchGlobs[name] = glob;
    }

    var ret = gulp.src(glob);
    if (production && revManifestPath) {
      ret = ret.pipe(
        revReplace({
          replaceInExtensions: ['.html'],
          manifest: gulp.src(revManifestPath),
        }),
      );
      watchGlobs[name] = `{${watchGlobs[name]},${revManifestPath}}`;
    } else {
      ret = ret.pipe(cache(name));
    }

    return ret.pipe(gulp.dest(dest));
  });
}

function createBuildSassTask(
  name,
  glob,
  dests,
  production = false,
  watchGlobs = undefined,
) {
  if (watchGlobs) {
    watchGlobs[name] = glob;
  }

  gulp.task(name, function() {
    var stream = gulp.src(glob);

    if (!production) {
      stream = stream.pipe(sourcemaps.init());
    }

    stream = stream.pipe(sass().on('error', sass.logError));

    if (!production) {
      stream = stream.pipe(sourcemaps.write());
    }

    for (const dest of dests) {
      stream = stream.pipe(gulp.dest(dest));
    }

    return stream;
  });
}

function createCopyGulpTask(taskName, globs, destDir, watchGlobsVar) {
  if (watchGlobsVar) {
    watchGlobsVar[taskName] = globs;
  }

  gulp.task(taskName, function() {
    return gulp
      .src(globs)
      .pipe(cache(taskName))
      .pipe(gulp.dest(destDir));
  });
}

function createRunServerTask(name, script, watchDirs, env = {}) {
  gulp.task(name, cb => {
    livereload.listen();
    nodemon({
      script: script,
      ext: 'js json ejs css jpg png',
      env,
      delay: 0.2,
      watch: watchDirs,
      stdout: false,
    }).on('readable', function() {
      this.stdout.on('data', function(chunk) {
        if (/^Express server listening on port/.test(chunk)) {
          livereload.changed(path.join(__dirname, 'server'));
        }
      });
      this.stdout.pipe(process.stdout);
      this.stderr.pipe(process.stderr);
    });
  });
}

module.exports = {
  createBuildClientJSTask,
  createBuildServerJSTask,
  createWatchTask,
  createRevRenameTask,
  createBuildViewsTask,
  createBuildSassTask,
  createCopyGulpTask,
  createRunServerTask,
};
