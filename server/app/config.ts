import * as dotenv from 'dotenv';

let file = '.env.local';
switch (process.env.DATABASE) {
  case 'production':
    file = '.env.prod';
    break;
  case 'test':
    file = '.env.test';
    break;
}

// When webpacking on Windows and using the resulting file on a Mac,
// __dirname with backslashes doesn't play well
const dirname = __dirname.replace(/\\/g, '/');

dotenv.config({ path: `${dirname}/../${file}` });
dotenv.config({ path: `${dirname}/${file}` });

const dbDetails = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
  user: process.env.DB_USER || 'db_username',
  password: process.env.DB_PASS || '',
  database: process.env.DB_DATABASE || 'db_database',
};

const config = {
  siteName: 'YOUR_SITE_NAME',
  host: process.env.WEB_HOST,
  db:
    `mysql://${dbDetails.user}:${dbDetails.password}@${dbDetails.host}` +
    `:${dbDetails.port}/${dbDetails.database}`,
  dbDetails,
  sessionsSchema: {
    tableName: 'Sessions',
    columnNames: {
      session_id: 'id',
      expires: 'expires',
      data: 'data',
    },
  },
  mailFrom: process.env.MAIL_FROM || 'no-reply@example.com',
  smtp: {
    host: process.env.SMTP_SERVER,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  },
  hashSecret: process.env.HASH_SECRET,
  logPath: `${dirname}/../logs/log.txt`,
  requestsLogPath: `${dirname}/../logs/requests.txt`,
  sqlLogPath: `${dirname}/../logs/sql.txt`,
};

export default config;
export { dbDetails };
