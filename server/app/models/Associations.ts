// @flow
import Account from './Account';
import PasswordResetToken from './PasswordResetToken';
import User from './User';

Account.hasMany(User, { foreignKey: 'accountId' });
User.belongsTo(Account, { foreignKey: 'accountId', targetKey: 'id' });

User.hasMany(PasswordResetToken, { foreignKey: 'userId' });
PasswordResetToken.belongsTo(User, { foreignKey: 'userId', targetKey: 'id' });
