const sequelize = require('../config/database');
const User = require('./User');
const Role = require('./Role');

// Define associations
Role.hasMany(User, { foreignKey: 'roleId' });
User.belongsTo(Role, { foreignKey: 'roleId' });

module.exports = {
    sequelize,
    User,
    Role
};
