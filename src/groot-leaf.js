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

    /**
     * Move this instance before leaf.
     * @param {Leaf} leaf
     */
    moveBefore: function (leaf) {
        leaf.getParent().move(this, leaf.position);
    },

    /**
     * Move this instance after leaf.
     * @param {Leaf} leaf
     */
    moveAfter: function (leaf) {
        leaf.getParent().move(this, leaf.position + 1);
    },

    /**
     * Make this instance a parent of leaf.
     * @param {Leaf} leaf
     * @returns {Leaf} - leaf
     */
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

    /**
     * Make this instance a child of leaf.
     * @param {Leaf} leaf
     * @returns {Leaf} - leaf
     */
    makeChildOf: function (leaf) {
        return leaf.makeParentOf(this);
    },

    /**
     * Remove leaf from this instance's child leafs.
     * @param {Leaf} leaf
     * @returns {Leaf} leaf
     */
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

    /**
     * Move leaf to position within this instance's child leafs.
     * @param {Leaf} leaf
     * @param {Number} position
     * @returns {Leaf} leaf
     */
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

    /**
     * Activate this instance.
     */
    activate: function () {
        this.isActive = true;
    },

    /**
     * Deactivate this instance.
     */
    deactivate: function () {
        this.isActive = false;
    },

    //
    // getting leafs related to this leaf
    //

    /**
     * Get the parent of this instance.
     * @returns {Leaf|null}
     */
    getParent: function () {
        return this.parent;
    },

    /**
     * Gets a collection of this leaf's ancestors, starting
     *   with the closest ancestor and ending with the furthest.
     *   If inverse=true, then the order will be reversed.
     * @param {Boolean} inverse - inverse the order of ancestors
     * @return {Array.<Leaf>}
     */
    getAncestors: function (inverse = false) {
        const ancestors = [];
        let leaf = this,
            parent = leaf.getParent();
        while (parent) {
            if (inverse) {
                // furthest to closest
                ancestors.unshift(parent);
            } else {
                // closest to furthest
                ancestors.push(parent);
            }
            leaf = parent;
            parent = leaf.getParent();
        }
        return ancestors;
    },

    /**
     * Does this instance have any children?
     * @returns {Boolean}
     */
    hasChildren: function () {
        return this.length() > 0;
    },

    /**
     * Does this instance have any active children?
     * @param {Boolean} [deep=false] - consider children of children, etc.
     * @returns {Boolean}
     */
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

    /**
     * Does this instance have any inactive children?
     * @param {Boolean} [deep=true] - consider children of children, etc.
     * @returns {Boolean}
     */
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

    /**
     * Get this instance's children.
     * @returns {Array.<Leaf>}
     */
    getChildren: function () {
        return this.leafs;
    },

    /**
     * Get the first child in this instance.
     * @returns {Leaf|null}
     */
    getFirstChild: function () {
        if (this.length() === 0) {
            return null;
        }
        return this.leafs[0];
    },

    /**
     * Get the last child in this instance.
     * @returns {Leaf|null}
     */
    getLastChild: function () {
        if (this.length() === 0) {
            return null;
        }
        return this.leafs[this.length() - 1];
    },

    /**
     * Get the siblings of this instance.
     * @returns {Array.<Leaf>}
     */
    getSiblings: function () {
        const siblings = this.getParent()
            .getChildren()
            // shallow copy
            .map(s => s);
        siblings.splice(this.position, 1);
        return siblings;
    },

    /**
     * Get the siblings before this instance.
     * @returns {Array.<Leaf>|null}
     */
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

    /**
     * Get the siblings after this instance.
     * @returns {Array.<Leaf>|null}
     */
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

    /**
     * Get a child leaf of this instance by position.
     * @param {Number} position
     * @returns {Leaf|null}
     */
    get: function (position) {
        return this.leafs[position];
    },

    /**
     * Create a generator to traverse this instance's child leafs.
     * @param {Boolean} [deep=false] - traverse children of children, etc.
     * @return {Generator}
     */
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

    /**
     * Is this instance the parent of leaf?
     * @param {Leaf} leaf
     * @returns {Boolean}
     */
    isParentOf: function (leaf) {
        return leaf.getParent().equals(this);
    },

    /**
     * Is this instance a child of leaf?
     * @param {Leaf} leaf
     * @returns {Boolean}
     */
    isChildOf: function (leaf) {
        return this.getParent().equals(leaf);
    },

    /**
     * Is this instance an ancestor of leaf?
     * @param {Leaf} leaf
     * @returns {Boolean}
     */
    isAncestorOf: function (leaf) {
        return leaf.isDescendantOf(this);
    },

    /**
     * Is this instance a descendant of leaf?
     * @param {Leaf} leaf
     * @returns {Boolean}
     */
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

    /**
     * Is this instance a sibling of leaf?
     * @param {Leaf} leaf
     * @returns {Boolean}
     */
    isSibling: function (leaf) {
        return this.getParent() === leaf.getParent();
    },

    /**
     * Is this instance before leaf?
     * @param {Leaf} leaf
     * @returns {Boolean}
     */
    isBefore: function (leaf) {
        return this.isSibling(leaf) &&
            (leaf.position > this.position);
    },

    /**
     * Is this instance after leaf?
     * @param {Leaf} leaf
     * @returns {Boolean}
     */
    isAfter: function (leaf) {
        return this.isSibling(leaf) &&
            leaf.position < this.position;
    },

    /**
     * Is this instance "left of" leaf (i.e., has a lower level)?
     * @param {Leaf} leaf
     * @returns {Boolean}
     */
    isLeftOf: function (leaf) {
        return leaf.level > this.level;
    },

    /**
     * Is this instance "right of" leaf (i.e., has a higher level)?
     * @param {Leaf} leaf
     * @returns {Boolean}
     */
    isRightOf: function (leaf) {
        return leaf.level < this.level;
    },

    //
    // how this leaf represents itself
    //

    /**
     * Expand this leaf.
     * @param {Boolean} [deep=false] - expand the children of this leaf, recursively
     */
    expand: function (deep = false) {
        if (deep) {
            this.expandChildren(deep);
        }
        this.isExpanded = true;
    },

    /**
     * Expand the children of this leaf.
     * @param {Boolean} [deep=false] - expand the children of each child, recursively
     */
    expandChildren: function (deep = false) {
        const generator = this.traverse(deep);
        let result = generator.next();
        while (!result.done) {
            const leaf = result.value;
            leaf.isExpanded = true;
            leaf.collapse();
            result = generator.next();
        }
    },

    /**
     * Collapse this leaf.
     * @param {Boolean} [deep=false] - collapse the children of this leaf, recursively
     */
    collapse: function (deep = false) {
        if (deep) {
            this.collapseChildren(deep);
        }
        this.isExpanded = false;
    },

    /**
     * Collapse the children of this leaf.
     * @param {Boolean} [deep=false] - collapse the children of each child, recursively
     */
    collapseChildren: function (deep = false) {
        const generator = this.traverse(deep);
        let result = generator.next();
        while (!result.done) {
            const leaf = result.value;
            leaf.isExpanded = false;
            result = generator.next();
        }
    },

    /**
     * Toggle (expand/collapse) this instance.
     * @returns {*}
     */
    toggle: function () {
        return this.isExpanded ?
            this.collapse() :
            this.expand();
    },

    /**
     * Mark this leaf as being renamed.
     */
    requestLabelChange: function () {
        this.isBeingRenamed = true;
    },

    /**
     * Unmark this leaf as being renamed.
     */
    cancelLabelChange: function () {
        this.isBeingRenamed = false;
    },

    /**
     * Apply a label change to this leaf.
     * @param {String} label
     */
    commitLabelChange: function (label) {
        this.label = label;
        this.isBeingRenamed = false;
    },

    /**
     * Set (override) the custom attributes of this leaf.
     * @param {Object} [attributes={}]
     */
    setAttributes: function (attributes = {}) {
        this.attributes = attributes;
    },

    /**
     * Set a custom attribute for this leaf.
     * @param {String} key
     * @param {*} value
     */
    setAttribute: function (key, value) {
        this.attributes[key] = value;
    },

    /**
     * Merge the attributes of this leaf with attributes.
     * @param {Object} [attributes={}]
     */
    mergeAttributes: function (attributes = {}) {
        this.attributes = Object.assign(this.attributes, attributes);
    },

    /**
     * Does this leaf have a given attribute? If withValue is supplied,
     *   does the attribute also have the given value?
     * @param {String} key - attribute name
     * @param {*} [withValue=null] - value to test for
     * @returns {Boolean}
     */
    hasAttribute: function (key, withValue = null) {
        const hasAttribute = this.attributes.hasOwnProperty(key);
        if (!hasAttribute || withValue === null) {
            return hasAttribute;
        }
        return this.attributes[key] === withValue;
    },

    /**
     * Does any child of this instance have the given attribute? If withValue
     *   is supplied, does the attribute also have the given value?
     * @param {Boolean} deep - check the children of each child, recursively
     * @param {String} key - attribute name
     * @param {*} [withValue=null] - value to test for
     * @returns {Boolean}
     */
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

    /**
     * Update the internal positions of all child leafs.
     * @private
     */
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

    /**
     * Does this instance equal (identity) another reference?
     * @param {Leaf} leaf
     * @returns {Boolean}
     */
    equals: function (leaf) {
        return leaf === this;
    },

    /**
     * How many child leafs does this instance have?
     * @returns {Number}
     */
    length: function () {
        return this.leafCount;
    },

    /**
     * Serialize this instance as a string.
     * @returns {String}
     */
    toString: function () {
        const { id, label, level, position } = this;
        return `[${id} ${label} - ${level}:${position}]`;
    },
};

