const EventEmitter = require('events');

class EventBroker extends EventEmitter {
    constructor() {
        super();
        this.setMaxListeners(20);
        this.subscribers = new Map();
    }

    publish(eventType, data) {
        this.emit(eventType, data);
    }

    subscribe(eventType, callback) {
        this.on(eventType, callback);
        this.subscribers.set(callback, eventType);
    }

    unsubscribe(eventType, callback) {
        this.off(eventType, callback);
        this.subscribers.delete(callback);
    }

    listSubscriptions() {
        // Keep this for debugging but without logging
        return Array.from(this.subscribers.entries());
    }
}

module.exports = new EventBroker();
