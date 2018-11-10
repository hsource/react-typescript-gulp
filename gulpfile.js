const gulp = require('gulp');
const gulpSequence = require('gulp-sequence');
const {
  createBuildClientJSWebpackTask,
  createBuildServerJSTask,
  createWatchTask,
  createRevRenameTask,
  createBuildViewsTask,
  createCreateDirectoriesGulpTask,
  createCopyGulpTask,
  createRunServerTask,
  createSyncTask,
} = require('./gulpfile.lib');

const serverWatchGlobs = {};
const clientWatchGlobs = {};

const production = process.env.NODE_ENV === 'production';

// Base client tasks
const buildClientJSWebpackArgs = {
  sourceFile: 'client/js/InitWeb.ts',
  destDir: 'dist/client/js',
  destFile: 'main.js',
  cssDestDir: 'dist/client/assets',
  production,
  watch: false,
};

createBuildClientJSWebpackTask('build-client-js', buildClientJSWebpackArgs);

createBuildClientJSWebpackTask(
  'watch-client-js',
  Object.assign({}, buildClientJSWebpackArgs, {
    watch: true,
  }),
);

createCopyGulpTask(
  'copy-assets',
  'client/assets/{**/*,*}',
  'dist/client/assets',
  clientWatchGlobs,
);

// Client tasks
gulp.task('build-client', ['copy-assets', 'build-client-js']);
createWatchTask('start-watching-client', clientWatchGlobs);

gulp.task('watch-client', ['copy-assets', 'watch-client-js'], cb => {
  gulpSequence('start-watching-client', cb);
});

// Base server tasks
createBuildServerJSTask({
  name: 'build-server-js',
  globs:
    '{server/**/*.ts?(x),client/{js,templates}/**/*.ts?(x),common/**/*.ts?(x)}',
  destination: 'dist/app',
  serverWatchGlobs,
});

createRevRenameTask(
  'rev-rename-client',
  'dist/client/{js/main.js,assets/main.css}',
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
  'dist/client/{assets/**/*,assets/*,docs/*,js/*}',
  'dist/app/server/public',
  serverWatchGlobs,
);

createCopyGulpTask(
  'copy-static',
  'server/**/{*.json,.env*}',
  'dist/app/server',
  serverWatchGlobs,
);

gulp.task(
  'rename-and-copy-client',
  gulpSequence('rev-rename-client', 'copy-client', 'build-views'),
);

createCreateDirectoriesGulpTask('create-log-dir', ['dist/app/server/logs']);

// Main server tasks
gulp.task('build-server', [
  'build-server-js',
  'copy-static',
  'rename-and-copy-client',
  'create-log-dir',
]);

const env = {
  NODE_ENV: production ? 'production' : 'development',
  DATABASE: production ? 'production' : 'development',
};

const runWatchGlobs = ['dist/app', '!dist/app/server/public'];

createRunServerTask(
  'run-server',
  'dist/app/server/bin/www-dev.js',
  runWatchGlobs,
  env,
);
createWatchTask('start-watching-server', serverWatchGlobs);

gulp.task(
  'watch-server',
  gulpSequence('build-server', 'start-watching-server', 'run-server'),
);

// Overall tasks
gulp.task('build-all', gulpSequence('build-client', 'build-server'));

gulp.task('watch-all', gulpSequence('watch-client', 'watch-server'));

gulp.task('all', ['watch-all']);

// // Sync tasks
// // Uncomment this section if you want to develop remotely on a server
// const syncGlobs = '{server,client,common,tests}/**/*';
// createSyncTask('sync', syncGlobs, {
//   username: 'root',
//   hostname: 'YOURSERVERHOST',
//   destination: '/home/web/app',
//   archive: true,
//   silent: false,
//   compress: true,
// });
//
// gulp.task('watch-sync', ['sync'], () => {
//   gulp.watch(syncGlobs, ['sync']);
// });