/**
 * Creates a Leaf instance.
 * @param {String} label
 * @param {Boolean} [isExpanded=false]
 * @param {Boolean} [isActive=true]
 * @return {Leaf}
 * @constructor
 */
Leaf = function (label = '', isExpanded = false, isActive = true) {
    /**
     * @typedef {Object} Leaf
     * @augments {leafPrototype}
     * @property {Number} id - unique, internal identifier
     * @property {Leaf|null} parent
     * @property {Array.<Leaf>} leafs
     * @property {Number} leafCount
     * @property {String} label
     * @property {Number} level
     * @property {Number} position
     * @property {Boolean} isRoot
     * @property {Boolean} isFirstSibling
     * @property {Boolean} isLastSibling
     * @property {Boolean} isExpanded
     * @property {Boolean} isBeingRenamed
     * @property {Boolean} isBeingGrafted
     * @property {Boolean} isActive
     * @property {Object} attributes
     * @method {Function} moveBefore
     * @method {Function} moveAfter
     * @method {Function} makeParentOf
     * @method {Function} makeChildOf
     * @method {Function} remove
     * @method {Function} move
     * @method {Function} branch
     * @method {Function} graft
     * @method {Function} ungraft
     * @method {Function} inosculate
     * @method {Function} activate
     * @method {Function} deactivate
     * @method {Function} getParent
     * @method {Function} hasChildren
     * @method {Function} hasAnyActiveChildren
     * @method {Function} hasAnyInactiveChildren
     * @method {Function} getChildren
     * @method {Function} getFirstChild
     * @method {Function} getLastChild
     * @method {Function} getSiblings
     * @method {Function} getSiblingsBefore
     * @method {Function} getSiblingsAfter
     * @method {Function} get
     * @method {Function} traverse
     * @method {Function} find
     * @method {Function} findByAttributes
     * @method {Function} isParentOf
     * @method {Function} isChildOf
     * @method {Function} isAncestorOf
     * @method {Function} isDescendantOf
     * @method {Function} isSibling
     * @method {Function} isBefore
     * @method {Function} isAfter
     * @method {Function} isLeftOf
     * @method {Function} isRightOf
     * @method {Function} expand
     * @method {Function} expandChildren
     * @method {Function} collapse
     * @method {Function} collapseChildren
     * @method {Function} toggle
     * @method {Function} requestLabelChange
     * @method {Function} cancelLabelChange
     * @method {Function} commitLabelChange
     * @method {Function} setAttributes
     * @method {Function} setAttribute
     * @method {Function} mergeAttributes
     * @method {Function} hasAttribute
     * @method {Function} anyChildHasAttribute
     * @method {Function} equals
     * @method {Function} length
     * @method {Function} toString
     *
     */
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

/**
 * Internal instance count. Used to determine new Leaf IDs.
 * @type {Number}
 */
Leaf.instanceCount = 0;
