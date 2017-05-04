'use strict';
const Emitter = require('eventemitter3');

//
// Vanilla event args
//

const eventArgsPrototype = {
    isAsync: false,
};

export const EventArgs = function (properties) {
    return Object.assign(
        Object.create(eventArgsPrototype),
        properties
    );
};

eventArgsPrototype.constructor = EventArgs;

//
// "Async" event args
// Raises events to handle
//

const ASYNC_EVENTS = {
    CANCELLED: 'cancelled',
    COMMITTED: 'committed',
};

const asyncEventArgsPrototype = {
    isAsync: true,

    cancel: function () {
        if (this.isComitted) {
            return;
        }
        this.isCancelled = true;
        this.emit(ASYNC_EVENTS.CANCELLED);
    },

    commit: function (result = {}) {
        if (this.isCancelled) {
            return;
        }
        this.isComitted = true;
        this.result = result;
        this.emit(ASYNC_EVENTS.COMMITTED);
    }
};

export const AsyncEventArgs = function (properties) {
    const instance = Object.assign(
        new Emitter(),
        asyncEventArgsPrototype,
        properties
    );
    instance.isCommitted = false;
    instance.isCancelled = false;
    instance.result = {};
    return instance;
};

asyncEventArgsPrototype.constructor = AsyncEventArgs;

AsyncEventArgs.EVENTS = ASYNC_EVENTS;
