# Groot

A UI tree for working with nested content.

<!-- TOC -->

- [Groot](#groot)
    - [Installation](#installation)
        - [As an ES2015 module](#as-an-es2015-module)
        - [As an ES5 script](#as-an-es5-script)
    - [Building the project](#building-the-project)
    - [Usage](#usage)
        - [Creating your tree](#creating-your-tree)
        - [Adding custom meta-data](#adding-custom-meta-data)
        - [Listening for events](#listening-for-events)
    - [The public Groot API](#the-public-groot-api)
    - [The public Leaf API](#the-public-leaf-api)
    - [Special terms](#special-terms)
    - [TODO](#todo)

<!-- /TOC -->

![Groot menu with TV show information](groot-vanity-shot.png)

## Installation

### As an ES2015 module

Install Groot with npm.

```
$ npm install --save @enotes/groot
```

Import the `Groot` constructor into your own module.

```js
import { Groot } from 'groot';
```

### As an ES5 script

Copy the Groot assets in the `dist/` folder to the appropriate vendor location in your project structure, e.g., `scripts/vendor/groot/`.

Reference the Groot assets in your HTML document.

```html
<head>
    <link type="text/css" rel="stylesheet" src="scripts/vendor/groot/groot.css" />
</head>
<body>
    <!-- creates window.Groot -->
    <script src="scripts/vendor/groot/groot.js"></script>
    <script>console.log(window.Groot);</script>
</body>
```

## Building the project

Install the Groot npm dependencies to ensure that the build tools are present.

```
$ npm install
```

The Groot distribution artifacts are pre-built and are located in the `dist/` folder. These assets are re-built with the command:

```
$ npm run-script build
```

**The build script relies on bash shell commands and will not work correctly in non-bash environments.**


## Usage

### Creating your tree

Create a tree by iterating over some data and transforming it into instances of `Groot.Leaf`.

```js
const rootLeaf = new Groot.Leaf('root leaf');
let child = rootLeaf.branch('child leaf 1');
child.branch('child leaf 1.1');
child.branch('child leaf 1.2');
rootLeaf.branch('child leaf 2');
child = rootLeaf.branch('child leaf 3');
child.branch('child leaf 3.1');
// etc.

const containerElement = document.querySelector('#some-container');
const tree = new Groot(containerElement, rootLeaf);
rootLeaf.expand(true);
tree.render();
```

See [src/demo.js](https://github.com/enotes/groot/blob/master/src/demo.js) for a more complete example.

### Adding custom meta-data

Leafs can contain custom meta-data in the form of attributes.

```js
const leaf = tree.branch('child leaf');
leaf.setAttribute('myCustomID', 123);
```

Setting custom meta-data on a leaf allows you to dereference the leaf against your application's own data. Custom meta-data also plays a part in Groot events (discussed below) and may be changed during leaf creation, or when async events are raised.

### Listening for events

Groot raises events for nearly every tree operation. Some of these will require you to commit to, or cancel an operation before it completes.

| Event           | Description                                          | Async? | Multisource? | Special Properties                                                                                                                                     |
| --------------- | ---------------------------------------------------- | ------ | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| rendering       | the tree is about to be rendered in the DOM          | no     | no           |                                                                                                                                                        |
| rendered        | the tree has been rendered in the DOM                | no     | no           |                                                                                                                                                        |
| leaf.moving     | a leaf is moving                                     | yes    | yes          | direction=up,down,first,last,to,parent,before,after                                                                                                    |
| leaf.moved      | a leaf has moved                                     | no     | yes          | see: leaf.moving                                                                                                                                       |
| leaf.clicking   | a leaf is being clicked on                           | no     | no           | isRightClick={Boolean}                                                                                                                                 |
| leaf.clicked    | a leaf has been clicked on                           | no     | no           | see: leaf.clicking                                                                                                                                     |
| leaf.dragging   | a leaf is starting to be dragged                     | no     | no           |                                                                                                                                                        |
| leaf.dragged    | a leaf has been dragged                              | no     | no           |                                                                                                                                                        |
| leaf.dropping   | a leaf is starting to be dropped onto another leaf   | no     | yes          |                                                                                                                                                        |
| leaf.dropped    | a leaf has been dropped onto another leaf            | no     | yes          |                                                                                                                                                        |
| leaf.renaming   | a leaf is about to be renamed                        | yes    | no           | isNew={Boolean}, label={String}                                                                                                                        |
| leaf.renamed    | a leaf has been renamed                              | no     | no           | see: leaf.renaming                                                                                                                                     |
| leaf.unnamed    | a leaf has been unnamed (pending rename is canceled) | no     | no           | see: leaf.renaming                                                                                                                                     |
| leaf.expanding  | a leaf is about to expand                            | no     | no           | deep={Boolean}                                                                                                                                         |
| leaf.expanded   | a leaf has expanded                                  | no     | no           | see: leaf.expanding                                                                                                                                    |
| leaf.collapsing | a leaf is about to collapse                          | no     | no           | deep={Boolean}                                                                                                                                         |
| leaf.collapsed  | a leaf has collapsed                                 | no     | no           | see: leaf.collapsing                                                                                                                                   |
| leaf.deleting   | a leaf is about to be deleted                        | yes    | no           |                                                                                                                                                        |
| leaf.deleted    | a leaf has been deleted                              | no     | no           |                                                                                                                                                        |
| leaf.creating   | a leaf is about to be created                        | no     | no           | projectedPosition={Number}                                                                                                                             |
| leaf.created    | a leaf has been created                              | no     | no           | see: leaf.creating                                                                                                                                     |
| leaf.pruning    | a leaf is about to be pruned                         | no     | no           |                                                                                                                                                        |
| leaf.pruned     | a leaf has been pruned                               | no     | no           |                                                                                                                                                        |
| leaf.activating | a leaf is about to be activated                      | no     | no           | deep={Boolean}                                                                                                                                         |
| leaf.activated  | a leaf has been activated                            | no     | no           | see: leaf.activating                                                                                                                                   |
| leaf.disabling  | a leaf is about to be disabled                       | no     | no           | deep={Boolean}                                                                                                                                         |
| leaf.disabled   | a leaf has been disabled                             | no     | no           | see: leaf.disabling                                                                                                                                    |
| menu.clicking   | a menu item is about to be clicked                   | no     | no           | action=create,rename,delete,move-to,move-up,move-down,move-first,move-last,move-before,move-after,make-parent,activate-children,disable-children,close |
| menu.clicked    | a menu item has been clicked                         | no     | no           | see: menu.clicking                                                                                                                                     |
| menu.showing    | the menu is about to show                            | no     | no           |                                                                                                                                                        |
| menu.shown      | the menu has been shown                              | no     | no           | (menu options)                                                                                                                                         |
| menu.hiding     | the menu is about to be hidden                       | no     | no           |                                                                                                                                                        |
| menu.hidden     | the menu has been hidden                             | no     | no           | (menu options)                                                                                                                                         |

For convenience, event names may be referenced by using the `Groot.EVENTS` object. For example:

```js
Groot.EVENTS.RENDERED === 'rendered'
Groot.EVENTS.LEAF.DELETING === 'leaf.deleating'
Groot.EVENTS.MENU.HIDDEN === 'menu.hidden'
// etc.
```

Subscriptions to Groot events are established by calling its `on()` method with a callback.

```js
tree.on(Groot.EVENTS.LEAF.MOVING, (eventArgs) => {
    // handle the event
});
```

All event callbacks will receive an `eventArgs` object. This will contain contextual information about the event. If a single node is involved, the `eventArgs` object will contain a `source` property with information about that node. If two nodes are involved (e.g.., drag-n-drop, or "Assign parent"), the event is deemed "multisource", and the `eventArgs` object will contain both `source` and `target` properties with information about the originator of the action (`source`) and the receiver of the action (`target`). These properties will also contain all of the custom meta-data added to their corresponding leafs.

Synchronous events cannot be stopped, but asynchronous events *can* be stopped. An asynchronous `eventArgs` object will contain two methods, `commit()` and `cancel()`, either of which must be called to finish the asynchronous operation. For example:

```js
tree.on(Groot.EVENTS.LEAF.DELETING, (eventArgs) => {
    api.delete(eventArgs.source.myCustomID).then(() => {
        // success -- the tree node will be removed
        eventArgs.commit();
    }, (err) => {
        // failure -- the tree node will remain
        eventArgs.cancel();
    });
});
```

## The public Groot API

After a Groot object is created the tree may be manipulated through the Groot public API, and through events that it raises. At present the public API is fairly terse but more functionality may be added later. The Groot object is designed to emit events, and perform its own internal operations as the application code responds to those events, so the public API is fairly limited.

Note that Groot methods are designed to locate leafs *by custom attributes*, which means that if you intend to manipulate the Groot instance through its public API, you will want to assign some unique attribute to each leaf as you are creating it (perhaps a database ID). See: [Adding custom meta-data](#adding-custom-meta-data).

```js
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
```

## The public Leaf API

Once a Groot object has been created with its initial tree of nodes, it will handle all interactions among its leafs. However, the initial tree must be created manually, so understanding the public Leaf API can be beneficial.

```js
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
*/
```

## Special terms

**`Leaf.attributes`**

A leaf may have custom attributes, defined by application data but irrelevant to Groot itself. For example, in a tree of TV shows, each leaf might contain a `tvShowID` attribute that is associated with an entry in a TV show database. The public Groot API is designed to manipulate the tree *by looking up leafs by attributes*, not by using internal leaf identifiers.

**`Leaf.level` and `Leaf.position`**

The `level` of a leaf defines its depth in the leaf hierarchy. The root leaf exists at level 0, its children exist at level 1, and so on.

The `position` of a leaf defines its order within its siblings. The root leaf will have a position 0.

**`Groot.remove()` and `Groot.prune()`**

Removing a leaf from the tree will delete it and raise the asynchronous `leaf.deleting` event, which may be cancelled.

Pruning a leaf from the tree will delete it, but will raise the synchronous `leaf.pruning` event which may not be cancelled. Prune leafs when you do not care about confirmation or errors.

**`Leaf.graft()`, `Leaf.ungraft()`, `Leaf.inosculate()`, and `Leaf.isBeingGrafted`**

When a new leaf is created within the tree by choosing the "Create" option on the Groot menu, it exists as a "grafted" leaf; that is to say, it is not yet formally part of the tree. After the user enters a label for the leaf, the asynchronous `leaf.creating` event will be raised. If the event is committed, the leaf will officially be [inosculated](http://www.dictionary.com/browse/inosculate?s=t), and its grafted status (`isBeingGrafted`) will be revoked. If the event is cancelled the leaf will be ungrafted, which will remove it from the tree entirely.

**`Leaf.activate()`, `Leaf.disable()`, and `Leaf.isActive`**

The active status of a leaf is purely abstract and has no affect on tree operations other than to change the visual representation of a leaf in the DOM (it will be a lighter color).


## TODO

- polish demo
- enhance documentation