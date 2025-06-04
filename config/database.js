const { Sequelize } = require('sequelize');
const bcryptjs = require('bcryptjs');

const sequelize = new Sequelize('its_db', 'root', '', {
    host: 'localhost',
    dialect: 'mysql',
    logging: false,
    pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});

async function initializeDatabase() {
    try {
        // Test connection first
        await sequelize.authenticate();
        console.log('MySQL connection has been established successfully.');

        // Sync models with alter:true to update existing tables
        await sequelize.sync({ 
            alter: true,  // This will update tables if they exist
            force: false  // This ensures we don't drop tables
        });

        // Check if admin role exists before creating
        const Role = require('../models/Role');
        let adminRole = await Role.findOne({ where: { name: 'admin' }});
        
        if (!adminRole) {
            console.log('Creating admin role...');
            adminRole = await Role.create({
                name: 'admin',
                accessRights: {
                    administration: true,
                    Repports: true,
                    Dashboard: true,
                    Drivers: true,
                    Vehicles: true,
                    Clients: true,
                    Users: true,
                    Settings: true
                }
            });
        }

        // Now that we have adminRole, create admin user if it doesn't exist
        const User = require('../models/User');
        const [adminUser] = await User.findOrCreate({
            where: { username: 'admin' },
            defaults: {
                username: 'admin',
                password: await bcryptjs.hash('admin', 10),
                email: 'admin@its.com',
                phone: '0000000000',
                company: 'ITS',
                project: 'ITS',
                supervisor: 'System',
                roleId: adminRole.id
            }
        });

        console.log('Database initialization completed.');
    } catch (error) {
        console.error('Database initialization error:', error);
        throw error;
    }
}

initializeDatabase();

module.exports = sequelize;
