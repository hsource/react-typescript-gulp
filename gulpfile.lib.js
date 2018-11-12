const gulp = require('gulp');
const babel = require('gulp-babel');
const cache = require('gulp-cached');
const gulpIf = require('gulp-if');
const nodemon = require('gulp-nodemon');
const rev = require('gulp-rev');
const sass = require('gulp-sass');
const sourcemaps = require('gulp-sourcemaps');
const ts = require('gulp-typescript');
const webpack = require('webpack-stream');
const webpackLib = require('webpack');
const through = require('through2');
const buffer = require('vinyl-buffer');
const source = require('vinyl-source-stream');
const watchify = require('watchify');
const rsync = require('gulp-rsync');
const revReplace = require('gulp-rev-replace');
const fs = require('fs');
const del = require('del');

const babelify = require('babelify');
const browserify = require('browserify');
const tinyify = require('tinyify');
const tsify = require('tsify');

const autoprefixer = require('autoprefixer');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
// const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

const tsProject = ts.createProject('tsconfig.json');

const browsersListBrowsers = ['>0.5% in US', 'not Android >0'];

function handleError(error) {
  console.error(error);
  this.emit('end');
}

function createCheckServerJSTask({
  name,
  globs,
  destination,
  serverWatchGlobs = undefined,
}) {
  if (serverWatchGlobs) {
    serverWatchGlobs[name] = globs;
  }

  gulp.task(name, () => {
    return gulp
      .src(globs)
      .pipe(tsProject())
      .on('error', handleError)
      .pipe(gulp.dest(destination));
  });
}

function createBuildServerJSTask({
  name,
  globs,
  destination,
  serverWatchGlobs = undefined,
}) {
  if (serverWatchGlobs) {
    serverWatchGlobs[name] = globs;
  }

  gulp.task(name, () => {
    return gulp
      .src(globs)
      .pipe(cache(name))
      .pipe(sourcemaps.init())
      .pipe(babel())
      .on('error', handleError)
      .pipe(sourcemaps.write('.'))
      .pipe(gulp.dest(destination));
  });
}

const buildClientBabelOpts = {
  babelrc: false,
  presets: [
    ['@babel/preset-env', { targets: { browsers: browsersListBrowsers } }],
    '@babel/preset-typescript',
    '@babel/preset-react',
  ],
  plugins: [
    ['@babel/plugin-proposal-decorators', { legacy: true }],
    ['@babel/plugin-proposal-class-properties', { loose: true }],
  ],
};

function createBuildClientJSWebpackTask(
  name,
  {
    sourceFile,
    destFile,
    destDir,
    cssDestDir,
    production = false,
    watch = false,
  },
) {
  const commonCssLoaders = [
    { loader: MiniCssExtractPlugin.loader },
    {
      loader: 'css-loader',
      options: {
        importLoaders: 2, // Indicates both post-css and sass-loaders are used before this
        sourceMap: !production,
      },
    },
    {
      loader: 'postcss-loader',
      options: {
        ident: 'postcss',
        plugins: [autoprefixer({ browsers: browsersListBrowsers })],
        sourceMap: !production,
        map: { inline: true },
      },
    },
  ];

  const webpackConfig = {
    mode: production ? 'production' : 'development',
    output: { filename: destFile },
    watch,
    devtool: production ? false : 'cheap-module-eval-source-map',
    resolve: {
      extensions: ['.wasm', '.mjs', '.js', '.json', '.ts', '.tsx'],
    },
    module: {
      rules: [
        {
          test: /\.(js|jsx|mjs|ts|tsx)$/,
          exclude: /node_modules/,
          use: [
            {
              loader: 'babel-loader',
              options: Object.assign({}, buildClientBabelOpts, {
                cacheDirectory: true,
              }),
            },
          ],
        },
        {
          test: /\.s?css$/,
          use: commonCssLoaders.concat([
            {
              loader: 'sass-loader',
              options: { sourceMap: !production },
            },
          ]),
        },
        {
          test: /\.less$/,
          use: commonCssLoaders.concat([
            {
              loader: 'less-loader',
              options: { javascriptEnabled: true, sourceMap: !production },
            },
          ]),
        },
      ],
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: '[name].css',
        chunkFilename: '[name]-[id].css',
        sourceMap: !production,
      }),
      // new ForkTsCheckerWebpackPlugin({
      //   checkSyntacticErrors: true,
      //   tslint: true,
      // }),
    ],
  };

  if (production) {
    webpackConfig.optimization = {
      minimizer: [
        new UglifyJsPlugin({
          cache: true,
          parallel: true,
          sourceMap: true,
        }),
        new OptimizeCSSAssetsPlugin({}),
      ],
    };
  } else {
    // This is to generate sourcemaps for CSS files; workaround from
    // https://github.com/webpack-contrib/mini-css-extract-plugin/issues/29#issuecomment-382424129
    webpackConfig.plugins.push(
      new webpackLib.SourceMapDevToolPlugin({
        filename: '[file].map',
        exclude: ['/vendor/'],
      }),
    );
  }

  gulp.task(name, taskDone => {
    let cssEmitted = false;
    let jsEmitted = false;
    let taskDoneCalled = false;

    gulp
      .src(sourceFile)
      .pipe(webpack(webpackConfig))
      .pipe(gulpIf(/\.css/, gulp.dest(cssDestDir)))
      .pipe(gulpIf(/\.js/, gulp.dest(destDir)))
      .pipe(
        through.obj((file, enc, cb) => {
          // We want to mark the task as finished as soon as the first set of
          // files are bundled, so we don't block later tasks
          if (file.path.match(/\.css$/)) {
            cssEmitted = true;
          }
          if (file.path.match(/\.js$/)) {
            jsEmitted = true;
          }

          if (cssEmitted && jsEmitted && !taskDoneCalled) {
            taskDoneCalled = true;
            taskDone();
          }

          cb(null, file);
        }),
      );
  });
}

