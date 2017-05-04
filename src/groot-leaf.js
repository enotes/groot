'use strict';
//
// Leaf
//

// defining here before use to satisfy eslint
export let Leaf;

const leafPrototype = {

    //
    // modifying this leaf's relationship to other leafs
    //

    moveBefore: function (leaf) {
        leaf.getParent().move(this, leaf.position);
    },

    moveAfter: function (leaf) {
        leaf.getParent().move(this, leaf.position + 1);
    },

    makeParentOf: function (leaf) {
        const oldParent = leaf.getParent();
        if (oldParent) {
            oldParent.remove(leaf);
        }
        this.leafs.push(leaf);
        leaf.parent = this;
        this.leafCount += 1;
        leaf.level = this.level + 1;
        leaf.isRoot = false;
        this._updatePositions();
        return leaf;
    },

    makeChildOf: function (leaf) {
        return leaf.makeParentOf(this);
    },

    remove: function (leaf) {
        if (!this.isParentOf(leaf)) {
            throw new Error(`leaf ${leaf.id} is not child of node ${this.id}`);
        }
        this.leafs.splice(leaf.position, 1);
        this.leafCount -= 1;
        leaf.isRoot = true;
        this._updatePositions();
        return leaf;
    },

    move: function (leaf, position) {
        if (!leaf.getParent().equals(this)) {
            this.makeParentOf(leaf);
        }
        // if inserting *before* the leaf's position, it will
        // bump the remove position by 1
        const removePosition = (position <= leaf.position) ?
            leaf.position + 1 :
            leaf.position;
        // console.log(`moving ${leaf.position} => ${position}`);
        this.leafs.splice(position, 0, leaf);
        // console.log(`removing ${removePosition}`);
        this.leafs.splice(removePosition, 1);
        this._updatePositions();
        return leaf;
    },

    /**
     * Branch this leaf by creating a new leaf and making this leaf
     *   its parent
     * @param {String} [label]
     * @return {Leaf}
     */
    branch: function (label = '') {
        const leaf = new Leaf(label);
        this.makeParentOf(leaf);
        return leaf;
    },

    /**
     * Create a graft on this leaf by creating a new leaf and
     *   making this leaf its parent. A grafted leaf differs from
     *   a branched leaf in that a grafted leaf tracks its grafting
     *   status and may ungraft (remove itself) or inosculate (commit
     *   itself) to its parent. A grafted leaf has no label.
     * @return {Leaf}
     */
    graft: function () {
        const leaf = this.branch();
        leaf.isBeingGrafted = true;
        return leaf;
    },

    /**
     * Ungraft this leaf by removing it from its parent.
     * @return {Boolean}
     */
    ungraft: function () {
        if (!this.isBeingGrafted) {
            return false;
        }
        this.getParent().remove(this);
        return true;
    },

    /**
     * Inosculate this leaf (commit it) to its parent and stop
     *   tracking its grafting status.
     * @return {Boolean}
     */
    inosculate: function () {
        if (!this.isBeingGrafted) {
            return false;
        }
        this.isBeingGrafted = false;
        return true;
    },

    activate: function () {
        this.isActive = true;
    },

    deactivate: function () {
        this.isActive = false;
    },

    //
    // getting leafs related to this leaf
    //

    getParent: function () {
        return this.parent;
    },

    hasChildren: function () {
        return this.length() > 0;
    },

    hasAnyActiveChildren: function (deep = false) {
        const generator = this.traverse(deep);
        let result = generator.next();
        while (!result.done) {
            const leaf = result.value;
            if (leaf.isActive) {
                return true;
            }
            result = generator.next();
        }
        return false;
    },

    hasAnyInactiveChildren: function (deep = false) {
        const generator = this.traverse(deep);
        let result = generator.next();
        while (!result.done) {
            const leaf = result.value;
            if (!leaf.isActive) {
                return true;
            }
            result = generator.next();
        }
        return false;
    },

    getChildren: function () {
        return this.leafs;
    },

    getFirstChild: function () {
        if (this.length() === 0) {
            return null;
        }
        return this.leafs[0];
    },

    getLastChild: function () {
        if (this.length() === 0) {
            return null;
        }
        return this.leafs[this.length() - 1];
    },

    getSiblings: function () {
        const siblings = this.getParent()
            .getChildren()
            // shallow copy
            .map(s => s);
        siblings.splice(this.position, 1);
        return siblings;
    },

    getSiblingBefore: function () {
        if (this.isRoot) {
            return null;
        }
        if (this.isFirstSibling) {
            return null;
        }
        return this.getParent()
            .get(this.position - 1);
    },

    getSiblingAfter: function () {
        if (this.isRoot) {
            return null;
        }
        if (this.isLastSibling) {
            return null;
        }
        return this.getParent()
            .get(this.position + 1);
    },

    get: function (position) {
        return this.leafs[position];
    },

    traverse: function* (deep = false) {
        for (let i = 0; i < this.length(); i += 1) {
            const leaf = this.get(i);
            // console.info(`> ${leaf.id}`);
            yield leaf;
            if (!deep || leaf.length() === 0) {
                continue;
            }
            const generator = leaf.traverse(true);
            let result = generator.next();
            while (!result.done) {
                const childLeaf = result.value;
                // console.info(`> ${childLeaf.id}`);
                yield childLeaf;
                result = generator.next();
            }
        }
    },

    /**
     * Find a leaf by groot ID
     * @param {Number} id
     * @param {Boolean} [throwOnMissing=true] - if no leaf is found, throw an error
     * @return {Leaf|null}
     */
    find: function (id, throwOnMissing = true) {
        if (id === this.id) {
            return this;
        }
        const generator = this.traverse(true);
        let result = generator.next();
        while (!result.done) {
            const leaf = result.value;
            if (leaf.id === id) {
                return leaf;
            }
            result = generator.next();
        }
        if (throwOnMissing) {
            throw new Error(`no leaf with id ${id} exists`);
        }
        return null;
    },

    /**
     * Find a leaf by matching its custom attributes.
     * @param {Object} attributes
     * @param {Boolean} [throwOnMissing=true] - if no leaf is found, throw an error
     * @return {Leaf|null}
     */
    findByAttributes: function (attributes = {}, throwOnMissing = true) {
        const generator = this.traverse(true);
        let result = generator.next();
        while (!result.done) {
            const leaf = result.value;
            let isMatch = true;
            const keys = Object.keys(attributes);
            while (keys.length) {
                const key = keys.shift();
                isMatch = (isMatch && leaf.attributes[key] === attributes[key]);
            }
            if (isMatch) {
                return leaf;
            }
            result = generator.next();
        }
        if (throwOnMissing) {
            attributes = JSON.stringify(attributes);
            throw new Error(`no leaf exists for attributes: ${attributes}`);
        }
        return null;
    },

    //
    // querying this leaf's relationship to other leafs
    //

    isParentOf: function (leaf) {
        return leaf.getParent().equals(this);
    },

    isChildOf: function (leaf) {
        return this.getParent().equals(leaf);
    },

    isAncestorOf: function (leaf) {
        return leaf.isDescendantOf(this);
    },

    isDescendantOf: function (leaf) {
        let parent = this.getParent();
        while (parent) {
            if (parent === leaf) {
                return true;
            }
            parent = parent.getParent();
        }
        return false;
    },

    isSibling: function (leaf) {
        return this.getParent() === leaf.getParent();
    },

    isBefore: function (leaf) {
        return this.isSibling(leaf) &&
            (leaf.position > this.position);
    },

    isAfter: function (leaf) {
        return this.isSibling(leaf) &&
            leaf.position < this.position;
    },

    isLeftOf: function (leaf) {
        return leaf.level > this.level;
    },

    isRightOf: function (leaf) {
        return leaf.level < this.level;
    },

    //
    // how this leaf represents itself
    //

    expand: function (deep = false) {
        if (deep) {
            this.expandChildren(deep);
        }
        this.isExpanded = true;
    },

    expandChildren: function (deep) {
        const generator = this.traverse(deep);
        let result = generator.next();
        while (!result.done) {
            const leaf = result.value;
            leaf.isExpanded = true;
            leaf.collapse();
            result = generator.next();
        }
    },

    collapse: function (deep = false) {
        if (deep) {
            this.collapseChildren(deep);
        }
        this.isExpanded = false;
    },

    collapseChildren: function (deep = false) {
        const generator = this.traverse(deep);
        let result = generator.next();
        while (!result.done) {
            const leaf = result.value;
            leaf.isExpanded = false;
            result = generator.next();
        }
    },

    toggle: function () {
        return this.isExpanded ?
            this.collapse() :
            this.expand();
    },

    requestLabelChange: function () {
        this.isBeingRenamed = true;
    },

    cancelLabelChange: function () {
        this.isBeingRenamed = false;
    },

    commitLabelChange: function (label) {
        this.label = label;
        this.isBeingRenamed = false;
    },

    setAttributes: function (attributes = {}) {
        this.attributes = attributes;
    },

    setAttribute: function (key, value) {
        this.attributes[key] = value;
    },

    mergeAttributes: function (attributes = {}) {
        this.attributes = Object.assign(this.attributes, attributes);
    },

    hasAttribute: function (key, withValue = null) {
        const hasAttribute = this.attributes.hasOwnProperty(key);
        if (!hasAttribute || withValue === null) {
            return hasAttribute;
        }
        return this.attributes[key] === withValue;
    },

    anyChildHasAttribute: function (deep, key, withValue = null) {
        const generator = this.traverse(deep);
        let result = generator.next();
        while (!result.done) {
            const leaf = result.value;
            if (leaf.hasAttribute(key, withValue)) {
                return true;
            }
            result = generator.next();
        }
        return false;
    },

    //
    // utility methods
    //

    _updatePositions: function () {
        const maxPosition = this.length() - 1;
        const generator = this.traverse();
        let result = generator.next();
        let position = -1;
        while (!result.done) {
            const leaf = result.value;
            leaf.position = (position += 1);
            leaf.isFirstSibling = (leaf.position === 0);
            leaf.isLastSibling = (leaf.position === maxPosition);
            result = generator.next();
        }
    },

    equals: function (leaf) {
        return leaf === this;
    },

    length: function () {
        return this.leafCount;
    },

    toString: function () {
        const { id, label, level, position } = this;
        return `[${id} ${label} - ${level}:${position}]`;
    },
};

