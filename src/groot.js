'use strict';
const Emitter = require('eventemitter3');
require('./element.matches.polyfill');
import KeyCode from 'keycode-js';
import { Leaf } from './groot-leaf';
import { GrootMenu } from './groot-menu';
import { leafTemplate, treeTemplate } from './groot-templates';
import { EventArgs, AsyncEventArgs } from './groot-event-args';

const ENTER_KEYS = [
    KeyCode.KEY_ENTER,
    KeyCode.KEY_RETURN,
];

const CAPTURE_KEYS = ENTER_KEYS.concat([
    KeyCode.KEY_ESCAPE
]);

//
// Groot
//

/**
 * Groot events
 * @type {{RENDERING: string, RENDERED: string, LEAF: {MOVING: string, MOVED: string, CLICKING: string, CLICKED: string, DRAGGING: string, DRAGGED: string, DROPPING: string, DROPPED: string, RENAMING: string, RENAMED: string, UNNAMED: string, EXPANDING: string, EXPANDED: string, COLLAPSING: string, COLLAPSED: string, DELETING: string, DELETED: string, CREATING: string, CREATED: string, PRUNING: string, PRUNED: string, ACTIVATING: string, ACTIVATED: string, DISABLING: string, DISABLED: string}, MENU: {CLICKING: string, CLICKED: string, SHOWING: string, SHOWN: string, HIDING: string, HIDDEN: string}}}
 */
const EVENTS = {
    /**
     * rendering
     * - async:no
     * - multisource:no
     */
    RENDERING: 'rendering',
    /**
     * rendered
     * - async:no
     * - multisource:no
     */
    RENDERED: 'rendered',
    /**
     * leaf-specific events
     */
    LEAF: {
        /**
         * leaf.moving
         * - async:yes
         * - multisource:yes
         */
        MOVING: 'leaf.moving',
        /**
         * leaf.moved
         * - async:no
         * - multisource:yes
         */
        MOVED: 'leaf.moved',
        /**
         * leaf.clicking
         * - async:no
         * - multisource:no
         */
        CLICKING: 'leaf.clicking',
        /**
         * leaf.clicked
         * - async:no
         * - multisource:no
         */
        CLICKED: 'leaf.clicked',
        /**
         * leaf.dragging
         * - async:no
         * - multisource:no
         */
        DRAGGING: 'leaf.dragging',
        /**
         * leaf.dragged
         * - async:no
         * - multisource:no
         */
        DRAGGED: 'leaf.dragged',
        /**
         * leaf.dropping
         * - async:yes
         * - multisource:yes
         */
        DROPPING: 'leaf.dropping',
        /**
         * leaf.dropped
         * - async:no
         * - multisource:yes
         */
        DROPPED: 'leaf.dropped',
        /**
         * leaf.renaming
         * - async:yes
         * - multisource:no
         */
        RENAMING: 'leaf.renaming',
        /**
         * leaf.renamed
         * - async:no
         * - multisource:no
         */
        RENAMED: 'leaf.renamed',
        /**
         * leaf.unnamed
         * - async:no
         * - multisource:no
         */
        UNNAMED: 'leaf.unnamed',
        /**
         * leaf.expanding
         * - async:no
         * - multisource:no
         */
        EXPANDING: 'leaf.expanding',
        /**
         * leaf.expanded
         * - async:no
         * - multisource:no
         */
        EXPANDED: 'leaf.expanded',
        /**
         * leaf.collapsing
         * - async:no
         * - multisource:no
         */
        COLLAPSING: 'leaf.collapsing',
        /**
         * leaf.collapsed
         * - async:no
         * - multisource:no
         */
        COLLAPSED: 'leaf.collapsed',
        /**
         * leaf.deleting
         * - async:yes
         * - multisource:no
         */
        DELETING: 'leaf.deleting',
        /**
         * leaf.deleted
         * - async:no
         * - multisource:no
         */
        DELETED: 'leaf.deleted',
        /**
         * leaf.creating
         * - async:no
         * - multisource:no
         */
        CREATING: 'leaf.creating',
        /**
         * leaf.created
         * - async:no
         * - multisource:no
         */
        CREATED: 'leaf.created',
        /**
         * leaf.pruning
         * - async:no
         * - multisource:no
         */
        PRUNING: 'leaf.pruning',
        /**
         * leaf.pruned
         * - async:no
         * - multisource:no
         */
        PRUNED: 'leaf.pruned',
        /**
         * leaf.activating
         * - async:no
         * - multisource:no
         */
        ACTIVATING: 'leaf.activating',
        /**
         * leaf.activated
         * - async:no
         * - multisource:no
         */
        ACTIVATED: 'leaf.activated',
        /**
         * leaf.disabling
         * - async:no
         * - multisource:no
         */
        DISABLING: 'leaf.disabling',
        /**
         * leaf.disabled
         * - async:no
         * - multisource:no
         */
        DISABLED: 'leaf.disabled',
    },
    /**
     * menu-specific events
     */
    MENU: {
        /**
         * menu.clicking
         * - async:no
         * - multisource:no
         */
        CLICKING: 'menu.clicking',
        /**
         * menu.clicked
         * - async:no
         * - multisource:no
         */
        CLICKED: 'menu.clicked',
        /**
         * menu.showing
         * - async:no
         * - multisource:no
         */
        SHOWING: 'menu.showing',
        /**
         * menu.shown
         * - async:no
         * - multisource:no
         */
        SHOWN: 'menu.shown',
        /**
         * menu.hiding
         * - async:no
         * - multisource:no
         */
        HIDING: 'menu.hiding',
        /**
         * menu.hidden
         * - async:no
         * - multisource:no
         */
        HIDDEN: 'menu.hidden',
    },
};

