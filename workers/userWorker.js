const { parentPort } = require('worker_threads');
const userTasks = require('../tasks/userTasks');

parentPort.on('message', async ({ type, payload }) => {
    try {
        let result;
        switch (type) {
            case 'findUser':
                result = await userTasks.findUser(payload);
                break;

            case 'createUser':
                result = await userTasks.createUser(payload);
                break;

            case 'findAllUsers':
                result = await userTasks.findAllUsers();
                break;

            case 'updateUser':
                result = await userTasks.updateUser(payload);
                break;

            case 'deleteUser':
                result = await userTasks.deleteUser(payload);
                break;
        }

        parentPort.postMessage({ success: true, data: result });
    } catch (error) {
        parentPort.postMessage({ 
            success: false, 
            error: error.message 
        });
    }
});
