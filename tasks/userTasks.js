const { User, Role } = require('../models/index');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');

const userTasks = {
    async findUser({ username, id }) {
        const whereClause = username ? { username } : { id };
        return await User.findOne({
            where: whereClause,
            include: [{
                model: Role,
                attributes: ['name']
            }]
        });
    },

    async createUser(userData) {
        try {
            // Hash password before creating user
            if (userData.password) {
                userData.password = await bcrypt.hash(userData.password, 10);
            }

            // Validate roleId exists
            const role = await Role.findByPk(userData.roleId);
            if (!role) {
                throw new Error('Invalid role ID');
            }

            // Create user with all required fields
            const user = await User.create({
                username: userData.username,
                password: userData.password,
                email: userData.email,
                phone: userData.phone,
                company: userData.company,
                project: userData.project,
                supervisor: userData.supervisor,
                roleId: userData.roleId
            });

            // Return user without password
            const { password, ...userWithoutPassword } = user.toJSON();
            return userWithoutPassword;
        } catch (error) {
            console.error('Error creating user:', error);
            if (error.name === 'SequelizeUniqueConstraintError') {
                throw new Error('Username or email already exists');
            }
            throw error;
        }
    },

    async findAllUsers() {
        return await User.findAll({
            include: [{
                model: Role,
                attributes: ['name']
            }]
        });
    },

    async updateUser({ id, data }) {
        const user = await User.findByPk(id);
        if (!user) throw new Error('User not found');
        return await user.update(data);
    },

    async deleteUser({ id }) {
        const user = await User.findByPk(id);
        if (!user) throw new Error('User not found');
        return await user.destroy();
    }
};

module.exports = userTasks;