function createBuildClientJSBrowserifyTask(
  name,
  {
    sourceFile,
    destFile,
    destDir,
    production = false,
    watch = false,
    checkTypescript = false,
    vendorPackages = [],
    ignorePackages = [],
  },
) {
  gulp.task(name, () => {
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

    b.transform(
      babelify,
      Object.assign({}, buildClientBabelOpts, {
        extensions: ['.js', '.json', '.ts', '.tsx'],
      }),
    );

    if (production) {
      b.plugin(tinyify);
    }

    vendorPackages.forEach(pkg => {
      b.external(pkg);
    });
    ignorePackages.forEach(pkg => {
      b.ignore(pkg);
    });

    function bundle(rebundle) {
      const stream = b
        .bundle()
        .on('error', handleError)
        .pipe(source(destFile))
        .pipe(buffer())
        .pipe(gulp.dest(destDir));

      if (rebundle) {
        stream.on('end', () => {
          console.info('Rebundled ' + destFile);
        });
      }

      return stream;
    }

    b.on('update', () => {
      bundle(true);
    });

    return bundle(false);
  });
}

function createWatchTask(name, watchGlobs) {
  gulp.task(name, cb => {
    Object.keys(watchGlobs).forEach(taskName => {
      const glob = watchGlobs[taskName];
      gulp.watch(glob, [taskName]);
    });
    cb();
  });
}

function createRevRenameTask(name, glob, dest, manifestDest, production) {
  gulp.task(name, () => {
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
  gulp.task('build-views', () => {
    if (watchGlobs) {
      watchGlobs[name] = glob;
    }

    let ret = gulp.src(glob);
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

  gulp.task(name, () => {
    let stream = gulp.src(glob);

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

  gulp.task(taskName, () => {
    return gulp
      .src(globs)
      .pipe(cache(taskName))
      .pipe(gulp.dest(destDir));
  });
}

function createCreateDirectoriesGulpTask(taskName, directories) {
  gulp.task(taskName, () => {
    directories.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  });
}

function createRunServerTask(name, script, watchDirs, env = {}) {
  gulp.task(name, () => {
    nodemon({
      script: script,
      ext: 'js json ejs css jpg png',
      env,
      delay: 0.2,
      watch: watchDirs,
      stdout: false,
    }).on('readable', function() {
      this.stdout.pipe(process.stdout);
      this.stderr.pipe(process.stderr);
    });
  });
}

function createSyncTask(name, srcGlobs, rsyncOptions) {
  gulp.task(name, () =>
    gulp
      .src(srcGlobs)
      .pipe(cache(name))
      .pipe(rsync(rsyncOptions)),
  );
}

/**
 * Get a gulp task to delete all items at a certain path
 * @param {string|string[]} globs
 * @return Promise.<void>
 */
function createDeleteTask(name, globs) {
  gulp.task(name, () => {
    globs = globs instanceof Array ? globs : [globs];
    return del(globs);
  });
}

module.exports = {
  createCheckServerJSTask,
  createBuildServerJSTask,
  createBuildClientJSWebpackTask,
  createBuildClientJSBrowserifyTask,
  createWatchTask,
  createRevRenameTask,
  createBuildViewsTask,
  createBuildSassTask,
  createCopyGulpTask,
  createCreateDirectoriesGulpTask,
  createRunServerTask,
  createSyncTask,
  createDeleteTask,
};