const closestGrootListItem = function (htmlElement) {
    if (!htmlElement) {
        return null;
    }
    const isListItem = (htmlElement.tagName.toLowerCase() === 'li');
    const isGrootLeaf = (htmlElement.classList.contains('groot-leaf'));
    if (isListItem && isGrootLeaf) {
        return htmlElement;
    }
    return closestGrootListItem(htmlElement.parentElement);
};

const CLICKABLE_CONTROLS = [
    '.groot-icon',
    '.groot-leaf',
    '.groot-leaf__label',
    '.groot-leaf__label-field'
];

const grootPrototype = {

    //
    // public methods
    //

    /**
     * Prune a node from the tree.
     *   - Will raise synchronous event.
     *   - Is not cancellable.
     * @param {Object} attributes - custom attributes used to find
     *   the leaf to be pruned
     */
    prune: function (attributes = {}) {
        const sourceLeaf = this._tree.findByAttributes(attributes);
        const parentLeaf = sourceLeaf.getParent();

        if (!parentLeaf) {
            throw new Error('cannot prune parentless node');
        }

        const PRUNE_ARGS = {
            source: Object.assign({
                grootID: sourceLeaf.id,
            }, sourceLeaf.attributes)
        };

        this._raise(EVENTS.LEAF.PRUNING, PRUNE_ARGS);
        const listItem = this._findListItem(parentLeaf);
        parentLeaf.remove(sourceLeaf);
        this._raise(EVENTS.LEAF.PRUNED, PRUNE_ARGS);
        const parentListItem = closestGrootListItem(listItem.parentElement);
        this._renderLeaf(parentListItem, parentLeaf);
    },

    /**
     * Remove a node from the tree.
     *   - Will raise async event.
     *   - Is cancellable.
     * @param {Object} attributes - custom attributes used to find
     *   the leaf to be removed
     */
    remove: function (attributes = {}) {
        const sourceLeaf = this._tree.findByAttributes(attributes);
        const parentLeaf = sourceLeaf.getParent();

        if (!parentLeaf) {
            throw new Error('cannot remove parentless node');
        }

        const DELETE_ARGS = {
            source: Object.assign({
                grootID: sourceLeaf.id,
            }, sourceLeaf.attributes)
        };

        this._raiseAsync(EVENTS.LEAF.DELETING, DELETE_ARGS).then(() => {
            const listItem = this._findListItem(parentLeaf);
            parentLeaf.remove(sourceLeaf);
            this._raise(EVENTS.LEAF.DELETED, DELETE_ARGS);
            const parentListItem = closestGrootListItem(listItem.parentElement);
            this._renderLeaf(parentListItem, parentLeaf);
        });
    },

    /**
     * Rename a node.
     *   - Will raise asynchronous event.
     *   - Is cancellable.
     * @param {Object} attributes - custom attributes used to find
     *   the leaf to be renamed
     * @param {String} label
     * @returns {Promise.<AsyncEventArgs>}
     */
    rename: function (attributes, label) {
        const sourceLeaf = this._tree.findByAttributes(attributes);

        if (sourceLeaf.label === label) {
            return;
        }

        const RENAME_ARGS = {
            isNew: false,
            label,
            source: Object.assign({
                grootID: sourceLeaf.id,
            }, sourceLeaf.attributes)
        };

        return this._raiseAsync(EVENTS.LEAF.RENAMING, RENAME_ARGS).then(() => {
            sourceLeaf.commitLabelChange(label);
            const listItem = this._findListItem(sourceLeaf);
            this._renderLeaf(listItem, sourceLeaf);
            this._raise(EVENTS.LEAF.RENAMED, RENAME_ARGS);
        });
    },

    /**
     * Expand a node.
     *   - Will raise synchronous event.
     *   - Is not cancellable.
     * @param {Object} attributes - custom attributes used to find
     *   the leaf to be expanded
     */
    expand: function (attributes) {
        const sourceLeaf = this._tree.findByAttributes(attributes);

        if (sourceLeaf.isExpanded) {
            return;
        }

        const listItem = this._findListItem(sourceLeaf);

        const EXPAND_ARGS = {
            source: Object.assign({
                grootID: sourceLeaf.id,
                deep: false,
            }, sourceLeaf.attributes)
        };

        this._raise(EVENTS.LEAF.EXPANDING, EXPAND_ARGS);
        sourceLeaf.toggle();
        this._raise(EVENTS.LEAF.EXPANDED, EXPAND_ARGS);

        this._renderLeaf(listItem, sourceLeaf);
    },

    /**
     * Disable this instance. No events will be fired while
     *   the instance is disabled.
     */
    disable: function () {
        CLICKABLE_CONTROLS.forEach((controlClass) => {
            this._containerElement.querySelectorAll(controlClass)
                .forEach((element) => {
                    element.style.cursor = 'wait';
                    element.setAttribute('disabled', 'disabled');
                });
        });
        this.isEnabled = false;
    },

    /**
     * Enable this instance. Events will be fired while the
     *   instance is enabled.
     */
    enable: function () {
        CLICKABLE_CONTROLS.forEach((controlClass) => {
            this._containerElement.querySelectorAll(controlClass)
                .forEach((element) => {
                    element.style.cursor = 'default';
                    element.removeAttribute('disabled');
                });
        });
        this.isEnabled = true;
    },

    /**
     * Render this instance in the DOM.
     */
    render: function () {
        this._raise(EVENTS.RENDERING, {});
        this._containerElement.innerHTML = treeTemplate(this._tree);
        const inputElement = this._containerElement
            .querySelector('.groot-leaf__label-field');
        if (inputElement) {
            inputElement.focus();
        }
        this._raise(EVENTS.RENDERED, {});
    },

    /**
     * Close this instance's menu, if it is open.
     */
    closeMenu: function () {
        this._hideMenu();
    },

    //
    // private methods
    //

    _findListItem: function (leaf) {
        return this._containerElement
            .querySelector(`[data-groot-id="${leaf.id}"]`);
    },

    /**
     * Raises a synchronous event
     * @param {String} event
     * @param {Object} properties
     * @private
     */
    _raise: function (event, properties = {}) {
        this.emit(event, new EventArgs(properties));
    },

    /**
     * Raises an asynchronous event
     * @param {String} event
     * @param {Object} properties
     * @return {Promise}
     * @private
     */
    _raiseAsync: function (event, properties = {}) {
        return new Promise((resolve, reject) => {
            const eventArgs = new AsyncEventArgs(properties);
            eventArgs.on(
                AsyncEventArgs.EVENTS.CANCELLED,
                () => {
                    eventArgs.off(AsyncEventArgs.EVENTS.CANCELLED);
                    reject(eventArgs);
                }
            );
            eventArgs.on(
                AsyncEventArgs.EVENTS.COMMITTED,
                () => {
                    eventArgs.off(AsyncEventArgs.EVENTS.COMMITTED);
                    resolve(eventArgs);
                }
            );
            setTimeout(() => {
                this.emit(event, eventArgs);
                // if there are no listeners for the event, assume
                // that it is ok to commit automatically
                if (!this.listeners(event, true)) {
                    eventArgs.commit();
                }
            }, 0);
        });
    },

    _renderLeaf: function (oldListItemElement, leaf) {
        const RENDER_ARGS = {
            source: Object.assign({
                grootID: leaf.id
            }, leaf.attributes)
        };

        this._raise(EVENTS.RENDERING, RENDER_ARGS);
        const tempElement = document.createElement('div');
        tempElement.innerHTML = leafTemplate(leaf);
        const newListItemElement = tempElement.firstElementChild;
        oldListItemElement.parentElement.replaceChild(newListItemElement, oldListItemElement);
        const inputElement = newListItemElement.parentElement
            .querySelector('.groot-leaf__label-field');
        if (inputElement) {
            inputElement.focus();
        }
        this._raise(EVENTS.RENDERED, RENDER_ARGS);
    },

    _renderParentLeaf: function (oldListItemElement, leaf) {
        const parentLeaf = leaf.getParent();
        let parentListItem = closestGrootListItem(oldListItemElement.parentElement);
        return this._renderLeaf(parentListItem, parentLeaf);
    },

    _hideMenu: function () {
        if (!this._menu.isShowing) {
            return;
        }
        this._raise(EVENTS.MENU.HIDING);
        this._menu.hide();
        this._raise(EVENTS.MENU.HIDDEN, this._menu.options);
    },

    _showMenu: function (listItem, optionOverrides = {}) {
        if (this._menu.isShowing) {
            this._hideMenu();
        }
        const options = GrootMenu.createOptions(optionOverrides);
        if (!GrootMenu.willShow(options)) {
            return;
        }
        this._raise(EVENTS.MENU.SHOWING);
        this._menu.show(listItem, options);
        this._raise(EVENTS.MENU.SHOWN, this._menu.options);
    },

    _moveLeafUp: function (listItem) {
        const sourceID = Number(listItem.getAttribute('data-groot-id'));
        const sourceLeaf = this._tree.find(sourceID);
        const siblingLeaf = sourceLeaf.getSiblingBefore();

        if (!siblingLeaf) {
            return;
        }

        const MOVE_ARGS = {
            direction: 'up',
            projectedPosition: siblingLeaf.position,
            commonParent: true,
            source: Object.assign({
                grootID: sourceID,
                position: sourceLeaf.position,
            }, sourceLeaf.attributes),
            target: Object.assign({
                grootID: siblingLeaf.id,
                position: siblingLeaf.position,
            }, siblingLeaf.attributes)
        };

        this._raiseAsync(EVENTS.LEAF.MOVING, MOVE_ARGS).then(() => {
            sourceLeaf.moveBefore(siblingLeaf);
            MOVE_ARGS.source.position = sourceLeaf.position;
            MOVE_ARGS.target.position = siblingLeaf.position;
            this._raise(EVENTS.LEAF.MOVED, MOVE_ARGS);
            this._renderParentLeaf(listItem, sourceLeaf);
        });
    },

    /**
     * @param listItem
     * @private
     */
    _moveLeafDown: function (listItem) {
        const sourceID = Number(listItem.getAttribute('data-groot-id'));
        const sourceLeaf = this._tree.find(sourceID);
        const siblingLeaf = sourceLeaf.getSiblingAfter();

        if (!siblingLeaf) {
            return;
        }

        const MOVE_ARGS = {
            direction: 'down',
            projectedPosition: siblingLeaf.position,
            commonParent: true,
            source: Object.assign({
                grootID: sourceID,
                position: sourceLeaf.position,
            }, sourceLeaf.attributes),
            target: Object.assign({
                grootID: siblingLeaf.id,
                position: siblingLeaf.position,
            }, siblingLeaf.attributes)
        };

        this._raiseAsync(EVENTS.LEAF.MOVING, MOVE_ARGS).then(() => {
            sourceLeaf.moveAfter(siblingLeaf);
            MOVE_ARGS.source.position = sourceLeaf.position;
            MOVE_ARGS.target.position = siblingLeaf.position;
            this._raise(EVENTS.LEAF.MOVED, MOVE_ARGS);
            this._renderParentLeaf(listItem, sourceLeaf);
        });
    },

    //
    // leaf events
    //

    _captureDOMEvent: function (e) {
        if (!this.isEnabled) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
        // can we handle this event type?
        const handlers = this._handlers[e.type];
        if (!handlers) {
            return true;
        }
        // is there a selector that matches the element?
        const handlerSelectors = Object.keys(handlers);
        while (handlerSelectors.length) {
            const selector = handlerSelectors.shift();
            if (!e.target.matches(selector)) {
                continue;
            }
            handlers[selector].call(this, e);
            e.stopPropagation();
            return false;
        }
        return true;
    },

    _onLeafLabelClicked: function (e) {
        e.preventDefault();

        const trigger = e.target,
            listItem = closestGrootListItem(trigger),
            sourceID = Number(listItem.getAttribute('data-groot-id')),
            isRightClick = (e.button === 2),
            sourceLeaf = this._tree.find(sourceID);

        const CLICK_ARGS = {
            source: Object.assign({
                grootID: sourceID,
                isRightClick
            }, sourceLeaf.attributes)
        };

        this._raise(EVENTS.LEAF.CLICKING, CLICK_ARGS);

        if (isRightClick) {
            this._showMenu(listItem, {
                sourceID,
                'delete': !sourceLeaf.isRoot,
                moveUp: !sourceLeaf.isFirstSibling,
                moveDown: !sourceLeaf.isLastSibling,
                moveFirst: !sourceLeaf.isFirstSibling,
                moveLast: !sourceLeaf.isLastSibling,
                moveTo: !sourceLeaf.isRoot,
                activateChildren: sourceLeaf.hasAnyInactiveChildren(true),
                disableChildren: sourceLeaf.hasAnyActiveChildren(true),
            });
            this._raise(EVENTS.LEAF.CLICKED, CLICK_ARGS);
            return false;
        }

        this._hideMenu();

        const TOGGLE_ARGS = {
            source: Object.assign({
                grootID: sourceID,
                deep: false,
            }, sourceLeaf.attributes)
        };

        const PRE_EVENT = sourceLeaf.isExpanded ?
            EVENTS.LEAF.COLLAPSING :
            EVENTS.LEAF.EXPANDING;

        const POST_EVENT = sourceLeaf.isExpanded ?
            EVENTS.LEAF.COLLAPSED :
            EVENTS.LEAF.EXPANDED;

        this._raise(PRE_EVENT, TOGGLE_ARGS);
        sourceLeaf.toggle();
        this._raise(POST_EVENT, TOGGLE_ARGS);

        this._renderLeaf(listItem, sourceLeaf);

        this._raise(EVENTS.LEAF.CLICKED, CLICK_ARGS);
        return false;
    },

    _onLeafContextMenu: function (e) {
        e.preventDefault();

        const trigger = e.target,
            listItem = closestGrootListItem(trigger),
            sourceID = Number(listItem.getAttribute('data-groot-id')),
            isRightClick = (e.button === 2),
            sourceLeaf = this._tree.find(sourceID);

        const CLICK_ARGS = {
            source: Object.assign({
                grootID: sourceID,
                isRightClick
            }, sourceLeaf.attributes)
        };

        this._raise(EVENTS.LEAF.CLICKING, CLICK_ARGS);

        this._showMenu(listItem, {
            sourceID,
            'delete': !sourceLeaf.isRoot,
            moveUp: !sourceLeaf.isFirstSibling,
            moveDown: !sourceLeaf.isLastSibling,
            moveFirst: !sourceLeaf.isFirstSibling,
            moveLast: !sourceLeaf.isLastSibling,
            moveTo: !sourceLeaf.isRoot,
            activateChildren: sourceLeaf.hasAnyInactiveChildren(true),
            disableChildren: sourceLeaf.hasAnyActiveChildren(true),
        });

        this._raise(EVENTS.LEAF.CLICKED, CLICK_ARGS);
        return false;
    },

    _onLeafMenuClicked: function (e) {
        e.preventDefault();

        const trigger = e.target,
            listItem = closestGrootListItem(trigger),
            sourceID = Number(listItem.getAttribute('data-groot-id')),
            sourceLeaf = this._tree.find(sourceID);

        this._showMenu(listItem, {
            sourceID,
            'delete': !sourceLeaf.isRoot,
            moveUp: !sourceLeaf.isFirstSibling,
            moveDown: !sourceLeaf.isLastSibling,
            moveFirst: !sourceLeaf.isFirstSibling,
            moveLast: !sourceLeaf.isLastSibling,
            moveTo: !sourceLeaf.isRoot,
            activateChildren: sourceLeaf.hasAnyInactiveChildren(true),
            disableChildren: sourceLeaf.hasAnyActiveChildren(true),
        });

        return false;
    },

    _onLeafLabelDragEnter: function (e) {
        e.target.classList.add('drag-target');
    },

    _onLeafLabelDragOver: function (e) {
        // signals the drag-n-drop event that this element
        // is a valid target for dropping
        // @see: https://developer.mozilla.org/en-US/docs/Web/Events/dragover
        e.preventDefault();
        return false;
    },

    _onLeafLabelDragLeave: function (e) {
        e.target.classList.remove('drag-target');
    },

    _onLeafLabelDragStart: function (e) {
        const trigger = e.target,
            listItem = closestGrootListItem(trigger),
            sourceID = Number(listItem.getAttribute('data-groot-id')),
            leaf = this._tree.find(sourceID);

        if (leaf.isBeingRenamed) {
            e.preventDefault();
            return false;
        }

        const DRAG_ARGS = {
            source: Object.assign({
                grootID: sourceID,
            }, leaf.attributes)
        };

        this._raise(EVENTS.LEAF.DRAGGING, DRAG_ARGS);

        e.dataTransfer.setData('text/plain', sourceID);
    },

    _onLeafLabelDragEnd: function (e) {

        const trigger = e.target,
            listItem = closestGrootListItem(trigger),
            targetID = Number(listItem.getAttribute('data-groot-id')),
            sourceID = Number(e.dataTransfer.getData('text')),
            sourceLeaf = this._tree.find(sourceID),
            targetLeaf = this._tree.find(targetID);

        const DRAG_ARGS = {
            source: Object.assign({
                grootID: sourceID,
            }, sourceLeaf.attributes)
        };

        const DROP_ARGS = Object.assign({
            target: Object.assign({
                grootID: targetID,
            }, targetLeaf.attributes)
        }, DRAG_ARGS);

        this._raise(EVENTS.LEAF.DRAGGED, DRAG_ARGS);
        this._raise(EVENTS.LEAF.DROPPING, DROP_ARGS);

        trigger.classList.remove('drag-target');

        const options = {
            sourceID,
            targetID,
            create: false,
            rename: false,
            'delete': false,
            moveTo: false,
            moveUp: false,
            moveDown: false,
            moveFirst: false,
            moveLast: false,
            moveBefore: !sourceLeaf.isRoot,
            moveAfter: !sourceLeaf.isRoot,
            makeParent: !(sourceLeaf.isRoot || targetLeaf.isParentOf(sourceLeaf)),
            activateChildren: false,
            disableChildren: false,
        };

        this._showMenu(listItem, options);

        this._raise(EVENTS.LEAF.DROPPED, DROP_ARGS);

        return false;
    },

    _onLeafUpClicked: function (e) {
        e.preventDefault();

        const trigger = e.target,
            listItem = closestGrootListItem(trigger);

        this._moveLeafUp(listItem);
        return false;
    },

    _onLeafDownClicked: function (e) {
        e.preventDefault();

        const trigger = e.target,
            listItem = closestGrootListItem(trigger);

        this._moveLeafDown(listItem);
        return false;
    },

    _onLeafLabelFieldClicked: function (e) {
        // prevent the page from jumping
        e.preventDefault();
    },

    _onLeafLabelFieldKeyDown: function (e) {
        if (CAPTURE_KEYS.indexOf(e.keyCode) < 0) {
            return true;
        }

        e.preventDefault();

        const trigger = e.target,
            label = trigger.value.trim();

        if (!label) {
            return;
        }

        const listItem = closestGrootListItem(trigger),
            sourceID = Number(listItem.getAttribute('data-groot-id')),
            sourceLeaf = this._tree.find(sourceID);

        const isCommitting = (ENTER_KEYS.indexOf(e.keyCode) >= 0);
        const isCancelling = (KeyCode.KEY_ESCAPE === e.keyCode);

        const RENAME_ARGS = {
            isNew: sourceLeaf.isBeingGrafted,
            label,
            source: Object.assign({
                grootID: sourceID,
            }, sourceLeaf.attributes)
        };

        //
        // commit changes
        //
        if (isCommitting) {
            if (sourceLeaf.isBeingGrafted) {
                const parentLeaf = sourceLeaf.getParent();
                const CREATE_ARGS = Object.assign({
                    projectedPosition: parentLeaf.length(),
                }, RENAME_ARGS);
                CREATE_ARGS.target = Object.assign({
                    grootID: parentLeaf.id,
                }, parentLeaf.attributes);

                return this._raiseAsync(EVENTS.LEAF.CREATING, CREATE_ARGS).then((eventArgs) => {
                    sourceLeaf.mergeAttributes(eventArgs.result);
                    sourceLeaf.commitLabelChange(label);
                    sourceLeaf.inosculate();
                    this._renderParentLeaf(listItem, sourceLeaf);
                    this._raise(EVENTS.LEAF.CREATED, CREATE_ARGS);
                });
            }

            return this._raiseAsync(EVENTS.LEAF.RENAMING, RENAME_ARGS).then(() => {
                sourceLeaf.commitLabelChange(label);
                this._renderParentLeaf(listItem, sourceLeaf);
                this._raise(EVENTS.LEAF.RENAMED, RENAME_ARGS);
            });
        }

        //
        // cancel changes
        //
        if (isCancelling) {
            sourceLeaf.cancelLabelChange();
            // a new leaf that is being cancelled
            if (sourceLeaf.isBeingGrafted) {
                sourceLeaf.ungraft();
            }
            this._raise(EVENTS.LEAF.UNNAMED, RENAME_ARGS);
        }

        this._renderParentLeaf(listItem, sourceLeaf);

        return false;
    },

    //
    // menu events
    //

    _onMenuCloseClicked: function (e) {
        e.preventDefault();
        this._raise(EVENTS.MENU.CLICKING, {
            action: 'close'
        });

        this._hideMenu();

        this._raise(EVENTS.MENU.CLICKED, {
            action: 'close'
        });
    },

    _onMenuCreateClicked: function (e) {
        e.preventDefault();
        this._raise(EVENTS.MENU.CLICKING, {
            action: 'create'
        });

        const { sourceID } = this._menu.options,
            sourceLeaf = this._tree.find(sourceID),
            graftedLeaf = sourceLeaf.graft();

        graftedLeaf.requestLabelChange();

        const EXPAND_ARGS = {
            source: Object.assign({
                grootID: sourceID,
                deep: false,
            }, sourceLeaf.attributes)
        };

        this._raise(EVENTS.LEAF.EXPANDING, EXPAND_ARGS);
        sourceLeaf.expand();
        this._raise(EVENTS.LEAF.EXPANDED, EXPAND_ARGS);

        this._renderLeaf(this._menu.listItemElement, sourceLeaf);

        this._raise(EVENTS.MENU.CLICKED, {
            action: 'create'
        });
        return false;
    },

    _onMenuRenameClicked: function (e) {
        e.preventDefault();
        this._raise(EVENTS.MENU.CLICKING, {
            action: 'rename'
        });

        const { sourceID } = this._menu.options,
            sourceLeaf = this._tree.find(sourceID);

        sourceLeaf.requestLabelChange();

        this._renderLeaf(this._menu.listItemElement, sourceLeaf);

        this._raise(EVENTS.MENU.CLICKED, {
            action: 'rename'
        });
        return false;
    },

    _onMenuDeleteClicked: function (e) {
        e.preventDefault();
        this._raise(EVENTS.MENU.CLICKING, {
            action: 'delete'
        });

        const { sourceID } = this._menu.options,
            sourceLeaf = this._tree.find(sourceID),
            parentLeaf = sourceLeaf.getParent();

        if (!parentLeaf) {
            this._raise(EVENTS.MENU.CLICKED, {
                action: 'delete'
            });
            return false;
        }

        const DELETE_ARGS = {
            source: Object.assign({
                grootID: sourceID,
            }, sourceLeaf.attributes)
        };

        const listItem = this._menu.listItemElement;

        this._raiseAsync(EVENTS.LEAF.DELETING, DELETE_ARGS).then(() => {
            parentLeaf.remove(sourceLeaf);
            this._raise(EVENTS.LEAF.DELETED, DELETE_ARGS);

            const parentListItem = closestGrootListItem(listItem.parentElement);
            this._renderLeaf(parentListItem, parentLeaf);
        });

        this._raise(EVENTS.MENU.CLICKED, {
            action: 'delete'
        });
        return false;
    },

    _onMenuMoveToClicked: function (e) {
        e.preventDefault();
        this._raise(EVENTS.MENU.CLICKING, {
            action: 'move-to'
        });

        const { sourceID } = this._menu.options,
            sourceLeaf = this._tree.find(sourceID);

        const MOVE_ARGS = {
            direction: 'to',
            source: Object.assign({
                grootID: sourceID,
                position: sourceLeaf.position,
            }, sourceLeaf.attributes)
        };

        this._raiseAsync(EVENTS.LEAF.MOVING, MOVE_ARGS).then(() => {
            this._hideMenu();
        });

        this._raise(EVENTS.MENU.CLICKED, {
            action: 'move-to'
        });
    },

    _onMenuMoveUpClicked: function (e) {
        e.preventDefault();
        this._raise(EVENTS.MENU.CLICKING, {
            action: 'move-up'
        });

        this._moveLeafUp(this._menu.listItemElement);

        this._hideMenu();

        this._raise(EVENTS.MENU.CLICKED, {
            action: 'move-up'
        });
        return false;
    },

    _onMenuMoveDownClicked: function (e) {
        e.preventDefault();
        this._raise(EVENTS.MENU.CLICKING, {
            action: 'move-down'
        });

        this._moveLeafDown(this._menu.listItemElement);

        this._hideMenu();

        this._raise(EVENTS.MENU.CLICKED, {
            action: 'move-down'
        });
        return false;
    },

    _onMenuMoveFirstClicked: function (e) {
        e.preventDefault();
        this._raise(EVENTS.MENU.CLICKING, {
            action: 'move-first'
        });

        const { sourceID } = this._menu.options;
        const sourceLeaf = this._tree.find(sourceID);
        const parentLeaf = sourceLeaf.getParent();
        if (!parentLeaf) {
            return false;
        }
        const firstLeaf = parentLeaf.getFirstChild();
        if (sourceLeaf.equals(firstLeaf)) {
            return false;
        }

        const MOVE_ARGS = {
            direction: 'first',
            projectedPosition: 0,
            commonParent: true,
            source: Object.assign({
                grootID: sourceID,
                position: sourceLeaf.position,
            }, sourceLeaf.attributes),
            target: Object.assign({
                grootID: firstLeaf.id,
                position: firstLeaf.position,
            }, firstLeaf.attributes)
        };

        this._raiseAsync(EVENTS.LEAF.MOVING, MOVE_ARGS).then(() => {
            sourceLeaf.moveBefore(firstLeaf);
            MOVE_ARGS.source.position = sourceLeaf.position;
            MOVE_ARGS.target.position = firstLeaf.position;
            this._raise(EVENTS.LEAF.MOVED, MOVE_ARGS);
            this._renderParentLeaf(this._menu.listItemElement, sourceLeaf);
        });

        this._raise(EVENTS.MENU.CLICKED, {
            action: 'move-first'
        });
        return false;
    },

    _onMenuMoveLastClicked: function (e) {
        e.preventDefault();
        this._raise(EVENTS.MENU.CLICKING, {
            action: 'move-last'
        });

        const { sourceID } = this._menu.options;
        const sourceLeaf = this._tree.find(sourceID);
        const parentLeaf = sourceLeaf.getParent();
        if (!parentLeaf) {
            return false;
        }
        const lastLeaf = parentLeaf.getLastChild();
        if (sourceLeaf.equals(lastLeaf)) {
            return false;
        }

        const MOVE_ARGS = {
            direction: 'last',
            projectedPosition: lastLeaf.position,
            commonParent: true,
            source: Object.assign({
                grootID: sourceID,
                position: sourceLeaf.position,
            }, sourceLeaf.attributes),
            target: Object.assign({
                grootID: lastLeaf.id,
                position: lastLeaf.position,
            }, lastLeaf.attributes)
        };

        this._raiseAsync(EVENTS.LEAF.MOVING, MOVE_ARGS).then(() => {
            sourceLeaf.moveAfter(lastLeaf);
            MOVE_ARGS.source.position = sourceLeaf.position;
            MOVE_ARGS.target.position = lastLeaf.position;
            this._raise(EVENTS.LEAF.MOVED, MOVE_ARGS);
            this._renderParentLeaf(this._menu.listItemElement, sourceLeaf);
        });

        this._raise(EVENTS.MENU.CLICKED, {
            action: 'move-last'
        });
        return false;
    },

    _onMenuMoveBeforeClicked: function (e) {
        e.preventDefault();
        this._raise(EVENTS.MENU.CLICKING, {
            action: 'move-before'
        });

        const { sourceID, targetID } = this._menu.options,
            sourceLeaf = this._tree.find(sourceID),
            targetLeaf = this._tree.find(targetID),
            sourceParent = sourceLeaf.getParent(),
            targetParent = targetLeaf.getParent();

        const MOVE_ARGS = {
            direction: 'before',
            projectedPosition: targetLeaf.position,
            commonParent: sourceParent === targetParent,
            source: Object.assign({
                grootID: sourceID,
                position: sourceLeaf.position,
            }, sourceLeaf.attributes),
            target: Object.assign({
                grootID: targetParent.id,
                position: targetParent.position,
            }, targetParent.attributes)
        };

        this._raiseAsync(EVENTS.LEAF.MOVING, MOVE_ARGS).then(() => {
            sourceLeaf.moveBefore(targetLeaf);
            MOVE_ARGS.source.position = sourceLeaf.position;
            MOVE_ARGS.target.position = targetLeaf.position;
            this._raise(EVENTS.LEAF.MOVED, MOVE_ARGS);
            this.render();
        });

        this._raise(EVENTS.MENU.CLICKED, {
            action: 'move-before'
        });
        return false;
    },

    _onMenuMoveAfterClicked: function (e) {
        e.preventDefault();
        this._raise(EVENTS.MENU.CLICKING, {
            action: 'move-after'
        });

        const { sourceID, targetID } = this._menu.options,
            sourceLeaf = this._tree.find(sourceID),
            targetLeaf = this._tree.find(targetID),
            sourceParent = sourceLeaf.getParent(),
            targetParent = targetLeaf.getParent();

        const MOVE_ARGS = {
            direction: 'after',
            projectedPosition: targetLeaf.position + 1,
            commonParent: sourceParent === targetParent,
            source: Object.assign({
                grootID: sourceID,
                position: sourceLeaf.position,
            }, sourceLeaf.attributes),
            target: Object.assign({
                grootID: targetLeaf.id,
                position: targetParent.position,
            }, targetParent.attributes)
        };

        this._raiseAsync(EVENTS.LEAF.MOVING, MOVE_ARGS).then(() => {
            sourceLeaf.moveAfter(targetLeaf);
            MOVE_ARGS.source.position = sourceLeaf.position;
            MOVE_ARGS.target.position = targetLeaf.position;
            this._raise(EVENTS.LEAF.MOVED, MOVE_ARGS);
            this.render();
        });

        this._raise(EVENTS.MENU.CLICKED, {
            action: 'move-after'
        });
        return false;
    },

    _onMenuMakeParentClicked: function (e) {
        e.preventDefault();
        this._raise(EVENTS.MENU.CLICKING, {
            action: 'make-parent'
        });

        const { sourceID, targetID } = this._menu.options,
            sourceLeaf = this._tree.find(sourceID),
            targetLeaf = this._tree.find(targetID);

        const MOVE_ARGS = {
            direction: 'parent',
            projectedPosition: targetLeaf.length(),
            source: Object.assign({
                grootID: sourceID,
                position: sourceLeaf.position,
            }, sourceLeaf.attributes),
            target: Object.assign({
                grootID: targetLeaf.id,
                position: targetLeaf.position,
            }, targetLeaf.attributes)
        };

        this._raiseAsync(EVENTS.LEAF.MOVING, MOVE_ARGS).then(() => {
            targetLeaf.makeParentOf(sourceLeaf);
            MOVE_ARGS.source.position = sourceLeaf.position;
            MOVE_ARGS.target.position = targetLeaf.position;
            this._raise(EVENTS.LEAF.MOVED, MOVE_ARGS);

            const EXPAND_ARGS = {
                source: Object.assign({
                    grootID: targetLeaf.id,
                    deep: false,
                }, targetLeaf.attributes)
            };

            this._raise(EVENTS.LEAF.EXPANDING, EXPAND_ARGS);
            targetLeaf.expand();
            this._raise(EVENTS.LEAF.EXPANDED, EXPAND_ARGS);

            this.render();
        });

        this._raise(EVENTS.MENU.CLICKED, {
            action: 'make-parent'
        });
        return false;
    },

    _onMenuActivateChildrenClicked: function (e) {
        e.preventDefault();
        this._raise(EVENTS.MENU.CLICKING, {
            action: 'activate-children'
        });

        const { sourceID } = this._menu.options,
            listItem = this._menu.listItemElement,
            sourceLeaf = this._tree.find(sourceID);

        const ACTIVATE_ARGS = {
            deep: true,
            source: Object.assign({
                grootID: sourceID,
            }, sourceLeaf.attributes)
        };

        this._hideMenu();

        this._raiseAsync(EVENTS.LEAF.ACTIVATING, ACTIVATE_ARGS).then((eventArgs) => {
            if (!sourceLeaf.isActive) {
                sourceLeaf.activate();
                sourceLeaf.mergeAttributes(eventArgs.result);
            }
            const generator = sourceLeaf.traverse(true);
            let result = generator.next();
            while (!result.done) {
                const childLeaf = result.value;
                childLeaf.mergeAttributes(eventArgs.result);
                childLeaf.activate();
                result = generator.next();
            }
            this._renderLeaf(listItem, sourceLeaf);
            this._raise(EVENTS.LEAF.ACTIVATED, ACTIVATE_ARGS);
        });

        this._raise(EVENTS.MENU.CLICKED, {
            action: 'activate-children'
        });
        return false;
    },

    _onMenuDisableChildrenClicked: function (e) {
        e.preventDefault();
        this._raise(EVENTS.MENU.CLICKING, {
            action: 'disable-children'
        });

        const { sourceID } = this._menu.options,
            listItem = this._menu.listItemElement,
            sourceLeaf = this._tree.find(sourceID);

        const DISABLE_ARGS = {
            deep: true,
            source: Object.assign({
                grootID: sourceID,
            }, sourceLeaf.attributes)
        };

        this._hideMenu();

        this._raiseAsync(EVENTS.LEAF.DISABLING, DISABLE_ARGS).then((eventArgs) => {
            if (sourceLeaf.isActive) {
                sourceLeaf.deactivate();
                sourceLeaf.mergeAttributes(eventArgs.result);
            }
            const generator = sourceLeaf.traverse(true);
            let result = generator.next();
            while (!result.done) {
                const childLeaf = result.value;
                childLeaf.mergeAttributes(eventArgs.result);
                childLeaf.deactivate();
                result = generator.next();
            }
            this._renderLeaf(listItem, sourceLeaf);
            this._raise(EVENTS.LEAF.DISABLED, DISABLE_ARGS);
        });

        this._raise(EVENTS.MENU.CLICKED, {
            action: 'disable-children'
        });
        return false;
    },
};

