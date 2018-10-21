import Sequelize from 'sequelize';
import db from '../db';

const PasswordResetToken = db.define('PasswordResetToken', {
  id: {
    type: Sequelize.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: Sequelize.INTEGER.UNSIGNED,
    allowNull: false,
  },
  token: {
    type: Sequelize.STRING(32),
    allowNull: false,
    unique: true,
  },
});

export default PasswordResetToken;
