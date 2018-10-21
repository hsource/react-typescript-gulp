import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import session from 'express-session';
import MySQLSessionStore from 'express-mysql-session';
import routes from './app/main';
import config from './app/config';
import logger from './app/libs/logger';

const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// app.use(favicon(__dirname + '/public/img/favicon.ico'));
if (process.env.NODE_REQUEST_LOG) {
  app.use(
    morgan('dev', {
      stream: {
        write: (str: string) => {
          logger.info(str);
        },
      },
    }),
  );
}

app.use(bodyParser.json({ limit: '16mb' }));
app.use(
  bodyParser.urlencoded({
    extended: true,
    limit: '1mb',
  }),
);
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Authentication
const dbDetails = config.dbDetails;
const sessionStore = new MySQLSessionStore({
  host: dbDetails.host,
  port: dbDetails.port,
  user: dbDetails.user,
  password: dbDetails.password,
  database: dbDetails.database,
  schema: config.sessionsSchema,
});

app.use(
  session({
    secret: 'ThisisAnINterestingsecret',
    saveUninitialized: false,
    resave: false,
    store: sessionStore as any,
  }),
);

routes(app);

// / catch 404 and forward to error handler
app.use((req, res, next) => {
  const err: any = new Error('Not Found');
  err.status = 404;
  next(err);
});

// / error handlers

// development error handler
// will print stacktrace

if (app.get('env') === 'development') {
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    res.status(err.status || 500);
    logger.error('500 error', {
      message: err.message,
      error: err,
      title: 'error',
    });

    res.render('error', {
      message: err.message,
      error: err,
      title: 'error',
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  res.status(err.status || 500);
  logger.error('500 error', {
    message: err.message,
    error: err,
    title: 'error',
  });
});

export default app;
