const { Worker } = require('worker_threads');
const path = require('path');
const userTasks = require('../tasks/userTasks');

class WorkerPool {
    constructor() {
        this.taskHandlers = userTasks;
        this.searchWorker = new Worker(path.join(__dirname, 'searchWorker.js'));
    }

    async runTask(taskName, params) {
        try {
            if (taskName === 'executeQuery') {
                return new Promise((resolve, reject) => {
                    this.searchWorker.postMessage(params);
                    
                    const handler = (message) => {
                        if (message.success) {
                            resolve(message.data);
                        } else {
                            reject(new Error(message.error));
                        }
                        this.searchWorker.removeListener('message', handler);
                    };
                    
                    this.searchWorker.on('message', handler);
                });
            }

            if (!this.taskHandlers[taskName]) {
                throw new Error(`Unknown task: ${taskName}`);
            }
            return await this.taskHandlers[taskName](params);
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new WorkerPool();