/**
 * A leaf node that may or may not also be a tree
 * @param {String} label
 * @param {Boolean} [isExpanded=false]
 * @param {Boolean} isActive
 * @return {Leaf}
 * @constructor
 */
Leaf = function (label = '', isExpanded = false, isActive = true) {
    /** @type {Leaf} **/
    const instance = Object.create(leafPrototype);
    /** @type {Leaf} parent node */
    instance.parent = null;
    /** @type {Array.<Leaf>} child nodes */
    instance.leafs = [];
    /** @type {Number} number of child nodes */
    instance.leafCount = 0;
    /** @type {String} label */
    instance.label = label;
    /** @type {Number} indentation level */
    instance.level = 0;
    /** @type {Number} position as a child; 0-based */
    instance.position = 0;
    /** @type {Boolean} is this a parentless node? */
    instance.isRoot = true;
    /** @type {Boolean} is this node the first among siblings? */
    instance.isFirstSibling = true;
    /** @type {Boolean} is this node the last among siblings? */
    instance.isLastSibling = true;
    /** @type {Boolean} is this node expanded? */
    instance.isExpanded = isExpanded;
    /** @type {Boolean} is this node being renamed? */
    instance.isBeingRenamed = false;
    /** @type {Boolean} is this leaf being grafted into another? */
    instance.isBeingGrafted = false;
    /** @type {Boolean} generic "active" flag **/
    instance.isActive = isActive;
    /** @type {Boolean} attributes to be rendered as data-<key> in the DOM */
    instance.attributes = {};
    /** @type {Number} unique identifier */
    instance.id = (Leaf.instanceCount += 1);
    return instance;
};

leafPrototype.constructor = Leaf;

Leaf.instanceCount = 0;
