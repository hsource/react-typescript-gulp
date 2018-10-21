const gulp = require('gulp');
const runSequence = require('run-sequence');
const {
  createBuildClientJSTask,
  createBuildServerJSTask,
  createWatchTask,
  createRevRenameTask,
  createBuildViewsTask,
  createBuildSassTask,
  createCopyGulpTask,
  createRunServerTask,
} = require('./gulpfile.lib');

const serverWatchGlobs = {};
const clientWatchGlobs = {};

let production = false;

// Base client tasks
const buildClientJSArgs = {
  name: 'build-client-js',
  sourceFile: 'client/js/InitWeb.ts',
  destFile: 'web.js',
  destDir: 'dist/client/js',
  production,
  watch: false,
};

createBuildClientJSTask(buildClientJSArgs);
createBuildClientJSTask(
  Object.assign({}, buildClientJSArgs, {
    name: 'watch-client-js',
    watch: true,
  }),
);

createBuildClientJSTask(
  Object.assign({}, buildClientJSArgs, {
    name: 'watch-and-check-client-js',
    destDir: 'dist/check/client/js',
    checkTypescript: true,
    watch: true,
  }),
);

createBuildSassTask(
  'sass',
  'client/assets/**/*.scss',
  ['dist/client/assets'],
  production,
  clientWatchGlobs,
);

createCopyGulpTask(
  'copy-assets',
  'client/assets/{**/*,*}',
  'dist/client/assets',
  clientWatchGlobs,
);

// Client tasks
gulp.task('build-client-non-js', ['sass', 'copy-assets']);
gulp.task('build-client', ['build-client-non-js', 'build-client-js']);
createWatchTask('start-watching-client', clientWatchGlobs);

gulp.task('watch-client', ['build-client-non-js', 'watch-client-js'], cb => {
  runSequence('start-watching-client', cb);
});

// Base server tasks
const buildServerJSOptions = {
  name: 'build-server-js',
  globs: '{server/{*.ts?(x),**/*.ts?(x)},client/{js,templates}/**/*.ts?(x)}',
  destination: 'dist/app',
  checkTypescript: false,
  serverWatchGlobs,
};

createBuildServerJSTask(buildServerJSOptions);

createBuildServerJSTask(
  Object.assign({}, buildServerJSOptions, {
    name: 'build-and-check-server-js',
    destination: 'dist/check/app',
    checkTypescript: true,
  }),
);

createRevRenameTask(
  'rev-rename-client',
  'dist/client/{js/{web,vendor}.js,assets/styles.css}',
  'dist/client',
  'dist/client/js',
  production,
);

createBuildViewsTask({
  name: 'build-views',
  glob: 'server/views/*.ejs',
  dest: 'dist/app/server/views',
  revManifestPath: 'dist/client/js/rev-manifest.json',
  production,
});

createCopyGulpTask(
  'copy-client',
  'dist/client/{assets/**/*,docs/*,js/*}',
  'dist/app/server/public',
  serverWatchGlobs,
);

gulp.task('rename-and-copy-client', function(cb) {
  runSequence('rev-rename-client', 'copy-client', 'build-views', cb);
});

// Main server tasks
gulp.task('build-server', ['build-server-js', 'rename-and-copy-client']);

createRunServerTask('run-server', 'dist/app/server/bin/www.js', ['dist/app'], {
  NODE_ENV: production ? 'production' : 'development',
  DATABASE: 'production',
});
createWatchTask('start-watching-server', serverWatchGlobs);

gulp.task('watch-server', cb => {
  runSequence('build-server', 'start-watching-server', 'run-server', cb);
});

// Overall tasks
gulp.task('build-all', cb => {
  runSequence('build-client', 'build-server', cb);
});

gulp.task('watch-all', cb => {
  runSequence('watch-client', 'watch-server', cb);
});

gulp.task('all', ['watch-all']);
