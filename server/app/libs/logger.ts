import winston from 'winston';
import config from '../config';

function createLogger(logPath: string) {
  return winston.createLogger({
    transports: [
      new winston.transports.Console(),
      new winston.transports.File({ filename: logPath }),
    ],
  });
}

function createFileOnlyLogger(logPath: string) {
  // eslint-disable-line no-unused-vars
  return winston.createLogger({
    transports: [new winston.transports.File({ filename: logPath })],
  });
}

const logger = createLogger(config.logPath);

export default logger;
