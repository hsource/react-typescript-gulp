// @flow
import Sequelize from 'sequelize';
import db from '../db';

/** An account can contain multiple users, who all have access */
const Account = db.define('Account', {
  id: {
    type: Sequelize.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  company: {
    type: Sequelize.STRING(128),
    allowNull: true,
  },
});

export default Account;
