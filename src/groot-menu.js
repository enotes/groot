'use strict';
import { noid } from './noid';
import { menuTemplate } from './groot-templates';

//
// GrootMenu
//

export let GrootMenu;

const grootMenuPrototype = {
    show: function (listItemElement, options = GrootMenu.defaultOptions) {
        this.listItemElement = listItemElement || this.listItemElement;
        if (!listItemElement) {
            throw new Error('no list item provided');
        }
        options = options || this.options;
        this.options = options;
        const tempElement = document.createElement('div');
        tempElement.innerHTML = menuTemplate(this.options);
        const menuElement = this.menuElement = tempElement.firstElementChild;
        listItemElement.insertBefore(
            menuElement,
            listItemElement.firstElementChild
        );
        this.isShowing = true;
    },

    hide: function () {
        if (!this.isShowing) {
            return;
        }
        this.listItemElement.removeChild(this.menuElement);
        this.isShowing = false;
    },
};

GrootMenu = function () {
    const instance = Object.create(grootMenuPrototype);
    instance.isShowing = false;
    instance.menuElement = null;
    instance.listItemElement = null;
    instance.options = null;
    return instance;
};

/**
 * Given a set of potential options, will the menu actually
 *   show anything meaningful, i.e., are all options set to
 *   "off", or are there options that will be displayed?
 * @param {GrootOptions} options
 * @return {Boolean}
 */
GrootMenu.willShow = function (options) {
    const ignoredOptions = ['sourceID', 'targetID'];
    const optionKeys = Object.keys(options)
        .filter((optionKey) => ignoredOptions.indexOf(optionKey) < 0);
    return optionKeys.reduce((accumulator, optionKey) => {
        return accumulator || options[optionKey];
    }, false);
};

/**
 * @typedef {Object} GrootOptions
 */
GrootMenu.defaultOptions = Object.seal({
    sourceID: noid(),
    targetID: noid(),
    create: true,
    rename: true,
    'delete': true,
    moveTo: true,
    moveUp: true,
    moveDown: true,
    moveFirst: true,
    moveLast: true,
    moveBefore: false,
    moveAfter: false,
    makeParent: false,
    activateChildren: false,
    disableChildren: false,
});

GrootMenu.createOptions = function (overrides) {
    return Object.assign({}, GrootMenu.defaultOptions, overrides);
};

grootMenuPrototype.constructor = GrootMenu;
