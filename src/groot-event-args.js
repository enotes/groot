'use strict';
const Emitter = require('eventemitter3');

//
// Vanilla event args
//

const eventArgsPrototype = {
    isAsync: false,
};

/**
 * Creates an instance of EventArgs
 * @param {Object} [properties] - additional properties to append to
 *   the EventArgs object
 * @returns {EventArgs}
 * @constructor
 */
export const EventArgs = function (properties) {
    /**
     * @typedef {Object} EventArgs
     * @augments {eventArgsPrototype}
     * @property {Boolean} isAsync=false
     */
    return Object.assign(
        Object.create(eventArgsPrototype),
        properties
    );
};

eventArgsPrototype.constructor = EventArgs;

//
// "Async" event args
//

const ASYNC_EVENTS = {
    CANCELLED: 'cancelled',
    COMMITTED: 'committed',
};

const asyncEventArgsPrototype = {
    isAsync: true,

    /**
     * Cancel this async event
     */
    cancel: function () {
        if (this.isComitted) {
            return;
        }
        this.isCancelled = true;
        this.emit(ASYNC_EVENTS.CANCELLED);
    },

    /**
     * Commit this async event
     * @param {Object} [result] - result meta-data to be merged into
     *   a leaf's attributes on commit
     */
    commit: function (result = {}) {
        if (this.isCancelled) {
            return;
        }
        this.isComitted = true;
        this.result = result;
        this.emit(ASYNC_EVENTS.COMMITTED);
    }
};

/**
 * Creates an instance of AsyncEventArgs
 * @param {Object} [properties] - additional properties to append to
 *   the AsyncEventArgs object
 * @returns {AsyncEventArgs}
 * @constructor
 */
export const AsyncEventArgs = function (properties) {
    /**
     * @typedef {Object} AsyncEventArgs
     * @augments {EventEmitter3}
     * @augments {asyncEventArgsPrototype}
     * @property {Boolean} isAsync=true
     * @property {Boolean} isCommitted
     * @property {Boolean} isCancelled
     * @property {Object} result - result meta-data to be merged into
     *   a leaf's attributes on commit
     * @method {Function} commit
     * @method {Function} cancel
     * @method {Function} on
     * @method {Function} emit
     */
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

/**
 * Events raised by AsyncEventArgs
 * @type {{CANCELLED: string, COMMITTED: string}}
 */
AsyncEventArgs.EVENTS = ASYNC_EVENTS;
