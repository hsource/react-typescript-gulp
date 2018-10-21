import Sequelize from 'sequelize';
import db from '../db';

const Session = db.define(
  'Session',
  {
    id: {
      type: Sequelize.STRING(255),
      primaryKey: true,
    },
    expires: {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
    },
    data: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
  },
  {
    charset: 'ascii',
    collate: 'ascii_bin',
    timestamps: false,
  },
);

export default Session;