/**
 *
 * @param {HTMLElement} htmlElement
 * @param {Leaf} rootLeaf - root leaf of a tree
 * @return {Groot}
 * @constructor
 */
export const Groot = function (htmlElement, rootLeaf) {
    /**
     * @typedef {Object} Groot
     * @property {Boolean} isEnabled
     * @method {Function} prune
     * @method {Function} remove
     * @method {Function} rename
     * @method {Function} expand
     * @method {Function} disable
     * @method {Function} enable
     * @method {Function} render
     * @method {Function} closeMenu
     */
    const instance = Object.assign(new Emitter(), grootPrototype);
    instance.isEnabled = true;
    instance._containerElement = htmlElement;
    instance._tree = rootLeaf;
    instance._menu = new GrootMenu();
    instance._handlers = {
        'click': {
            // leaf controls
            '.groot-leaf__label': instance._onLeafLabelClicked,
            '.groot-leaf__toggle': instance._onLeafLabelClicked,
            '.groot-leaf__menu': instance._onLeafMenuClicked,
            '.groot-leaf__up': instance._onLeafUpClicked,
            '.groot-leaf__down': instance._onLeafDownClicked,
            '.groot-leaf__label-field': instance._onLeafLabelFieldClicked,
            // menu controls
            '.groot-menu__close': instance._onMenuCloseClicked,
            '.groot-menu__create': instance._onMenuCreateClicked,
            '.groot-menu__rename': instance._onMenuRenameClicked,
            '.groot-menu__delete': instance._onMenuDeleteClicked,
            '.groot-menu__move-to': instance._onMenuMoveToClicked,
            '.groot-menu__move-up': instance._onMenuMoveUpClicked,
            '.groot-menu__move-down': instance._onMenuMoveDownClicked,
            '.groot-menu__move-before': instance._onMenuMoveBeforeClicked,
            '.groot-menu__move-after': instance._onMenuMoveAfterClicked,
            '.groot-menu__make-parent': instance._onMenuMakeParentClicked,
            '.groot-menu__move-first': instance._onMenuMoveFirstClicked,
            '.groot-menu__move-last': instance._onMenuMoveLastClicked,
            '.groot-menu__activate-children': instance._onMenuActivateChildrenClicked,
            '.groot-menu__disable-children': instance._onMenuDisableChildrenClicked,
        },

        'keydown': {
            '.groot-leaf__label-field': instance._onLeafLabelFieldKeyDown,
        },

        // drag-n-drop handlers
        'dragstart': {
            '.groot-leaf__label': instance._onLeafLabelDragStart,
        },
        'drop': {
            '.groot-leaf__label': instance._onLeafLabelDragEnd,
        },
        'dragover': {
            '.groot-leaf__label': instance._onLeafLabelDragOver,
        },
        'dragenter': {
            '.groot-leaf__label': instance._onLeafLabelDragEnter,
        },
        'dragleave': {
            '.groot-leaf__label': instance._onLeafLabelDragLeave,
        },

        'contextmenu': {
            '.groot-leaf__label': instance._onLeafContextMenu
        }
    };

    Object.keys(instance._handlers).forEach((event) => {
        htmlElement.addEventListener(
            event,
            instance._captureDOMEvent.bind(instance)
        );
    });

    return instance;
};

grootPrototype.constructor = Groot;

Groot.EVENTS = EVENTS;

Groot.Leaf = Leaf;

const isString = function (target) {
    return Object.prototype.toString.call(target) === '[object String]';
};

/**
 * Wiretap a Groot instance to see all raised events.
 *   Will automatically commit async events if the async event
 *   is only being monitored by the wiretap. If other handlers
 *   are listening for the event, they must commit or cancel
 *   the eventArgs object.
 * @param {Groot} groot
 * @param {Object} events - Groot events object
 */
Groot.wireTap = function (groot, events = EVENTS) {
    Object.keys(events).forEach((key) => {
        const event = events[key];
        if (!isString(event)) {
            return Groot.wireTap(groot, event);
        }
        groot.on(event, (eventArgs) => {
            console.info(`groot <${event}>`, eventArgs);
            const listeners = groot.listeners(event);
            // if this is an async event, and the wire tap is the *only*
            // listener, go ahead and commit the event
            if (eventArgs.isAsync && listeners.length === 1) {
                eventArgs.commit();
            }
        });
    });
};
