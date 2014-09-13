(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/Users/ftripier/Code/Games/One/Libraries/MixedMode/src/famous/core/Components/Camera.js":[function(require,module,exports){
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Owners: dan@famo.us
 *         felix@famo.us
 *         mike@famo.us
 *
 * @license MPL 2.0
 * @copyright Famous Industries, Inc. 2014
 */

'use strict';

var MatrixMath     = require('../../math/4x4matrix');
var OptionsManager = require('../OptionsManager');

// CONSTS
var COMPONENT_NAME = 'camera';
var PROJECTION     = 'projection';

/**
 * Camera
 *
 * @component Camera
 * @constructor
 * 
 * @param {Entity} entity  Entity that the Container is a component of
 * @param {Object} options [description]
 */
function Camera(entity, options) {
    this._entity              = entity;
    this._projectionTransform = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);

    this.options              = Object.create(Camera.DEFAULT_OPTIONS);
    this._optionsManager      = new OptionsManager(this.options);
    this._optionsManager.on('change', _eventsChange.bind(this)); //robust integration

    if (options) this.setOptions(options);

    _recalculateProjectionTransform.call(this);
}

Camera.DEFAULT_OPTIONS = {
    projection : {
        type    : 'pinhole',
        options : {
            focalPoint : [0, 0, -1000]
        }
    }
};

Camera.toString = function toString() {
    return COMPONENT_NAME;
};

Camera.projectionTransforms = {};

Camera.projectionTransforms.pinhole = function pinhole(transform, focalVector) {
    var contextSize   = this._entity.getContext()._size;
    var contextWidth  = contextSize[0];
    var contextHeight = contextSize[1];

    var focalDivide        = focalVector[2] ? 1/focalVector[2] : 0;
    var widthToHeightRatio = (contextWidth > contextHeight) ? contextWidth/contextHeight : 1;
    var heightToWidthRatio = (contextHeight > contextWidth) ? contextHeight/contextWidth : 1;

    var left   = -widthToHeightRatio;
    var right  = widthToHeightRatio;
    var top    = heightToWidthRatio;
    var bottom = -heightToWidthRatio;

    var lr = 1 / (left - right);
    var bt = 1 / (bottom - top);

    transform[0]  = -2 * lr;
    transform[1]  = 0;
    transform[2]  = 0;
    transform[3]  = 0;
    
    transform[4]  = 0;
    transform[5]  = -2 * bt;
    transform[6]  = 0;
    transform[7]  = 0;
   
    transform[8]  = -focalDivide * focalVector[0];
    transform[9]  = -focalDivide * focalVector[1];
    transform[10] = focalDivide;
    transform[11] = -focalDivide;
    
    transform[12] = 0;
    transform[13] = 0;
    transform[14] = 0;
    transform[15] = 1;

    return transform;
};

Camera.projectionTransforms.orthographic = function orthographic(transform) {
    var contextSize   = this._entity.getContext()._size;
    var contextWidth  = contextSize[0];
    var contextHeight = contextSize[1];

    var widthToHeightRatio = (contextWidth > contextHeight) ? contextWidth/contextHeight : 1;
    var heightToWidthRatio = (contextHeight > contextWidth) ? contextHeight/contextWidth : 1;

    var left   = -widthToHeightRatio;
    var right  = widthToHeightRatio;
    var top    = heightToWidthRatio;
    var bottom = -heightToWidthRatio;

    var lr = 1 / (left - right);
    var bt = 1 / (bottom - top);
    var nf = 1 / (near - far);

    transform[0]  = -2 * lr;
    transform[1]  = 0;
    transform[2]  = 0;
    transform[3]  = 0;
    
    transform[4]  = 0;
    transform[5]  = -2 * bt;
    transform[6]  = 0;
    transform[7]  = 0;
    
    transform[8]  = 0;
    transform[9]  = 0;
    transform[10] = 2 * nf;
    transform[11] = 0;
    
    transform[12] = (left + right) * lr;
    transform[13] = (top + bottom) * bt;
    transform[14] = (far + near) * nf;
    transform[15] = 1;

    return transform;
};

Camera.projectionTransforms.perspective = function perspective(transform, fovy, near, far) {
    var contextSize   = this._entity.getContext()._size;
    var contextWidth  = contextSize[0];
    var contextHeight = contextSize[1];

    var aspect = contextWidth/contextHeight;

    var f  = 1.0 / Math.tan(fovy / 2);
    var nf = 1 / (near - far);

    transform[0]  = f / aspect;
    transform[1]  = 0;
    transform[2]  = 0;
    transform[3]  = 0;
    transform[4]  = 0;
    transform[5]  = f;
    transform[6]  = 0;
    transform[7]  = 0;
    transform[8]  = 0;
    transform[9]  = 0;
    transform[10] = (far + near) * nf;
    transform[11] = -1;
    transform[12] = 0;
    transform[13] = 0;
    transform[14] = (2 * far * near) * nf;
    transform[15] = 0;
    return transform;
};

function _eventsChange(data) {
    if (data.id === PROJECTION) {
        _recalculateProjectionTransform.call(this);
    }
}

function _recalculateProjectionTransform() {
    var options = [this._projectionTransform];
    for (var key in this.options.projection.options) {
        options.push(this.options.projection.options[key]);
    }
    return Camera.projectionTransforms[this.options.projection.type].apply(this, options);
}

Camera.prototype.getProjectionTransform = function getProjectionTransform() {
    return this._projectionTransform;
};

Camera.prototype.setOptions = function setOptions(options) {
    return this._optionsManager.setOptions(options);
};

Camera.prototype.getOptions = function getOptions() {
    return this.options;
};

module.exports = Camera;

},{"../../math/4x4matrix":"/Users/ftripier/Code/Games/One/Libraries/MixedMode/src/famous/math/4x4matrix.js","../OptionsManager":"/Users/ftripier/Code/Games/One/Libraries/MixedMode/src/famous/core/OptionsManager.js"}],"/Users/ftripier/Code/Games/One/Libraries/MixedMode/src/famous/core/Components/Container.js":[function(require,module,exports){
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Owners: dan@famo.us
 *         felix@famo.us
 *         mike@famo.us
 *
 * @license MPL 2.0
 * @copyright Famous Industries, Inc. 2014
 */

'use strict';

var EntityRegistry = require('../EntityRegistry');
var MatrixMath     = require('../../math/4x4matrix');
var EventHandler   = require('../../events/EventHandler');

// Consts
var CONTAINER = 'container';

/**
 * Container is a component that can be added to an Entity that
 *   is represented by a DOM node through which other renderables
 *   in the scene graph can be drawn inside of.
 *
 * @class Container
 * @component
 * @constructor
 * 
 * @param {Entity} entity  Entity that the Container is a component of
 * @param {Object} options options
 */
function Container(entity, options) {

    // TODO: Most of these properties should be accessed from getter Methods, not read directly as they currently are in DOMRenderer

    EntityRegistry.register(entity, 'HasContainer');
    this._entity        = entity;
    this._container     = options.container;
    var transform       = entity.getComponent('transform');
    this._inverseMatrix = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
    this._size          = options.size || entity.getContext()._size.slice();
    this.origin         = [0.5, 0.5];

    this._eventOutput = new EventHandler();
    this._eventOutput.bindThis(this);

    this._events = {
        eventForwarder: function eventForwarder(event) {
            this.emit(event.type, event);
            event.preventDefault();
        }.bind(this),
        on    : [],
        off   : [],
        dirty : false
    };

    this._transformDirty = true;
    this._sizeDirty      = true;

    // Inverses the Container's transform matrix to have elements nested inside
    // to appear in world space.
    transform.on('invalidated', function(report) {
        MatrixMath.invert(this._inverseMatrix, transform._matrix);
        this._transformDirty = true;
    }.bind(this));
}

Container.toString = function toString() {
    return CONTAINER;
};

/**
 * Bind a callback function to an event type handled by this object's
 *  EventHandler.
 *
 * @method on
 * @chainable
 *
 * @param {string} type event type key (for example, 'click')
 * @param {function(string, Object)} handler callback
 */
Container.prototype.on = function on(event, cb) {
    if (typeof event === 'string' && cb instanceof Function) {
        this._eventOutput.on(event, cb);
        if (this._events.on.indexOf(event) < 0) {
            this._events.on.push(event);
            this._events.dirty = true;
        }
        var index = this._events.off.indexOf(event);
        if (index > -1) this._events.off.splice(index, 1);
    } else throw new Error('on takes an event name as a string and a callback to be fired when that event is received');
    return this;
};

/**
 * Remove a function to a particular event occuring.
 *
 * @method  off
 * @chainable
 * 
 * @param {String} event name of the event to call the function when occuring
 * @param {Function} cb callback function to be called when the event is recieved.
 */
Container.prototype.off = function off(event, cb) {
    if (typeof event === 'string' && cb instanceof Function) {
        var index = this._events.on.indexOf(event);
        if (index >= 0) {
            this._eventOutput.removeListener(event, cb);
            this._events.on.splice(index, 1);
            this._events.off.push(event);
            this._events.dirty = true;
        }
    } else throw new Error('off takes an event name as a string and a callback to be fired when that event is received');
    return this;
};

/**
 * Add event handler object to the EventHandler's downstream handlers.
 *
 * @method pipe
 *
 * @param {EventHandler} target event handler target object
 * @return {EventHandler} passed event handler
 */
Container.prototype.pipe = function pipe(target) {
    var result = this._eventOutput.pipe(target);
    for (var event in this._eventOutput.listeners) {
        if (this._events.on.indexOf(event) < 0) {
            this._events.on.push(event);
            this._events.dirty = true;
        }
    }
    return result;
};

 /**
 * Remove handler object from the EventHandler's downstream handlers.
 *   Undoes work of "pipe".
 *
 * @method unpipe
 *
 * @param {EventHandler} target target handler object
 * @return {EventHandler} provided target
 */
Container.prototype.unpipe = function unpipe(target) {
    return this._eventOutput.unpipe(target);
};

/**
 * Trigger an event, sending to all of the EvenetHandler's 
 *  downstream handlers listening for provided 'type' key.
 *
 * @method emit
 *
 * @param {string} type event type key (for example, 'click')
 * @param {Object} event event data
 * @return {EventHandler} this
 */
Container.prototype.emit = function emit(type, event) {
    if (event && !event.origin) event.origin = this;
    var handled = this._eventOutput.emit(type, event);
    if (handled && event && event.stopPropagation) event.stopPropagation();
    return handled;
};

/**
 * Get the display matrix of the Container.
 *
 * @method getDisplayMatrix
 * 
 * @return {Array} display matrix of the Container
 */
Container.prototype.getDisplayMatrix = function getDisplayMatrix() {
    return this._inverseMatrix;
};

/**
 * Get the size of the Container.
 *
 * @method getSize
 * 
 * @return {Array} 2 dimensional array of representing the size of the Container
 */
Container.prototype.getSize = function getSize() {
    return this._size;
};

/**
 * Set the size of the Container.
 *
 * @method setSize
 * @chainable
 * 
 * @return {Array} 2 dimensional array of representing the size of the Container
 */
Container.prototype.setSize = function setSize(width, height) {
    this._size[0]   = width;
    this._size[1]   = height;
    this._sizeDirty = true;
    return this;
};

module.exports = Container;

},{"../../events/EventHandler":"/Users/ftripier/Code/Games/One/Libraries/MixedMode/src/famous/events/EventHandler.js","../../math/4x4matrix":"/Users/ftripier/Code/Games/One/Libraries/MixedMode/src/famous/math/4x4matrix.js","../EntityRegistry":"/Users/ftripier/Code/Games/One/Libraries/MixedMode/src/famous/core/EntityRegistry.js"}],"/Users/ftripier/Code/Games/One/Libraries/MixedMode/src/famous/core/Components/Surface.js":[function(require,module,exports){
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Owners: dan@famo.us
 *         felix@famo.us
 *         mike@famo.us
 *
 * @license MPL 2.0
 * @copyright Famous Industries, Inc. 2014
 */

'use strict';

var EntityRegistry = require('../EntityRegistry'),
    Target         = require('./Target'),
    EventHandler   = require('../../events/EventHandler');

// CONSTS
var TRANSFORM = 'transform';
var SIZE      = 'size';
var OPACITY   = 'opacity';
var SURFACE   = 'surface';

/**
 * Surface is a component that defines the data that should
 *   be drawn to an HTMLElement.  Manages CSS styles, HTML attributes,
 *   classes, and content.
 *
 * @class Surface
 * @component
 * @constructor
 * 
 * @param {Entity} entity Entity that the Surface is a component of
 * @param {Object} options instantiation options
 */
function Surface(entity, options) {
    Target.call(this, entity, {
        verticies: [new Float32Array([0, 0, 0, 1]),
                    new Float32Array([0, 0, 0, 1]),
                    new Float32Array([0, 0, 0, 1]),
                    new Float32Array([0, 0, 0, 1])]
    });

    EntityRegistry.register(entity, 'Surfaces');
    EntityRegistry.register(entity, 'Renderables');
    
    this._entity = entity;
    this._size   = new Float32Array([0,0]);

    this.invalidations = 127;
    this._eventOutput  = new EventHandler();
    this._eventOutput.bindThis(this);
    this._eventForwarder = function _eventForwarder(event) {
        this._eventOutput.emit(event.type, event);
    }.bind(this);

    this.spec = {
        _id            : entity._id,
        classes        : [],
        attributes     : {},
        properties     : {},
        content        : null,
        invalidations  : (1 << Object.keys(Surface.invalidations).length) - 1,
        origin         : new Float32Array([0.5, 0.5]),
        events         : [],
        eventForwarder : this._eventForwarder
    };

    entity.getComponent(TRANSFORM).on('invalidated', function () {
        this.invalidations |= Surface.invalidations.transform;
    }.bind(this));

    this.setOptions(options);

    this._hasOrigin = true;
}

Surface.prototype             = Object.create(Target.prototype);
Surface.prototype.constructor = Surface;

// Invalidation Scheme
Surface.invalidations = {
    classes    : 1,
    properties : 2,
    attributes : 4,
    content    : 8,
    transform  : 16,
    size       : 32,
    opacity    : 64,
    origin     : 128,
    events     : 256
};

Surface.toString = function toString() {return SURFACE;};

/**
 * Get the Entity the Surface is a component of.
 *
 * @method getEntity
 *
 * @return {Entity} the Entity the Surface is a component of
 */
Surface.prototype.getEntity = function getEntity() {
    return this._entity;
};

/**
 * Set the options of the Surface.
 *
 * @method setOptions
 * 
 * @param {Object} options object of options
 */
Surface.prototype.setOptions = function setOptions(options) {
    if (options.properties)                         this.setProperties(options.properties);
    if (options.classes)                            this.setClasses(options.classes);
    if (options.attributes)                         this.setAttributes(options.attributes);
    if (options.content || options.content === '')  this.setContent(options.content);
    if (options.size)                               this.setSize(options.size);
};

/**
 * Set the CSS classes to be a new Array of strings.
 *
 * @method setClasses
 * 
 * @param {Array} array of CSS classes
 */
Surface.prototype.setClasses = function setClasses(classList) {
    if (!Array.isArray(classList)) throw new Error("Surface: expects an Array to be passed to setClasses");

    var i = 0;
    var removal = [];

    for (i = 0; i < this.spec.classes.length; i++)
        if (classList.indexOf(this.spec.classes[i]) < 0)
            removal.push(this.spec.classes[i]);

    for (i = 0; i < removal.length; i++)   this.removeClass(removal[i]);
    for (i = 0; i < classList.length; i++) this.addClass(classList[i]);

    this.invalidations |= Surface.invalidations.size;
};

/**
 * Return all of the classes associated with this Surface
 *
 * @method getClasses
 * 
 * @return {Array} array of CSS classes
 */
Surface.prototype.getClasses = function getClasses() {
    return this.spec.classes;
};

/**
 * Add a single class to the Surface's list of classes.
 *   Invalidates the Surface's classes.
 *
 * @method addClass
 * 
 * @param {String} className name of the class
 */
Surface.prototype.addClass = function addClass(className) {
    if (typeof className !== 'string') throw new Error('addClass only takes Strings as parameters');
    if (this.spec.classes.indexOf(className) < 0) {
        this.spec.classes.push(className);
        this.invalidations |= Surface.invalidations.classes;
    }

    this.invalidations |= Surface.invalidations.size;
};

/**
 * Remove a single class from the Surface's list of classes.
 *   Invalidates the Surface's classes.
 * 
 * @method removeClass
 * 
 * @param  {String} className class to remove
 */
Surface.prototype.removeClass = function removeClass(className) {
    if (typeof className !== 'string') throw new Error('addClass only takes Strings as parameters');
    var i = this.spec.classes.indexOf(className);
    if (i >= 0) {
        this.spec.classes.splice(i, 1);
        this.invalidations |= Surface.invalidations.classes;
    }

    this.invalidations |= Surface.invalidations.size;
};

/**
 * Set the CSS properties associated with the Surface.
 *   Invalidates the Surface's properties.
 *
 * @method setProperties
 */
Surface.prototype.setProperties = function setProperties(properties) {
    for (var n in properties) this.spec.properties[n] = properties[n];
    this.invalidations |= Surface.invalidations.size;
    this.invalidations |= Surface.invalidations.properties;
};

/**
 * Return the CSS properties associated with the Surface.
 *
 * @method getProperties
 * 
 * @return {Object} CSS properties associated with the Surface
 */
Surface.prototype.getProperties = function getProperties() {
    return this.spec.properties;
};

/**
 * Set the HTML attributes associated with the Surface.
 *   Invalidates the Surface's attributes.
 *
 * @method setAttributes
 */
Surface.prototype.setAttributes = function setAttributes(attributes) {
    for (var n in attributes) this.spec.attributes[n] = attributes[n];
    this.invalidations |= Surface.invalidations.attributes;
};

/**
 * Return the HTML attributes associated with the Surface.
 *
 * @method getAttributes
 * 
 * @return {Object} HTML attributes associated with the Surface
 */
Surface.prototype.getAttributes = function getAttributes() {
    return this.spec.attributes;
};

/**
 * Set the innerHTML associated with the Surface.
 *   Invalidates the Surface's content.
 *
 * @method setContent
 */
Surface.prototype.setContent = function setContent(content) {
    if (content !== this.spec.content) {
        this.spec.content   = content;
        this.invalidations |= Surface.invalidations.content;
    }
};

/**
 * Return the innerHTML associated with the Surface.
 *
 * @method getContent
 * 
 * @return {String} innerHTML associated with the Surface
 */
Surface.prototype.getContent = function getContent() {
    return this.spec.content;
};

/**
 * Set the size of the Surface.
 *
 * @method setSize
 *
 * @return {Array} 2-dimensional array representing the size of the Surface in pixels.
 */
Surface.prototype.setSize = function setSize(size) {
    var properties = {};
    if (size[0] != null) properties.width = size[0] + 'px';
    if (size[1] != null) properties.height = size[1] + 'px';
    this.setProperties(properties);
};

/**
 * Get the size of the Surface.
 *
 * @method getSize
 *
 * @return {Array} 2-dimensional array representing the size of the Surface in pixels.
 */
Surface.prototype.getSize = function getSize() {
    return this._size;
};

/**
 * Sets the origin of the Surface.
 *
 * @method setOrigin
 * @chainable
 *
 * @param {Number} x origin on the x-axis as a percent
 * @param {Number} y origin on the y-axis as a percent
 */
Surface.prototype.setOrigin  = function setOrigin(x, y) {
    if ((x != null && (x < 0 || x > 1)) || (y != null && (y < 0 || y > 1)))
        throw new Error('Origin must have an x and y value between 0 and 1');

    this.spec.origin[0] = x != null ? x : this.spec.origin[0];
    this.spec.origin[1] = y != null ? y : this.spec.origin[1];
    this.invalidations |= Surface.invalidations.origin;

    return this;
};

/**
 * Gets the origin of the Surface.
 *
 * @method getOrigin
 *
 * @return {Array} 2-dimensional array representing the Surface's origin
 */
Surface.prototype.getOrigin = function getOrigin() {
    return this.spec.origin;
};

/**
 * Resets the invalidations of the Surface
 *
 * @method resetInvalidations
 * @chainable
 *
 * @return {Surface} this
 */
Surface.prototype.resetInvalidations = function() {
    this.invalidations = 0;
    return this;
};

/**
 * Mark all properties as invalidated.
 *
 * @method invalidateAll
 * @chainable
 *
 * @return {Surface} this
 */
Surface.prototype.invalidateAll = function() {
    this.invalidations = 511;
    return this;
};


/**
 * Bind a callback function to an event type handled by this Surface's
 *  EventHandler.
 *
 * @method on
 *
 * @param {string} type event type key (for example, 'click')
 * @param {function(string, Object)} handler callback
 */
Surface.prototype.on = function on(event, cb) {
    if (typeof event === 'string' && cb instanceof Function) {
        this._eventOutput.on(event, cb);
        if (this.spec.events.indexOf(event) < 0) {
            this.spec.events.push(event);
            this.invalidations |= Surface.invalidations.events;
        }
    }
};

/**
 * Remove a function to a particular event occuring.
 *
 * @method  off
 * 
 * @param {String} event name of the event to call the function when occuring
 * @param {Function} cb callback function to be called when the event is recieved.
 */
Surface.prototype.off = function off(event, cb) {
    if (typeof event === 'string' && cb instanceof Function) {
        var index = this.spec.events.indexOf(event);
        if (index > 0) {
            this._eventOutput.removeListener(event, cb);
            this.spec.events.splice(index, 1);
            this.invalidations |= Surface.invalidations.events;
        }
    }
};

/**
 * Add event handler object to the EventHandler's downstream handlers.
 *
 * @method pipe
 *
 * @param {EventHandler} target event handler target object
 * @return {EventHandler} passed event handler
 */
Surface.prototype.pipe = function pipe(target) {
    return this._eventOutput.pipe(target);
};

/**
 * Remove handler object from the EventHandler's downstream handlers.
 *   Undoes work of "pipe".
 *
 * @method unpipe
 *
 * @param {EventHandler} target target handler object
 * @return {EventHandler} provided target
 */
Surface.prototype.unpipe = function unpipe(target) {
    return this._eventOutput.unpipe(target);
};

/**
 * Get the render specification of the Surface.
 *
 * @method  render
 * 
 * @return {Object} render specification
 */
Surface.prototype.render = function() {
    this.spec.invalidations = this.invalidations;
    return this.spec;
};

module.exports = Surface;

},{"../../events/EventHandler":"/Users/ftripier/Code/Games/One/Libraries/MixedMode/src/famous/events/EventHandler.js","../EntityRegistry":"/Users/ftripier/Code/Games/One/Libraries/MixedMode/src/famous/core/EntityRegistry.js","./Target":"/Users/ftripier/Code/Games/One/Libraries/MixedMode/src/famous/core/Components/Target.js"}],"/Users/ftripier/Code/Games/One/Libraries/MixedMode/src/famous/core/Components/Target.js":[function(require,module,exports){
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Owners: dan@famo.us
 *
 * @license MPL 2.0
 * @copyright Famous Industries, Inc. 2014
 */

'use strict';

var MatrixMath = require('../../math/4x4matrix');

/**
 * Target is the base class for all renderables.  It holds the state of
 *   its verticies, the Containers it is deployed in, the Context it belongs
 *   to, and whether or not origin alignment needs to be applied.
 *
 * @component Target
 * @constructor
 *
 * @param {Entity} entity  Entity that the Target is a component of
 * @param {Object} options options
 */
function Target(entity, options) {
    this.verticies  = options.verticies || [];
    this.containers = {};
    // this.context    = entity.getContext()._id;
    this._hasOrigin = false;
}

/**
 * Get the verticies of the Target.
 *
 * @method getVerticies
 *
 * @return {Array} array of the verticies represented as three element arrays [x, y, z]
 */
Target.prototype.getVerticies = function getVerticies(){
    return this.verticies;
};

/**
 * Determines whether a Target was deployed to a particular container
 *
 * @method _isWithin
 *
 * @param {Number} the id of the Container's Entity
 * @return {Boolean} whether or now the Target was deployed to this particular Container
 */
Target.prototype._isWithin = function _isWithin(container) {
    return this.containers[container._id];
};

/**
 * Mark a Container as having a deployed instance of the Target
 *
 * @method _addToContainer
 *
 * @param {Number} the id of the Container's Entity
 * @return {Boolean} staus of the addition
 */
Target.prototype._addToContainer = function _addToContainer(container) {
    this.containers[container._id] = true;
    return true;
};

/**
 * Unmark a Container as having a deployed instance of the Target
 *
 * @method _removeFromContainer
 *
 * @param {Number} the id of the Container's Entity
 * @return {Boolean} staus of the removal
 */
Target.prototype._removeFromContainer = function _removeFromContainer(container) {
    this.containers[container._id] = false;
    return true;
};

module.exports = Target;

},{"../../math/4x4matrix":"/Users/ftripier/Code/Games/One/Libraries/MixedMode/src/famous/math/4x4matrix.js"}],"/Users/ftripier/Code/Games/One/Libraries/MixedMode/src/famous/core/Components/Transform.js":[function(require,module,exports){
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Owners: dan@famo.us
 *         felix@famo.us
 *         mike@famo.us
 * @license MPL 2.0
 * @copyright Famous Industries, Inc. 2014
 */

'use strict';

var EventEmitter = require('../../events/EventEmitter');

// CONSTS
var IDENTITY = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);

// Functions to be run when an index is marked as invalidated
var VALIDATORS = [
    function validate0(parent, vectors, memory) {
        return parent[0] * (memory[2] * memory[4]) * vectors.scale[0] + parent[4] * (memory[0] * memory[5] + memory[1] * memory[3] * memory[4]) * vectors.scale[0] + parent[8] * (memory[1] * memory[5] - memory[0] * memory[3] * memory[4]) * vectors.scale[0];
    },
    function validate1(parent, vectors, memory) {
        return parent[1] * (memory[2] * memory[4]) * vectors.scale[0] + parent[5] * (memory[0] * memory[5] + memory[1] * memory[3] * memory[4]) * vectors.scale[0] + parent[9] * (memory[1] * memory[5] - memory[0] * memory[3] * memory[4]) * vectors.scale[0];
    },
    function validate2(parent, vectors, memory) {
        return parent[2] * (memory[2] * memory[4]) * vectors.scale[0] + parent[6] * (memory[0] * memory[5] + memory[1] * memory[3] * memory[4]) * vectors.scale[0] + parent[10] * (memory[1] * memory[5] - memory[0] * memory[3] * memory[4]) * vectors.scale[0];
    },
    function validate3(parent, vectors, memory) {
        return parent[3] * (memory[2] * memory[4]) * vectors.scale[0] + parent[7] * (memory[0] * memory[5] + memory[1] * memory[3] * memory[4]) * vectors.scale[0] + parent[11] * (memory[1] * memory[5] - memory[0] * memory[3] * memory[4]) * vectors.scale[0];
    },
    function validate4(parent, vectors, memory) {
        return parent[0] * (-memory[2] * memory[5]) * vectors.scale[1] + parent[4] * (memory[0] * memory[4] - memory[1] * memory[3] * memory[5]) * vectors.scale[1] + parent[8] * (memory[1] * memory[4] + memory[0] * memory[3] * memory[5]) * vectors.scale[1];
    },
    function validate5(parent, vectors, memory) {
        return parent[1] * (-memory[2] * memory[5]) * vectors.scale[1] + parent[5] * (memory[0] * memory[4] - memory[1] * memory[3] * memory[5]) * vectors.scale[1] + parent[9] * (memory[1] * memory[4] + memory[0] * memory[3] * memory[5]) * vectors.scale[1];
    },
    function validate6(parent, vectors, memory) {
        return parent[2] * (-memory[2] * memory[5]) * vectors.scale[1] + parent[6] * (memory[0] * memory[4] - memory[1] * memory[3] * memory[5]) * vectors.scale[1] + parent[10] * (memory[1] * memory[4] + memory[0] * memory[3] * memory[5]) * vectors.scale[1];
    },
    function validate7(parent, vectors, memory) {
        return parent[3] * (-memory[2] * memory[5]) * vectors.scale[1] + parent[7] * (memory[0] * memory[4] - memory[1] * memory[3] * memory[5]) * vectors.scale[1] + parent[11] * (memory[1] * memory[4] + memory[0] * memory[3] * memory[5]) * vectors.scale[1];
    },
    function validate8(parent, vectors, memory) {
        return parent[0] * (memory[3]) * vectors.scale[2] + parent[4] * (-memory[1] * memory[2]) * vectors.scale[2] + parent[8] * (memory[0] * memory[2]) * vectors.scale[2];
    },
    function validate9(parent, vectors, memory) {
        return parent[1] * (memory[3]) * vectors.scale[2] + parent[5] * (-memory[1] * memory[2]) * vectors.scale[2] + parent[9] * (memory[0] * memory[2]) * vectors.scale[2];
    },
    function validate10(parent, vectors, memory) {
        return parent[2] * (memory[3]) * vectors.scale[2] + parent[6] * (-memory[1] * memory[2]) * vectors.scale[2] + parent[10] * (memory[0] * memory[2]) * vectors.scale[2];
    },
    function validate11(parent, vectors, memory) {
        return parent[3] * (memory[3]) * vectors.scale[2] + parent[7] * (-memory[1] * memory[2]) * vectors.scale[2] + parent[11] * (memory[0] * memory[2]) * vectors.scale[2];
    },
    function validate12(parent, vectors, memory) {
        return parent[0] * vectors.translation[0] + parent[4] * vectors.translation[1] + parent[8] * vectors.translation[2] + parent[12];
    },
    function validate13(parent, vectors, memory) {
        return parent[1] * vectors.translation[0] + parent[5] * vectors.translation[1] + parent[9] * vectors.translation[2] + parent[13];
    },
    function validate14(parent, vectors, memory) {
        return parent[2] * vectors.translation[0] + parent[6] * vectors.translation[1] + parent[10] * vectors.translation[2] + parent[14];
    },
    function validate15(parent, vectors, memory) {
        return parent[3] * vectors.translation[0] + parent[7] * vectors.translation[1] + parent[11] * vectors.translation[2] + parent[15];
    }
];

// Map of invalidation numbers
var DEPENDENTS = {
    global : [4369,8738,17476,34952,4369,8738,17476,34952,4369,8738,17476,34952,4096,8192,16384,32768],
    local  : {
        translation : [61440,61440,61440],
        rotation    : [4095,4095,255],
        scale       : [4095,4095,4095],
    }
};

/**
 * Transform is a component that is part of every Entity.  It is
 *   responsible for updating it's own notion of position in space and
 *   incorporating that with parent information.
 *
 * @class Transform
 * @component
 * @constructor
 */
function Transform() {
    this._matrix   = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
    this._memory   = new Float32Array([1, 0, 1, 0, 1, 0]);
    this._vectors  = {
        translation : new Float32Array([0, 0, 0]),
        rotation    : new Float32Array([0, 0, 0]),
        scale       : new Float32Array([1, 1, 1])
    };
    this._IO       = new EventEmitter();
    this._updateFN = null;
    this._mutator  = {
        translate      : this.translate.bind(this),
        rotate         : this.rotate.bind(this),
        scale          : this.scale.bind(this),
        setTranslation : this.setTranslation.bind(this),
        setRotation    : this.setRotation.bind(this),
        setScale       : this.setScale.bind(this)
    };
    this._invalidated = 0;
}

/**
 * Return the transform matrix that represents this Transform's values 
 *   being applied to it's parent's global transform.
 *
 * @method getGlobalMatrix
 * 
 * @return {Float32 Array} representation of this Transform being applied to it's parent
 */
Transform.prototype.getGlobalMatrix = function getGlobalMatrix() {
    return this._matrix;
};

/**
 * Return the vectorized information for this Transform's local
 *   transform.
 *
 * @method getLocalVectors
 * 
 * @return {Object} object with translate, rotate, and scale keys
 */
Transform.prototype.getLocalVectors = function getVectors() {
    return this._vectors;
};

/**
 * Define the provider of state for the Transform.
 *
 * @method updateFrom
 * @chainable
 * 
 * @param  {Function} provider source of state for the Transform
 */
Transform.prototype.updateFrom = function updateFrom(provider) {
    if (provider instanceof Function || !provider) this._updateFN = provider;
    return this;
};

/**
 * Updates the local invalidation scheme based on parent information
 *
 * @method _invalidateFromParent
 * @private
 * 
 * @param  {Number} parentReport parent's invalidation
 */
function _invalidateFromParent(parentReport) {
    var counter = 0;
    while (parentReport) {
        if (parentReport & 1) this._invalidated |= DEPENDENTS.global[counter];
        counter++;
        parentReport >>>= 1;
    }
}

/**
 * Update the global matrix based on local and parent invalidations.
 *
 * @method  _update
 * @private
 * 
 * @param  {Number} parentReport invalidations associated with the parent matrix
 * @param  {Array} parentMatrix parent transform matrix as an Array
 * @return {Number} invalidation scheme
 */
Transform.prototype._update = function _update(parentReport, parentMatrix) {
    if (parentReport)  _invalidateFromParent.call(this, parentReport);
    if (!parentMatrix) parentMatrix = IDENTITY;
    if (this._updateFN) this._updateFN(this._mutator);
    var update;
    var counter     = 0;
    var invalidated = this._invalidated;

    // Based on invalidations update only the needed indicies
    while (this._invalidated) {
        if (this._invalidated & 1) {
            update = VALIDATORS[counter](parentMatrix, this._vectors, this._memory);
            if (update !== this._matrix[counter])
                this._matrix[counter] = update;
            else
                invalidated &= ((1 << 16) - 1) ^ (1 << counter);
        }

        counter++;
        this._invalidated >>>= 1;
    }

    if (invalidated) this._IO.emit('invalidated', invalidated);
    return invalidated;
};

/**
 * Add extra translation to the current values.  Invalidates
 *   translation as needed.
 *
 * @method translate
 *   
 * @param  {Number} x translation along the x-axis in pixels
 * @param  {Number} y translation along the y-axis in pixels
 * @param  {Number} z translation along the z-axis in pixels
 */
Transform.prototype.translate = function translate(x, y, z) {
    var translation = this._vectors.translation;
    var dirty       = false;
    var size;

    if (x) {
        translation[0] += x;
        dirty           = true;
    }

    if (y) {
        translation[1] += y;
        dirty           = true;
    }

    if (z) {
        translation[2] += z;
        // dirty           = true;
    }

    if (dirty) this._invalidated |= 61440;
};

/**
 * Add extra rotation to the current values.  Invalidates
 *   rotation as needed.
 *
 * @method rotate
 *   
 * @param  {Number} x rotation about the x-axis in radians
 * @param  {Number} y rotation about the y-axis in radians
 * @param  {Number} z rotation about the z-axis in radians
 */
Transform.prototype.rotate = function rotate(x, y, z) {
    var rotation = this._vectors.rotation;
    this.setRotation((x ? x : 0) + rotation[0], (y ? y : 0) + rotation[1], (z ? z : 0) + rotation[2]);
};

/**
 * Add extra scale to the current values.  Invalidates
 *   scale as needed.
 *
 * @method scale
 *   
 * @param  {Number} x scale along the x-axis as a percent
 * @param  {Number} y scale along the y-axis as a percent
 * @param  {Number} z scale along the z-axis as a percent
 */
Transform.prototype.scale = function scale(x, y, z) {
    var scaleVector = this._vectors.scale;
    var dirty       = false;

    if (x) {
        scaleVector[0] += x;
        dirty     = dirty || true;
    }

    if (y) {
        scaleVector[1] += y;
        dirty     = dirty || true;
    }

    if (z) {
        scaleVector[2] += z;
        dirty     = dirty || true;
    }

    if (dirty) this._invalidated |= 4095;
};

/**
 * Absolute set of the Transform's translation.  Invalidates
 *   translation as needed.
 *
 * @method setTranslation
 * 
 * @param  {Number} x translation along the x-axis in pixels
 * @param  {Number} y translation along the y-axis in pixels
 * @param  {Number} z translation along the z-axis in pixels
 */
Transform.prototype.setTranslation = function setTranslation(x, y, z) {
    var translation = this._vectors.translation;
    var dirty       = false;
    var size;

    if (x !== translation[0] && x != null) {
        translation[0] = x;
        dirty          = dirty || true;
    }

    if (y !== translation[1] && y != null) {
        translation[1] = y;
        dirty          = dirty || true;
    }

    if (z !== translation[2] && z != null) {
        translation[2] = z;
        dirty          = dirty || true;
    }

    if (dirty) this._invalidated |= 61440;
};

/**
 * Absolute set of the Transform's rotation.  Invalidates
 *   rotation as needed.
 *
 * @method setRotate
 *   
 * @param  {Number} x rotation about the x-axis in radians
 * @param  {Number} y rotation about the y-axis in radians
 * @param  {Number} z rotation about the z-axis in radians
 */
Transform.prototype.setRotation = function setRotation(x, y, z) {
    var rotation = this._vectors.rotation;
    var dirty    = false;

    if (x !== rotation[0] && x != null) {
        rotation[0]     = x;
        this._memory[0] = Math.cos(x);
        this._memory[1] = Math.sin(x);
        dirty           = dirty || true;
    }

    if (y !== rotation[1] && y != null) {
        rotation[1]     = y;
        this._memory[2] = Math.cos(y);
        this._memory[3] = Math.sin(y);
        dirty           = dirty || true;
    }

    if (z !== rotation[2] && z != null) {
        rotation[2]        = z;
        this._memory[4]    = Math.cos(z);
        this._memory[5]    = Math.sin(z);
        this._invalidated |= 255;
    }

    if (dirty) this._invalidated |= 4095;
};

/**
 * Absolute set of the Transform's scale.  Invalidates
 *   scale as needed.
 *
 * @method setScale
 *   
 * @param  {Number} x scale along the x-axis as a percent
 * @param  {Number} y scale along the y-axis as a percent
 * @param  {Number} z scale along the z-axis as a percent
 */
Transform.prototype.setScale = function setScale(x, y, z) {
    var scale = this._vectors.scale;
    var dirty = false;

    if (x !== scale[0]) {
        scale[0] = x;
        dirty    = dirty || true;
    }

    if (y !== scale[1]) {
        scale[1] = y;
        dirty    = dirty || true;
    }

    if (z !== scale[2]) {
        scale[2] = z;
        dirty    = dirty || true;
    }

    if (dirty) this._invalidated |= 4095;
};

/**
 * Register functions to be called on the Transform's events.
 *
 * @method on
 * @chainable
 *
 */
Transform.prototype.on = function on() {
    this._IO.on.apply(this._IO, arguments);
    return this;
};

module.exports = Transform;

},{"../../events/EventEmitter":"/Users/ftripier/Code/Games/One/Libraries/MixedMode/src/famous/events/EventEmitter.js"}],"/Users/ftripier/Code/Games/One/Libraries/MixedMode/src/famous/core/Context.js":[function(require,module,exports){
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Owners: dan@famo.us
 *         felix@famo.us
 *         mike@famo.us
 *
 * @license MPL 2.0
 * @copyright Famous Industries, Inc. 2014
 */

'use strict';

var Entity         = require('./Entity');
var EntityRegistry = require('./EntityRegistry');
var Container      = require('./Components/Container');
var Camera         = require('./Components/Camera');

/**
 * Context is the definition of world space for that part of the scene graph.
 *   A context can either have a Container or not.  Having a container means
 *   that parts of the scene graph can be drawn inside of it.  If it does not
 *   have a Container then the Context is only responsible for defining world
 *   space.  The CoreSystem will start at each Context and recursive down
 *   through their children to update each entitiy's Transform, Size,
 *   and Opacity.
 *
 * @class Context
 * @entity
 * @constructor
 *   
 * @param {Object} options the starting options for the Context
 * @param {Array} options.transform the starting transform matrix
 * @param {Array} options.size the starting size
 * @param {Boolean} options.hasContainer whether or not the Context has a Container
 * @param {Boolean} options.hasCamera whether or not the Context has a Camera
 */
function Context(options) {
    if (!options || typeof options !== 'object' || (!options.size && !options.parentEl && !options.container)) throw new Error('Context, must be called with an option hash that at least has a size or a parentEl or a container property');
    Entity.call(this);
    EntityRegistry.register(this, 'Contexts');
    this._parentEl = options.parentEl;
    this._size     = _getSize(options);
    this._components.transform._update((1 << 16) - 1, options.transform);
    if (options.hasContainer !== false) this._components.container = new Container(this, options);
    if (options.hasCamera    !== false) this._components.camera    = new Camera(this, options);
}

/**
 * A method for determining what the size of the Context is.
 *  Will be the user defined size if one was provided otherwise it
 *  will default to the DOM representation.  
 *
 * @method _getSize
 * @private
 * 
 * @param  {Object} options starting options for the sizes
 * @return {Array} size of the Context
 */
function _getSize(options) {
    if (options.size)      return options.size;
    if (options.container) return [options.container.offsetWidth, options.container.offsetHeight, 0];
    return [options.parentEl.offsetWidth, options.parentEl.offsetHeight, 0];
}

Context.prototype                     = Object.create(Entity.prototype);
Context.prototype.constructor         = Context;
Context.prototype.update              = null;
Context.prototype.registerComponent   = null;
Context.prototype.deregisterComponent = null;
Context.prototype.addComponent        = null;
Context.prototype.removeComponent     = null;

module.exports = Context;

},{"./Components/Camera":"/Users/ftripier/Code/Games/One/Libraries/MixedMode/src/famous/core/Components/Camera.js","./Components/Container":"/Users/ftripier/Code/Games/One/Libraries/MixedMode/src/famous/core/Components/Container.js","./Entity":"/Users/ftripier/Code/Games/One/Libraries/MixedMode/src/famous/core/Entity.js","./EntityRegistry":"/Users/ftripier/Code/Games/One/Libraries/MixedMode/src/famous/core/EntityRegistry.js"}],"/Users/ftripier/Code/Games/One/Libraries/MixedMode/src/famous/core/Engine.js":[function(require,module,exports){
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Owners: dan@famo.us
 *         felix@famo.us
 *         mike@famo.us
 *         
 * @license MPL 2.0
 * @copyright Famous Industries, Inc. 2014
 */

'use strict';

var CoreSystem     = require('./Systems/CoreSystem'),
    OptionsManager = require('./OptionsManager'),
    DOMrenderer    = require('./Renderers/DOMrenderer'),
    GLrenderer     = require('./Renderers/WebGLRenderer'),
    RenderSystem   = require('./Systems/RenderSystem'),
    BehaviorSystem = require('./Systems/BehaviorSystem'),
    TimeSystem     = require('./Systems/TimeSystem'),
    LiftSystem     = require('../transitions/LiftSystem'),
    Context        = require('./Context');

require('./Stylesheet/famous.css');

var options = {
    loop      : true,
    direction : 1,
    speed     : 1,
    rendering : {
        renderers: {
            DOM: DOMrenderer,
            GL: GLrenderer
        }
    }
};

// TODO: what is this doing here?
document.ontouchmove = function(event){
    event.preventDefault();
};

// State
var LOOP                 = 'loop',
    RENDERING            = 'rendering',
    optionsManager       = new OptionsManager(options),
    systems              = [RenderSystem, BehaviorSystem, LiftSystem, CoreSystem, TimeSystem], // We're going backwards
    currentRelativeFrame = 0,
    currentAbsoluteFrame = 0;

function setRenderers(renderers) {
    for (var key in renderers) {
        RenderSystem.register(key, renderers[key]);
    }
}

setRenderers(options.rendering.renderers);

optionsManager.on('change', function(data) {
    if (data.id === LOOP) {
        if (data.value) {
            requestAnimationFrame(Engine.loop);
        }
    }
    if (data.id === RENDERING) {
        setRenderers(data.value.renderers);
    }
});

/**
 * The singleton object initiated upon process
 *   startup which manages all active Systems and acts as a
 *   factory for new Contexts/
 *
 *   On static initialization, window.requestAnimationFrame is called with
 *     the event loop function.
 *     
 * @class Engine
 * @singleton
 */
var Engine = {};

/**
 * Calls update on each of the currently registered systems.
 * 
 * @method step
 */
Engine.step = function step() {
    currentRelativeFrame += options.direction * options.speed;
    currentAbsoluteFrame++;
    var i = systems.length;
    while (i--) systems[i].update(currentRelativeFrame, currentAbsoluteFrame);// I told you so
    return this;
};

/**
 * A wrapper around requestAnimationFrame that will step 
 * 
 * @method loop
 */
Engine.loop = function loop() {
    if (options.loop) {
        Engine.step();
        requestAnimationFrame(Engine.loop);
    }
    return this;
};

function _loopFor(value) {
    return function() {
        if (value) {
            Engine.step();
            requestAnimationFrame(_loopFor(value - 1));
        }
    };
}

Engine.loopFor = function loopFor(value) {
    requestAnimationFrame(_loopFor(value));
    return this;
};

/**
 * A wrapper for the "DOMContentLoaded" event.  Will execute
 *   a given function once the DOM have been loaded.
 *
 * @method ready
 * 
 * @param  {Function} fn Function to be called after DOM loading
 */
Engine.ready = function ready(fn) {
    var listener = function() {
        document.removeEventListener('DOMContentLoaded', listener);
        fn();
    };
    document.addEventListener('DOMContentLoaded', listener);
    return this;
};

/**
 * Will create a brand new Context.  IF a parent element is not provided,
 *   it is assumed to be the body of the document.
 *
 * @method createContext
 * 
 * @param  {Object} options Options for the Context
 * @return {Context} new Context instance
 */
Engine.createContext = function createContext(options) {
    if (typeof options === 'string') {
        var elem = document.querySelector(options);
        if (!(elem instanceof HTMLElement)) throw new Error('the passed in string should be a query selector which returns an element from the dom');
        else                                return new Context({parentEl: elem});
    }

    if (options instanceof HTMLElement)
        return new Context({parentEl: options});

    if (!options)
        return new Context({parentEl: document.body}); // TODO it should be possible to delay assigning document.body until this hits the render stage. This would remove the need for Engine.ready

    if (!options.parentEl && !options.container)
        options.parentEl = document.body;

    return new Context(options);
};

/**
 * Adds a system to the list of systems to update on a per frame basis
 *
 * @method addSystem
 * 
 * @param {System} system System to get run every frame
 */
Engine.addSystem = function addSystem(system) {
    if (system instanceof Object && system.update instanceof Function)
        return systems.splice(systems.indexOf(RenderSystem) + 1, 0, system);
    else throw new Error('systems must be an object with an update method');
};

/**
 * Removes a system from the list of systems to update on a per frame basis
 *
 * @method removeSystem
 * 
 * @param {System} system System to get run every frame
 */
Engine.removeSystem = function removeSystem(system) {
    if (system instanceof Object && system.update instanceof Function) {
        var index = systems.indexOf(system);
        if (index === -1) return false;
        systems.splice(index, 1);
        return true;
    } else throw new Error('systems must be an object with an update method');
};

/**
 * Delegate to the optionsManager.
 *
 * @method setOptions
 * 
 * @param {Object} options Options to patch
 */
Engine.setOptions = optionsManager.setOptions.bind(optionsManager);

/**
 * Set the direction of the flow of time.
 *
 * @method setDirection
 * 
 * @param {Number} val direction as -1 or 1
 */
Engine.setDirection = function setDirection(val) {
    if (val !== 1 && val !== -1) throw new Error('direction must be either 1 for forward or -1 for reverse');
    optionsManager.set('direction', val);
    return this;
};

/**
 * Get the direction of the flow of time.
 *
 * @method getDirection
 * 
 * @return {Number} direction as -1 or 1
 */
Engine.getDirection = function getDirection() {
    return options.direction;
};

/**
 * Set the speed of time.
 *
 * @method setSpeed
 * 
 * @param {Number} val ratio to human time
 */
Engine.setSpeed = function setSpeed(val) {
    if (typeof val !== 'number') throw new Error('speed must be a number, used as a scale factor for the movement of time');
    optionsManager.set('speed', val);
    return this;
};

/**
 * Get the speed of time.
 *
 * @method getSpeed
 * 
 * @return {Number} val ratio to human time
 */
Engine.getSpeed = function getSpeed() {
    return options.speed;
};

/**
 * Get the current frame
 *
 * @method getAbsoluteFrame
 *
 * @return {Number} the current frame number
 */
Engine.getAbsoluteFrame = function getAbsoluteFrame() {
    return currentAbsoluteFrame;
};

/**
 * Get the current frame taking into account engine speed and direction
 *
 * @method getRelativeFrame
 *
 * @return {Number} the current frame number taking into account Engine speed and direction
 */
Engine.getRelativeFrame = function getRelativeFrame() {
    return currentRelativeFrame;
};

module.exports = Engine;

//Start the loop
Engine.ready(Engine.loop);

},{"../transitions/LiftSystem":"/Users/ftripier/Code/Games/One/Libraries/MixedMode/src/famous/transitions/LiftSystem.js","./Context":"/Users/ftripier/Code/Games/One/Libraries/MixedMode/src/famous/core/Context.js","./OptionsManager":"/Users/ftripier/Code/Games/One/Libraries/MixedMode/src/famous/core/OptionsManager.js","./Renderers/DOMrenderer":"/Users/ftripier/Code/Games/One/Libraries/MixedMode/src/famous/core/Renderers/DOMrenderer.js","./Renderers/WebGLRenderer":"/Users/ftripier/Code/Games/One/Libraries/MixedMode/src/famous/core/Renderers/WebGLRenderer.js","./Stylesheet/famous.css":"/Users/ftripier/Code/Games/One/Libraries/MixedMode/src/famous/core/Stylesheet/famous.css","./Systems/BehaviorSystem":"/Users/ftripier/Code/Games/One/Libraries/MixedMode/src/famous/core/Systems/BehaviorSystem.js","./Systems/CoreSystem":"/Users/ftripier/Code/Games/One/Libraries/MixedMode/src/famous/core/Systems/CoreSystem.js","./Systems/RenderSystem":"/Users/ftripier/Code/Games/One/Libraries/MixedMode/src/famous/core/Systems/RenderSystem.js","./Systems/TimeSystem":"/Users/ftripier/Code/Games/One/Libraries/MixedMode/src/famous/core/Systems/TimeSystem.js"}],"/Users/ftripier/Code/Games/One/Libraries/MixedMode/src/famous/core/Entity.js":[function(require,module,exports){
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Owners: dan@famo.us
 *         felix@famo.us
 *         mike@famo.us
 *         
 * @license MPL 2.0
 * @copyright Famous Industries, Inc. 2014
 */

'use strict';

var EntityRegistry = require('./EntityRegistry'),
    Transform      = require('./Components/Transform');

/**
 * Entity is the core of the Famo.us scene graph.  The scene graph
 *   is constructed by adding Entitys to other Entities to define heirarchy.
 *   Each Entity comes with a Transform component with the
 *   ability to add infinite other components.  It also acts as a factory by creating
 *   new Entities that will already be considered it's children.
 *
 * @class Entity
 * @entity
 * @constructor
 */
function Entity() {
    var id = EntityRegistry.register(this, 'CoreSystem');

    this._components = { transform : new Transform(this) };
    this._behaviors = [];

    this._parent   = null;
    this._children = [];
}

/**
 * Adds a new instance of a component to the Entity.
 *
 * @method  registerComponent
 * 
 * @param  {Function} Constructor constructor function for a component
 * @param  {Object} options options to be passed into the constructor
 * @return {Object} instance of the instantitated component
 */

Entity.prototype.registerComponent = function registerComponent(Constructor, options) {
    if (!Constructor || !(Constructor instanceof Function)) throw new Error('The first argument to .registerComponent must be a component Constructor function');
    if (!Constructor.toString)                              throw new Error('The passed-in component Constructor must have a "toString" method.');

    var component = new Constructor(this, options);
    if (component.update) this._behaviors.push(Constructor.toString());
    this._components[Constructor.toString()] = component;
    return component;
};

/**
 * Alias for registerComponent
 * 
 * @method addComponent
 */
Entity.prototype.addComponent = Entity.prototype.registerComponent;

/**
 * Removes a component from the Entity.
 *
 * @method deregisterComponent
 * 
 * @param  {String} type id of the component
 * @return {Boolean} status of the removal
 */
Entity.prototype.deregisterComponent = function deregisterComponent(type) {
    if (typeof type !== 'string') throw new Error('Entity.deregisterComponent must be passed a String as the first parameter');
    if (this._components[type] === undefined || this._components[type] === null) throw new Error('no component of that type');

    this._components[type].cleanup && this._components[type].cleanup();
    this._components[type] = null;

    var behaviorIndex = this._behaviors.indexOf(type);
    if (behaviorIndex > -1)
        this._behaviors.splice(behaviorIndex, 1);

    return true;
};

/**
 * Alias for deregisterComponent
 * 
 * @method removeComponent
 */
Entity.prototype.removeComponent = Entity.prototype.deregisterComponent;

/**
 * Find out if the Entity has a component of a certain name.
 *
 * @method hasComponent
 * 
 * @param  {String} type name of the component
 * @return {Boolean} existance of a component by that name
 */
Entity.prototype.hasComponent = function hasComponent(type) {
    return this._components[type] != null;
};

/**
 * Get a component by name
 *
 * @method getComponent
 * 
 * @param  {String} type name of the component
 * @return {Object} component instance
 */
Entity.prototype.getComponent = function getComponent(type) {
    return this._components[type];
};

/**
 * Get all of the Entity's components
 *
 * @method getAllComponents
 * 
 * @return {Object} Hash of all of the components indexed by name 
 */
Entity.prototype.getAllComponents = function getAllComponents() {
    return this._components;
};

/**
 * Get all of the child nodes in the scene graph
 *
 * @method  getChildren
 * 
 * @return {Array} child entities
 */
Entity.prototype.getChildren = function getChildren() {
    return this._children;
};

/**
 * Get the context of the node.
 *
 * @method getContext
 *
 * @return Context Node
 */
Entity.prototype.getContext = function getContext() {
    var node = this;
    while (node._parent) node = node._parent;
    if (!node._size) return null;
    else             return node;
};

/**
 * Add a new Entity as a child and return it.
 *
 * @method addChild
 *
 * @return {Entity} child Entity
 */
Entity.prototype.addChild = function addChild(entity) {
    if (entity != null && !(entity instanceof Entity)) throw new Error('Only Entities can be added as children of other entities');
    if (entity) {
        if (this._children.indexOf(entity) > -1) return void 0;
        if (entity._parent != null) entity._parent.detatchChild(entity);
        entity._parent = this;
        this._children.push(entity);
        return entity;
    } else {
        var node     = new Entity();
        node._parent = this;
        this._children.push(node);
        return node;
    }
};

/**
 * Remove a Entity's child.
 *
 * @method detatchChild
 *
 * @return {Entity|void 0} child Entity or void 0 if it is not a child
 */
Entity.prototype.detatchChild = function detatchChild(node) {
    if (!(node instanceof Entity)) throw new Error('Entity.detatchChild only takes in Entities as the parameter');
    var index = this._children.indexOf(node);
    if (index >= 0) {
        var child     = this._children.splice(index, 1)[0];
        child._parent = null;
        return child;
    } else return void 0;
};

/**
 * Remove this Entity from the EntityRegistry
 *
 * @method cleanup
 */
Entity.prototype.cleanup = function cleanup() {
    EntityRegistry.cleanup(this);
};

/**
 * Update all of the custom components on the Entity
 * 
 * @method update
 */
Entity.prototype.update = function update() {
    var i = this._behaviors.length;

    while (i--)
        this._components[this._behaviors[i]].update(this);
};

module.exports = Entity;

},{"./Components/Transform":"/Users/ftripier/Code/Games/One/Libraries/MixedMode/src/famous/core/Components/Transform.js","./EntityRegistry":"/Users/ftripier/Code/Games/One/Libraries/MixedMode/src/famous/core/EntityRegistry.js"}],"/Users/ftripier/Code/Games/One/Libraries/MixedMode/src/famous/core/EntityRegistry.js":[function(require,module,exports){
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Owners: dan@famo.us
 *         felix@famo.us
 *         mike@famo.us
 *
 * @license MPL 2.0
 * @copyright Famous Industries, Inc. 2014
 */

'use strict';

var Layer = require('./Layer');

// Map of an Entity's position in a layer
var entities = [];

// Storage of Entity arrays
var layers = {
    everything: new Layer()
};

// Pool of free spaces in the entites array
var freed = [];

/**
 * A singleton object that manages the Entity reference system.
 *   Entities can be part of many layers depending on implementation.
 *   
 * @class EntityRegistry
 * @singleton
 */
var EntityRegistry = {};

/**
 * Adds a new layer key to the layers object.
 *
 * @method  addLayer
 * 
 * @param {String} layer name of the layer
 * @return {Array} the array of entities in the specified layer
 */
EntityRegistry.addLayer = function addLayer(layer) {
    if (!layer)                    throw new Error('.addLayer needs to have a layer specified');
    if (typeof layer !== 'string') throw new Error('.addLayer can only take a string as an argument');
    if (!layers[layer]) layers[layer] = new Layer();
    return layers[layer];
};

/**
 * Get the array of entities in a particular layer.
 *
 * @method  getLayer
 * 
 * @param {String} layer name of the layer
 * @return {Array} the array of entities in the specified layer
 */
EntityRegistry.getLayer = function getLayer(layer) {
    return layers[layer];
};

/**
 * Removes a particular layer from the registry
 *
 * @method  removeLayer
 * 
 * @param {String} layer name of the layer to remove
 * @return {Array} the array of entities in the specified layer
 */
EntityRegistry.removeLayer = function removeLayer(layer) {
    if (!layer)                    throw new Error('.removeLayer needs to have a layer specified');
    if (typeof layer !== 'string') throw new Error('.removeLayer can only take a string as an argument');

    var currLayer = layers[layer];
    if (!currLayer) return false;

    var i = currLayer.length;
    while (i--) delete entities[currLayer.get(i)._id][layer];

    delete layers[layer];
    return currLayer;
};

/**
 * Adds an entity to a particular layer.
 *
 * @method  register
 * 
 * @param  {Entity} instance of an Entity
 * @param  {String} layer name of the layer to register the entity to
 * @return {Number} id of the Entity
 */
EntityRegistry.register = function register(entity, layer) {
    var idMap;
    if (entity._id == null) {
        Object.defineProperty(entity, '_id', {
            value        : EntityRegistry.getNewID(),
            configurable : false
        });
    }

    var id = entity._id;
    if (entities[id]) {
        idMap = entities[id];
    }
    else {
        idMap = {everything: layers.everything.length};
        layers.everything.push(entity);
    }

    if (layer) {
        if (!layers[layer]) EntityRegistry.addLayer(layer);
        idMap[layer] = layers[layer].length;
        layers[layer].push(entity);
    }

    if (!entities[id]) entities[id] = idMap;
    return id; //TODO: DO WE NEED TO RETURN ANYMORE?
};

/**
 * Removes an entity from a layer
 *
 * @method  deregister
 * 
 * @param  {Entity} entity instance of an Entity
 * @param  {String} layer name of layer to remove the Entity from
 * @return {Booleam} status of the removal
 */
EntityRegistry.deregister = function deregister(entity, layer) {
    var currentEntity;
    var position = entities[entity._id][layer];
    if (position === undefined) return false;
    entities[entity._id][layer] = null;
    layers[layer].remove(entity);

    var currentEntity;
    for (var i = 0; i < entities.length; i++) {
        currentEntity = entities[i];

        if (currentEntity && currentEntity[layer] > position) currentEntity[layer]--;
    }

    return true;
};

/**
 * Get the id map of the Entity.  Each Entity has an object that
 *   defined the indicies of where it is in each layer.
 *
 * @method  get
 * 
 * @param  {Number} id ID of the Entity
 * @return {Object} id map of the Entity's index in each layer
 */
EntityRegistry.get = function get(id) {
    return entities[id];
};

/**
 * Find out if a given entity exists and a specified layer.
 *
 * @method  inLayer
 * 
 * @param  {Entity} entity Entity instance
 * @param  {String} layer name of the layer
 * @return {Boolean} whether or not the Entity is in a given layer
 */
EntityRegistry.inLayer = function inLayer(entity, layer) {
    return entities[entity._id][layer] !== undefined;
};

//potentially memory unsafe - getting an id isn't necessarily coupled with a registration
/**
 * Get a unique ID for an Entity
 *
 * @method  getNewID
 * 
 * @return {Number} ID for an Entity
 */
EntityRegistry.getNewID = function getNewID() {
    if(freed.length) return freed.pop();
    else return entities.length;
};

/**
 * Remove an entity and all references to it.
 *
 * @method cleanup
 * 
 * @param  {Entity} entity Entity instance to remove
 * @return {Number} ID of the Entity that was removed
 */
EntityRegistry.cleanup = function cleanup(entity) {
    var currentEntity;
    var idMap            = entities[entity._id];
    entities[entity._id] = null;

    for (var i = 0; i < entities.length; i++) {
        currentEntity = entities[i];

        if (currentEntity)
            for (var key in idMap)
                if (currentEntity[key] && currentEntity[key] > idMap[key])
                    currentEntity[key]--;
    }

    for (var key in idMap) {
        layers[key].splice(idMap[key], 1);
    }

    freed.push(entity._id);
    return entity._id; //TODO: DO WE NEED THIS
};

/**
 * Get an Entity by id
 *
 * @method getEntity
 * 
 * @param  {Number} id id of the Entity
 * @return {Entity} entity with the id provided
 */
EntityRegistry.getEntity = function getEntity(id) {
    if (!entities[id]) return false;
    return layers.everything.get(entities[id].everything);
};

/**
 * Remove all Entities from the entity registry
 *
 * @method clear
 */
EntityRegistry.clear = function clear() {
    var everything = EntityRegistry.getLayer('everything');
    while (everything.length) EntityRegistry.cleanup(everything.pop());
};

// Regsiter the default layers
EntityRegistry.addLayer('Roots');
EntityRegistry.addLayer('CoreSystem');

module.exports = EntityRegistry;

},{"./Layer":"/Users/ftripier/Code/Games/One/Libraries/MixedMode/src/famous/core/Layer.js"}],"/Users/ftripier/Code/Games/One/Libraries/MixedMode/src/famous/core/Layer.js":[function(require,module,exports){
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Owners: dan@famo.us
 *         felix@famo.us
 *         mike@famo.us
 *
 * @license MPL 2.0
 * @copyright Famous Industries, Inc. 2014
 */

'use strict';

var EventEmitter = require('../events/EventEmitter');

/**
 * Layers are groups that hold references to Entities.  It
 *  adds event emitting and convenience methods on top of
 *  the array storage.
 *
 * @class Layer
 * @constructor
 */
function Layer() {
    this.entities = [];
    this.IO       = new EventEmitter();
    Object.defineProperty(this, 'length', {
        get: function get() {
            return this.entities.length;
        }
    });
}

/**
 * Delegates to the EventHandlers "on"
 *
 * @method on
 */
Layer.prototype.on = function on() {
    return this.IO.on.apply(this.IO, arguments);
};

/**
 * Adds an Entity and emits a message
 *
 * @method push
 * 
 * @result {Boolean} return status of array push
 */
Layer.prototype.push = function push(entity) {
    this.IO.emit('entityPushed', entity);
    return this.entities.push(entity);
};

/**
 * Adds an Entity and emits a message
 *
 * @method pop
 * 
 * @result {Entity} last Entity that was added
 */
Layer.prototype.pop = function pop() {
    var result = this.entities.pop();
    this.IO.emit('entityPopped', result);
    return result;
};

/**
 * Find where and if an Entity is in the array
 *
 * @method indexOf
 * 
 * @result {Number} index of Entity in the array
 */
Layer.prototype.indexOf = function indexOf() {
    return this.entities.indexOf.apply(this.entities, arguments);
};

/**
 * Splices the array and emits a message
 *
 * @method splice
 * 
 * @result {Array} spliced out Entities
 */
Layer.prototype.splice = function splice() {
    var result = this.entities.splice.apply(this.entities, arguments);
    this.IO.emit('entitiesSpliced', result);
    return result;
};

/**
 * Removes and entity from the array and emits a message
 *
 * @method remove
 * 
 * @result {Entity} removed Entity
 */
Layer.prototype.remove = function remove(entity) {
    var index = this.entities.indexOf(entity);
    this.IO.emit('entityRemoved', entity);
    if (index < 0) return false;
    else           return this.entities.splice(index, 1)[0];
};

/**
 * Get the Entity are a particular index
 *
 * @method get
 * 
 * @result {Entity} Entity at that index
 */
Layer.prototype.get = function get(index) {
    return this.entities[index];
};

/**
 * Find of if the Layer has an Entity
 *
 * @method has
 * 
 * @result {Boolean} existence of the Entity in the Layer
 */
Layer.prototype.has = function has(entity) {
    return this.entities.indexOf(entity) !== -1;
};

/**
 * Execute a function that iterates over the collection
 *  of Entities and calls a function where the parameters
 *  are, the Entity, index, and full collection of Entities.
 *
 * @method forEach
 * 
 * @param {Function} function to be run per Entity
 */
Layer.prototype.forEach = function forEach(fn) {
    var i      = -1,
        length = this.entities.length;

    if (typeof fn !== 'function') throw new Error('Layer.forEach only accepts functions as a parameter');

    while (length - ++i) fn(this.entities[i], i, this.entities);
};

/**
 * Implements reduce on the collection of Entities
 *
 * @method reduce
 * 
 * @param {Function} function to be run per Entity
 * @param {*} initialValue initial value of the reduce function
 * 
 * @return {*} value after each Entity has had the function run
 */
Layer.prototype.reduce = function reduce(fn, initialValue) {
    var i      = -1,
        length = this.entities.length,
        accumulator;

    if (typeof fn !== 'function') throw new Error('Layer.reduce only accepts functions as a parameter');

    if (initialValue != null) accumulator = initialValue;
    else                      accumulator = this.entities[++i];
    while (length - ++i)      accumulator = fn(accumulator, this.entities[i], i, this.entities);

    return accumulator;
};

/**
 * Implements map on the collection of Entities
 *
 * @method map
 * 
 * @param {Function} function to be run per Entity
 *
 * @return {Array} array of the return values of the mapping function
 */
Layer.prototype.map = function map(fn) {
    var i      = -1,
        length = this.entities.length,
        result = [];

    if (typeof fn !== 'function') throw new Error('Layer.map only accepts functions as a parameter');

    while (length - ++i) result.push(fn(this.entities[i], i, this.entities));

    return result;
};

/**
 * Implements filter on the collection of Entities
 *
 * @method filter
 * 
 * @param {Function} function to be run per Entity
 *
 * @return {Array} array of the return values of the filtering function
 */
Layer.prototype.filter = function filter(fn) {
    var i      = -1,
        length = this.entities.length,
        result = [];

    if (typeof fn !== 'function') throw new Error('Layer.filter only accepts functions as a parameter');

    while (length - ++i) if (fn(this.entities[i], i, this.entities)) result.push(this.entities[i]);

    return result;
};

/**
 * Implements reject on the collection of Entities
 *
 * @method reject
 * 
 * @param {Function} function to be run per Entity
 *
 * @return {Array} array of the return values of the rejecting function
 */
Layer.prototype.reject = function reject(fn) {
    var i      = -1,
        length = this.entities.length,
        result = [];

    if (typeof fn !== 'function') throw new Error('Layer.reject only accepts functions as a parameter');

    while (length - ++i) if (!fn(this.entities[i], i, this.entities)) result.push(this.entities[i]);

    return result;
};

module.exports = Layer;

},{"../events/EventEmitter":"/Users/ftripier/Code/Games/One/Libraries/MixedMode/src/famous/events/EventEmitter.js"}],"/Users/ftripier/Code/Games/One/Libraries/MixedMode/src/famous/core/OptionsManager.js":[function(require,module,exports){
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Owner: mark@famo.us
 * @license MPL 2.0
 * @copyright Famous Industries, Inc. 2014
 */
 
'use strict';

var EventHandler = require('../events/EventHandler');

/**
 *  A collection of methods for setting options which can be extended
 *  onto other classes.
 *
 *
 * @class OptionsManager
 * @constructor
 * 
 * @param {Object} value options dictionary
 */
function OptionsManager(value) {
    this._value = value;
    this.eventOutput = null;
}

/**
 * Create options manager from source dictionary with arguments overriden by patch dictionary.
 *
 * @static
 * @method OptionsManager.patch
 *
 * @param {Object} source source arguments
 * @param {...Object} data argument additions and overwrites
 * @return {Object} source object
 */
OptionsManager.patch = function patchObject(source, data) {
    var manager = new OptionsManager(source);
    for (var i = 1; i < arguments.length; i++) manager.patch(arguments[i]);
    return source;
};

function _createEventOutput() {
    this.eventOutput = new EventHandler();
    this.eventOutput.bindThis(this);
    EventHandler.setOutputHandler(this, this.eventOutput);
}

/**
 * Create OptionsManager from source with arguments overriden by patches.
 *   Triggers 'change' event on this object's event handler if the state of
 *   the OptionsManager changes as a result.
 *
 * @method patch
 *
 * @param {...Object} arguments list of patch objects
 * @return {OptionsManager} this
 */
OptionsManager.prototype.patch = function patch() {
    var myState = this._value;
    for (var i = 0; i < arguments.length; i++) {
        var data = arguments[i];
        for (var k in data) {
            if ((k in myState) && (data[k] && data[k].constructor === Object) && (myState[k] && myState[k].constructor === Object)) {
                if (!myState.hasOwnProperty(k)) myState[k] = Object.create(myState[k]);
                this.key(k).patch(data[k]);
                if (this.eventOutput) this.eventOutput.emit('change', {id: k, value: data[k]});
            }
            else this.set(k, data[k]);
        }
    }
    return this;
};

/**
 * Alias for patch
 *
 * @method setOptions
 *
 */
OptionsManager.prototype.setOptions = OptionsManager.prototype.patch;

/**
 * Return OptionsManager based on sub-object retrieved by key
 *
 * @method key
 *
 * @param {string} identifier key
 * @return {OptionsManager} new options manager with the value
 */
OptionsManager.prototype.key = function key(identifier) {
    var result = new OptionsManager(this._value[identifier]);
    if (!(result._value instanceof Object) || result._value instanceof Array) result._value = {};
    return result;
};

/**
 * Look up value by key
 * @method get
 *
 * @param {string} key key
 * @return {Object} associated object
 */
OptionsManager.prototype.get = function get(key) {
    return this._value[key];
};

/**
 * Alias for get
 * @method getOptions
 */
OptionsManager.prototype.getOptions = OptionsManager.prototype.get;

/**
 * Set key to value.  Outputs 'change' event if a value is overwritten.
 *
 * @method set
 *
 * @param {string} key key string
 * @param {Object} value value object
 * @return {OptionsManager} new options manager based on the value object
 */
OptionsManager.prototype.set = function set(key, value) {
    var originalValue = this.get(key);
    this._value[key] = value;

    if (this.eventOutput && value !== originalValue) this.eventOutput.emit('change', {id: key, value: value});
    return this;
};

/**
 * Return entire object contents of this OptionsManager.
 *
 * @method value
 *
 * @return {Object} current state of options
 */
OptionsManager.prototype.value = function value() {
    return this._value;
};

/**
 * Bind a callback function to an event type handled by this object.
 *
 * @method "on"
 *
 * @param {string} type event type key (for example, 'change')
 * @param {function(string, Object)} handler callback
 * @return {EventHandler} this
 */
OptionsManager.prototype.on = function on() {
    _createEventOutput.call(this);
    return this.on.apply(this, arguments);
};

/**
 * Unbind an event by type and handler.
 *   This undoes the work of "on".
 *
 * @method removeListener
 *
 * @param {string} type event type key (for example, 'change')
 * @param {function} handler function object to remove
 * @return {EventHandler} internal event handler object (for chaining)
 */
OptionsManager.prototype.removeListener = function removeListener() {
    _createEventOutput.call(this);
    return this.removeListener.apply(this, arguments);
};

/**
 * Add event handler object to set of downstream handlers.
 *
 * @method pipe
 *
 * @param {EventHandler} target event handler target object
 * @return {EventHandler} passed event handler
 */
OptionsManager.prototype.pipe = function pipe() {
    _createEventOutput.call(this);
    return this.pipe.apply(this, arguments);
};

/**
 * Remove handler object from set of downstream handlers.
 * Undoes work of "pipe"
 *
 * @method unpipe
 *
 * @param {EventHandler} target target handler object
 * @return {EventHandler} provided target
 */
OptionsManager.prototype.unpipe = function unpipe() {
    _createEventOutput.call(this);
    return this.unpipe.apply(this, arguments);
};

module.exports = OptionsManager;
},{"../events/EventHandler":"/Users/ftripier/Code/Games/One/Libraries/MixedMode/src/famous/events/EventHandler.js"}],"/Users/ftripier/Code/Games/One/Libraries/MixedMode/src/famous/core/Renderers/DOMrenderer.js":[function(require,module,exports){
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Owners: dan@famo.us
 *         felix@famo.us
 *         mike@famo.us
 *
 * @license MPL 2.0
 * @copyright Famous Industries, Inc. 2014
 */

'use strict';

var OptionsManager   = require('../OptionsManager'),
    Surface          = require('../Components/Surface'),
    Container        = require('../Components/Container'),
    ElementAllocator = require('./ElementAllocator'),
    EntityRegistry   = require('../EntityRegistry'),
    MatrixMath       = require('../../math/4x4matrix');

// State
var containersToElements = {},
    surfacesToElements   = {},
    containersToSurfaces = {},
    targets              = [Surface.toString()];

var usePrefix = document.createElement('div').style.webkitTransform != null;

// CONSTS
var ZERO                = 0,
    MATRIX3D            = 'matrix3d(',
    CLOSE_PAREN         = ')',
    COMMA               = ',',
    DIV                 = 'div',
    FA_CONTAINER        = 'fa-container',
    FA_SURFACE          = 'fa-surface',
    CONTAINER           = 'container',
    PX                  = 'px',
    SURFACE             = 'surface',
    TRANSFORM           = 'transform',
    CSSTRANSFORM        = usePrefix ? 'webkitTransform' : 'transform',
    CSSTRANSFORM_ORIGIN = usePrefix ? 'webkitTransformOrigin' : 'transformOrigin';

//scratch memory for matrix calculations
var devicePixelRatio = window.devicePixelRatio || 1,
    matrixScratch1   = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]),
    matrixScratch2   = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]),
    matrixScratch3   = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]),
    matrixScratch4   = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);

/**
 * DOMRenderer is a singleton object whose responsiblity it is
 *  to draw DOM bound Surfaces to their respective Containers.
 *
 * @class DOMRenderer
 * @singleton
 */
var DOMRenderer = {
    _queues: {
        containers: {
            update: [],
            recall: [],
            deploy: []
        },
        surfaces: {}
    },
    allocators: {}
};

/**
 * Add an Entity with a Container component to the queue to be
 *  added into the DOM.
 *
 * @method deployContainer
 * 
 * @param {Entity} entity Entity that needs to be deployed
 */
DOMRenderer.deployContainer = function deployContainer(entity) {
    this._queues.containers.deploy.push(entity);
    containersToSurfaces[entity._id]  = {};
    this._queues.surfaces[entity._id] = {
        update: [],
        recall: [],
        deploy: []
    };
};

// Deploy a given Entity's Container to the DOM.
function _deployContainer(entity) {
    var context = entity.getContext();

    // If the Container has not previously been deploy and
    // does not have an allocator, create one.
    if (!DOMRenderer.allocators[context._id])
        DOMRenderer.allocators[context._id] = new ElementAllocator(context._parentEl);

    // Create the DOM representation of the Container
    var element = DOMRenderer.allocators[context._id].allocate(DIV);
    containersToElements[entity._id] = element;
    _updateContainer(entity, element);
    element.classList.add(FA_CONTAINER);

    DOMRenderer.allocators[entity._id] = new ElementAllocator(element);
}

/**
 * Add an Entity with a Container component to the queue to be
 *  removed from the DOM.
 *
 * @method recallContainer
 * 
 * @param {Entity} entity Entity that needs to be recalled
 */
DOMRenderer.recallContainer = function recallContainer(entity) {
    this._queues.containers.recall.push(entity);
    delete this._queues.surfaces[entity._id];
};

// Recall the DOM representation of the Entity's Container
// and clean up references.
function _recallContainer(entity) {
    var element = containersToElements[entity._id];
    var context = entity.getContext();
    DOMRenderer.allocators[context._id].deallocate(element);
    element.classList.remove(FA_CONTAINER);
    delete DOMRenderer.allocators[entity._id];
}

/**
 * Add an Entity with a Container component to the queue to be
 *  updated.
 *
 * @method updateContainer
 * 
 * @param {Entity} entity Entity that needs to be updated
 */
DOMRenderer.updateContainer = function updateContainer(entity) {
    this._queues.containers.update.push(entity);
};

// Update the Container's DOM properties
function _updateContainer(entity) {
    var container = entity.getComponent(CONTAINER),
        element   = containersToElements[entity._id],
        i         = 0,
        size,
        origin,
        contextSize;

    if (container._events.dirty) {
        i = container._events.on.length;
        while (container._events.off.length) element.removeEventListener(container._events.off.pop(), container._events.forwarder);
        while (i--) element.removeEventListener(container._events.on[i], container._events.forwarder);
        container._events.dirty = false;
    }

    if (container._sizeDirty || container._transformDirty) {
        contextSize = entity.getContext()._size;
        size        = container.getSize();
        origin      = container.origin;
    }

    if (container._sizeDirty) {
        element.style.width  = size[0] + PX;
        element.style.height = size[1] + PX;
        container._sizeDirty = false;
    }

    if (container._transformDirty) {
        var transform               = DOMRenderer.createDOMMatrix(entity.getComponent(TRANSFORM)._matrix, contextSize, size, origin);
        element.style[CSSTRANSFORM] = DOMRenderer.stringifyMatrix(transform);

        var keys = Object.keys(containersToSurfaces[entity._id]);
        i        = keys.length;
        while (i--)
            if (containersToSurfaces[entity._id][keys[i]])
                containersToSurfaces[entity._id][keys[i]].getComponent(SURFACE).invalidations |= Surface.invalidations.transform;
    }
}

/**
 * Add an Entity with a Surface to the queue to be deployed
 *  to a particular Container.
 *
 * @method deploy
 * 
 * @param {Entity} entity Entity that needs to be deployed
 * @param {Entity} container Entity that the Surface will be deployed to
 */
DOMRenderer.deploy = function deploy(entity, container) {
    if (!surfacesToElements[entity._id]) surfacesToElements[entity._id] = {};
    DOMRenderer._queues.surfaces[container._id].deploy.push(entity);
    containersToSurfaces[container._id][entity._id] = entity;
};

// Deploys the Entity's Surface to a particular Container.
function _deploy(entity, containerID) {
    var element = DOMRenderer.allocators[containerID].allocate(DIV);
    entity.getComponent(SURFACE).invalidateAll();
    surfacesToElements[entity._id][containerID] = element;
    element.classList.add(FA_SURFACE);
    _update(entity, containerID);
}

/**
 * Add an Entity with a Surface to the queue to be recalled
 *  from a particular Container.
 *
 * @method recall
 * 
 * @param {Entity} entity Entity that needs to be recalled from
 * @param {Entity} container Entity that the Surface will be recalled from
 */
DOMRenderer.recall = function recall(entity, container) {
    DOMRenderer._queues.surfaces[container._id].recall.push(entity);
    containersToSurfaces[container._id][entity._id] = false;
};

// Recalls the Entity's Surface from a given Container
function _recall(entity, containerID) {
    var element = surfacesToElements[entity._id];
    var surface = entity.getComponent('surface');
    DOMRenderer.allocators[containerID].deallocate(element);
    var i = surface.spec.events.length;
    while (i--) element.removeEventListener(surface.spec.events[i], surface.eventForwarder);
}

/**
 * Add an Entity with a Surface to the queue to be updated
 *
 * @method update
 * 
 * @param {Entity} entity Entity that needs to be updated
 * @param {Entity} container Entity that the Surface will be updated for
 */
DOMRenderer.update = function update(entity, container) {
    DOMRenderer._queues.surfaces[container._id].update.push(entity);
};

// Update the Surface that is to deployed to a partcular Container
function _update(entity, containerID) {
    var surface         = entity.getComponent(SURFACE),
        spec            = surface.render(),
        i               = 0,
        contextSize     = entity.getContext()._size,
        element         = surfacesToElements[entity._id][containerID],
        containerEntity = EntityRegistry.getEntity(containerID),
        container       = containerEntity.getComponent(CONTAINER),
        key;

    if (Surface.invalidations.classes & spec.invalidations) {
        for (i = 0; i < element.classList.length; i++) element.classList.remove(element.classList[i]);
        for (i = 0; i < spec.classes.length;   i++) element.classList.add(spec.classes[i]);
        element.classList.add(FA_SURFACE);
    }
    
    if (Surface.invalidations.properties & spec.invalidations)
        for (key in spec.properties) element.style[key] = spec.properties[key];

    if (Surface.invalidations.content & spec.invalidations)
        element.innerHTML = spec.content;

    if (Surface.invalidations.opacity & spec.invalidations)
        element.style.opacity = spec.opacity;

    if (Surface.invalidations.origin & spec.invalidations) {
        element.style[CSSTRANSFORM_ORIGIN] = spec.origin[0].toFixed(2) * 100 + '% ' + spec.origin[1].toFixed(2) * 100 + '%';
    }

    if (Surface.invalidations.events & spec.invalidations) {
        i = spec.events.length;
        while (i--) element.addEventListener(spec.events[i], spec.eventForwarder);
    }

    if (Surface.invalidations.size & spec.invalidations) {
        surface._size[0] = element.offsetWidth;
        surface._size[1] = element.offsetHeight;
    }

    if (Surface.invalidations.transform & spec.invalidations) {
        var transform = MatrixMath.multiply(matrixScratch3, container.getDisplayMatrix(), entity.getComponent(TRANSFORM)._matrix);
        transform     = DOMRenderer.createDOMMatrix(transform, contextSize, surface.getSize(), spec.origin);
        var camera    = entity.getContext().getComponent('camera');
        if (camera) {
            var focalPoint    = camera.getOptions().projection.options.focalPoint;
            var fx            = (focalPoint[0] + 1) * 0.5 * contextSize[0];
            var fy            = (1 - focalPoint[1]) * 0.5 * contextSize[1];
            var scratchMatrix = [1, 0, 0, 0, 0, 1, 0,  0, 0, 0, 1, 0, fx - surface.getSize()[0] * spec.origin[0],  fy - surface.getSize()[1] * spec.origin[1], 0, 1];
            MatrixMath.multiply(scratchMatrix, scratchMatrix, [1, 0, 0, 0, 0, 1, 0,  0, 0, 0, 1, entity.getContext().getComponent('camera').getProjectionTransform()[11],  0, 0, 0, 1]);
            MatrixMath.multiply(scratchMatrix, scratchMatrix, [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -(fx - surface.getSize()[0] * spec.origin[0]),  -(fy - surface.getSize()[1] * spec.origin[1]), 0, 1]);
            MatrixMath.multiply(transform, scratchMatrix, transform);
        }
        element.style[CSSTRANSFORM] = DOMRenderer.stringifyMatrix(transform);
    }
}

/**
 * Render will run over all of the queues that have been populated
 *  by the RenderSystem and will execute the deployment, recalling,
 *  and updating.
 *
 * @method render
 */
 DOMRenderer.render = function render() {
    var queue,
        containerID,
        innerQueues,
        queues     = DOMRenderer._queues,
        containers = Object.keys(queues.surfaces),
        j          = containers.length,
        i          = 0,
        k          = 0;
    
    // Deploy Containers
    queue = queues.containers.deploy;
    i     = queue.length;
    while (i--) _deployContainer(queue.shift());

    // Recall Containers
    queue = queues.containers.recall;
    i     = queue.length;
    while (i--) _recallContainer(queue.shift());

    // Update Containers
    queue = queues.containers.update;
    i     = queue.length;
    while (i--) _updateContainer(queue.shift());

    // For each Container
    while (j--) {
        containerID = containers[j];
        innerQueues = queues.surfaces[containerID];

        // Deploy Surfaces
        queue = innerQueues.deploy;
        i     = queue.length;
        while (i--) _deploy(queue.shift(), containerID);

        // Recall Surfaces
        queue = innerQueues.recall;
        i     = queue.length;
        while (i--) _recall(queue.shift(), containerID);

        // Update Surfaces
        queue = innerQueues.update;
        i     = queue.length;
        while (i--) _update(queue.shift(), containerID);
    }

};

// Get the type of Targets the DOMRenderer will work for
DOMRenderer.getTargets = function getTargets() {
    return targets;
};

/**
 * Create the Transform matrix for a Surface based on it transform,
 *  size, origin, and Context's size.  Uses its Context's size to
 *  turn homogenous coordinate Transforms to pixels.
 *
 * @method createDOMMAtrix
 *
 * @param {Array} transform Transform matrix
 * @param {Array} contextSize 2-dimensional size of the Context
 * @param {Array} size size of the DOM element as a 3-dimensional array
 * @param {Array} origin origin of the DOM element as a 2-dimensional array
 * @param {Array} result storage of the DOM bound transform matrix
 */
DOMRenderer.createDOMMatrix = function createDOMMatrix(transform, contextSize, size, origin, result) {
    result             = result || [];
    // size[0]           /= 0.5 * contextSize[0]; // TODO: We're not using the 
    // size[1]           /= 0.5 * contextSize[1];
    matrixScratch1[0]  = 1;
    matrixScratch1[1]  = 0;
    matrixScratch1[2]  = 0;
    matrixScratch1[3]  = 0;
    matrixScratch1[4]  = 0;
    matrixScratch1[5]  = 1;
    matrixScratch1[6]  = 0;
    matrixScratch1[7]  = 0;
    matrixScratch1[8]  = 0;
    matrixScratch1[9]  = 0;
    matrixScratch1[10] = 1;
    matrixScratch1[11] = 0;
    matrixScratch1[12] = -size[0] * origin[0];
    matrixScratch1[13] = -size[1] * origin[1];
    matrixScratch1[14] = 0;
    matrixScratch1[15] = 1;
    MatrixMath.multiply(matrixScratch2, matrixScratch1, transform);

    result[0]  = ((matrixScratch2[0]  < 0.000001 && matrixScratch2[0]  > -0.000001) ? ZERO : matrixScratch2[0]);
    result[1]  = ((matrixScratch2[1]  < 0.000001 && matrixScratch2[1]  > -0.000001) ? ZERO : matrixScratch2[1]);
    result[2]  = ((matrixScratch2[2]  < 0.000001 && matrixScratch2[2]  > -0.000001) ? ZERO : matrixScratch2[2]);
    result[3]  = ((matrixScratch2[3]  < 0.000001 && matrixScratch2[3]  > -0.000001) ? ZERO : matrixScratch2[3]);
    result[4]  = ((matrixScratch2[4]  < 0.000001 && matrixScratch2[4]  > -0.000001) ? ZERO : matrixScratch2[4]);
    result[5]  = ((matrixScratch2[5]  < 0.000001 && matrixScratch2[5]  > -0.000001) ? ZERO : matrixScratch2[5]);
    result[6]  = ((matrixScratch2[6]  < 0.000001 && matrixScratch2[6]  > -0.000001) ? ZERO : matrixScratch2[6]);
    result[7]  = ((matrixScratch2[7]  < 0.000001 && matrixScratch2[7]  > -0.000001) ? ZERO : matrixScratch2[7]);
    result[8]  = ((matrixScratch2[8]  < 0.000001 && matrixScratch2[8]  > -0.000001) ? ZERO : matrixScratch2[8]);
    result[9]  = ((matrixScratch2[9]  < 0.000001 && matrixScratch2[9]  > -0.000001) ? ZERO : matrixScratch2[9]);
    result[10] = ((matrixScratch2[10] < 0.000001 && matrixScratch2[10] > -0.000001) ? ZERO : matrixScratch2[10]);
    result[11] = ((matrixScratch2[11] < 0.000001 && matrixScratch2[11] > -0.000001) ? ZERO : matrixScratch2[11]);
    result[12] = ((matrixScratch2[12] < 0.000001 && matrixScratch2[12] > -0.000001) ? ZERO : matrixScratch2[12]) + 0.5 * contextSize[0];
    result[13] = ((matrixScratch2[13] < 0.000001 && matrixScratch2[13] > -0.000001) ? ZERO : matrixScratch2[13]) + 0.5 * contextSize[1];
    // result[12] = (Math.round((matrixScratch2[12] + 1) * 0.5 * contextSize[0] * devicePixelRatio) / devicePixelRatio);
    // result[13] = (Math.round((matrixScratch2[13] + 1) * 0.5 * contextSize[1] * devicePixelRatio) / devicePixelRatio);
    result[14] = ((matrixScratch2[14] < 0.000001 && matrixScratch2[14] > -0.000001) ? ZERO : matrixScratch2[14]);
    result[15] = ((matrixScratch2[15] < 0.000001 && matrixScratch2[15] > -0.000001) ? ZERO : matrixScratch2[15]);

    // size[0] *= 0.5 * contextSize[0];
    // size[1] *= 0.5 * contextSize[1];
    return result;
};

/**
 * Get the CSS representation of a Transform matrix
 *
 * @method stringifyMatrix
 *
 * @param {Array} m Transform matrix
 */
DOMRenderer.stringifyMatrix = function stringifyMatrix(m) {
    return MATRIX3D +
        m[0]  + COMMA +
        m[1]  + COMMA +
        m[2]  + COMMA +
        m[3]  + COMMA +
        m[4]  + COMMA +
        m[5]  + COMMA +
        m[6]  + COMMA +
        m[7]  + COMMA +
        m[8]  + COMMA +
        m[9]  + COMMA +
        m[10] + COMMA +
        m[11] + COMMA +
        m[12] + COMMA +
        m[13] + COMMA +
        m[14] + COMMA +
        m[15] + CLOSE_PAREN;
};


module.exports = DOMRenderer;

},{"../../math/4x4matrix":"/Users/ftripier/Code/Games/One/Libraries/MixedMode/src/famous/math/4x4matrix.js","../Components/Container":"/Users/ftripier/Code/Games/One/Libraries/MixedMode/src/famous/core/Components/Container.js","../Components/Surface":"/Users/ftripier/Code/Games/One/Libraries/MixedMode/src/famous/core/Components/Surface.js","../EntityRegistry":"/Users/ftripier/Code/Games/One/Libraries/MixedMode/src/famous/core/EntityRegistry.js","../OptionsManager":"/Users/ftripier/Code/Games/One/Libraries/MixedMode/src/famous/core/OptionsManager.js","./ElementAllocator":"/Users/ftripier/Code/Games/One/Libraries/MixedMode/src/famous/core/Renderers/ElementAllocator.js"}],"/Users/ftripier/Code/Games/One/Libraries/MixedMode/src/famous/core/Renderers/ElementAllocator.js":[function(require,module,exports){
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Owners: mark@famo.us
 *
 * @license MPL 2.0
 * @copyright Famous Industries, Inc. 2014
 */

'use strict';

/**
 * Internal helper object to Container that handles the process of
 *   creating and allocating DOM elements within a managed div.
 *   Private.
 *
 * @class ElementAllocator
 * @constructor
 *
 * @param {DOMElement} container document element in which Famo.us content will be inserted
 */
function ElementAllocator(container) {
    if (!container) container = document.createDocumentFragment();
    this.container     = container;
    this.detachedNodes = {};
    this.nodeCount     = 0;
}

/**
 * Allocate an element of specified type from the pool.
 *
 * @method allocate
 *
 * @param {String} type type of element, e.g. 'div'
 *
 * @return {DOMElement} allocated document element
 */
ElementAllocator.prototype.allocate = function allocate(type) {
    type = type.toLowerCase();
    if (!(type in this.detachedNodes)) this.detachedNodes[type] = [];
    var nodeStore = this.detachedNodes[type];
    var result;
    if (nodeStore.length > 0) {
        result = nodeStore.pop();
    } else {
        result = document.createElement(type);
        this.container.appendChild(result);
    }
    this.nodeCount++;
    result.style.display = '';    
    return result;
};

/**
 * De-allocate an element of specified type to the pool.
 *
 * @method deallocate
 *
 * @param {DOMElement} element document element to deallocate
 */
ElementAllocator.prototype.deallocate = function deallocate(element) {
    var nodeType = element.nodeName.toLowerCase();
    var nodeStore = this.detachedNodes[nodeType];
    nodeStore.push(element);
    element.style.display = 'none';
    element.style.opacity = '';
    element.style.width   = '';
    element.style.height  = '';
    this.nodeCount--;
};

/**
 * Get count of total allocated nodes in the document.
 *
 * @method getNodeCount
 *
 * @return {Number} total node count
 */
ElementAllocator.prototype.getNodeCount = function getNodeCount() {
    return this.nodeCount;
};

module.exports = ElementAllocator;
},{}],"/Users/ftripier/Code/Games/One/Libraries/MixedMode/src/famous/core/Renderers/WebGLRenderer.js":[function(require,module,exports){
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Owners: adnan@famo.us,
 *
 * @license MPL 2.0
 * @copyright Famous Industries, Inc. 2014
 */

'use strict';

var mouse          = [.5, .5];
var shaders        = {};
var start          = Date.now();
var perspective    = __perspective([], 0, innerWidth / innerHeight, .1,  1000.);
var EntityRegistry = require('../EntityRegistry');
var Engine         = require('../Engine');
var Geometry       = require('../../gl/geometry');
var lightList      = EntityRegistry.getLayer('Lights');

var appended = false;
var gl;

var vertexWrapper = [
    '//define_vs',

    'vec4 pipeline_pos(in vec4 pos) {',
    '    //apply_vs', 
    '    pos = transform * perspective * pos;',    
    '    pos.y *= -1.;',    
    '    return pos;',  
    '}',

    'void main() {',
    '    v_normal = a_normal;',
    '    gl_Position = pipeline_pos(a_pos);',
    '}'
].join('\n');

var fragmentWrapper = [
    '//define_fs',  
    'vec4 pipeline_color(in vec4 color) {',
    '    //apply_fs',  
    '    return color;', 
    '}',

    'void main() {',
    '    vec4 color;',
    '    color = vec4(v_normal, 1.);',
    '    gl_FragColor = vec4(1);',
    '}'
].join('\n');

var WebGLRenderer = {
    draw: draw,
    render: function () {
        var geom = EntityRegistry.getLayer('Geometries');
        (geom ? geom.entities : []).forEach(function (geom) {
            var c = geom.getContext().getComponent('camera');
            if (c)  this.shader.uniforms({ perspective:  c.getProjectionTransform() });
            this.draw(geom._components.geometry.render(), {_size: [innerWidth, innerHeight, 10]} );
        }.bind(this));
    },
    deploy: function () {},
    update: function () {},
    setOptions: function() {},
    DEFAULT_OPTIONS: {},
    recall: function () {},
    getTargets: function () {
        return [Geometry.toString()];
    },
    init: init
};

module.exports = WebGLRenderer;

function draw(spec, container) {
    if (!appended) document.body.appendChild(gl.canvas);
    if (! spec.texture) delete spec.texture;

    if (spec.chunkTest) this.shader = mergePipeline.call(this, spec);
    if (spec.fsChunk) this.shader = mergePipeline.call(this, spec, true);

    spec.mouse = mouse;
    spec.resolution = container._size;
    spec.clock = (Date.now() - start) / 100;
    if (! spec.noise) spec.noise = 0;
    this.shader.uniforms(spec).draw(spec.geometry);
}

function init() {
    var options = { alpha: true };
    var canvas = document.createElement('canvas');
    gl = window.gl = canvas.getContext('webgl', options);

    if (! gl) throw 'WebGL not supported';

    this.ShaderMaker = require('../../gl/shader')(gl);

    this.shader = new this.ShaderMaker(vertexWrapper, fragmentWrapper);
    window.onmousemove = function(e) {
        mouse = [e.x / innerWidth, 1. - e.y /innerHeight];
    };

    gl.enable(gl.POLYGON_OFFSET_FILL);
    gl.polygonOffset(1, 1);
    gl.enable(gl.DEPTH_TEST);
    gl.canvas.className = 'GL';
    gl.canvas.width = window.innerWidth;
    gl.canvas.height = window.innerHeight;
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
}

function __perspective(out, fovy, aspect, near, far) {
    var f = 1.0 / Math.tan(fovy / 2),
        nf = 1 / (near - far);
    out[0] = f / aspect;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = f;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = (far + near) * nf;
    out[11] = -1;
    out[12] = 0;
    out[13] = 0;
    out[14] = (2 * far * near) * nf;
    out[15] = 0;
    return out;
};
var once = 0;
function mergePipeline(spec, shader, flag) {
    spec.chunkTest = false;
    if (flag)
    this.shader.vs = this.shader.vs
        .replace('//define_vs', spec.chunkNoise.defines)
        .replace('//apply_fs', spec.chunkNoise.apply);
    else this.shader.fs = this.shader.fs.replace('//apply_fs', spec.fsChunk);
    if(once) return this.shader;
    once ++;
    
    return new this.ShaderMaker(this.shader.vs, this.shader.fs);
}

},{"../../gl/geometry":"/Users/ftripier/Code/Games/One/Libraries/MixedMode/src/famous/gl/geometry.js","../../gl/shader":"/Users/ftripier/Code/Games/One/Libraries/MixedMode/src/famous/gl/shader.js","../Engine":"/Users/ftripier/Code/Games/One/Libraries/MixedMode/src/famous/core/Engine.js","../EntityRegistry":"/Users/ftripier/Code/Games/One/Libraries/MixedMode/src/famous/core/EntityRegistry.js"}],"/Users/ftripier/Code/Games/One/Libraries/MixedMode/src/famous/core/Stylesheet/famous.css":[function(require,module,exports){
var css = "var css = \"/* This Source Code Form is subject to the terms of the Mozilla Public\\n * License, v. 2.0. If a copy of the MPL was not distributed with this\\n * file, You can obtain one at http://mozilla.org/MPL/2.0/.\\n *\\n * Owner: mark@famo.us\\n * @license MPL 2.0\\n * @copyright Famous Industries, Inc. 2014\\n */\\n\\n\\nhtml {\\n    width: 100%;\\n    height: 100%;\\n    margin: 0px;\\n    padding: 0px;\\n    overflow: hidden;\\n    -webkit-transform-style: preserve-3d;\\n    transform-style: preserve-3d;\\n}\\n\\nbody {\\n    position: absolute;\\n    width: 100%;\\n    height: 100%;\\n    margin: 0px;\\n    padding: 0px;\\n    -webkit-transform-style: preserve-3d;\\n    transform-style: preserve-3d;\\n    -webkit-font-smoothing: antialiased;\\n    -webkit-tap-highlight-color: transparent;\\n    -webkit-perspective: 0;\\n    perspective: none;\\n    overflow: hidden;\\n}\\n\\n.famous-container, .famous-group {\\n    position: absolute;\\n    top: 0px;\\n    left: 0px;\\n    bottom: 0px;\\n    right: 0px;\\n    overflow: visible;\\n    -webkit-transform-style: preserve-3d;\\n    transform-style: preserve-3d;\\n    -webkit-backface-visibility: visible;\\n    backface-visibility: visible;\\n    pointer-events: none;\\n}\\n\\n.famous-group {\\n    width: 0px;\\n    height: 0px;\\n    margin: 0px;\\n    padding: 0px;\\n    -webkit-transform-style: preserve-3d;\\n    transform-style: preserve-3d;\\n}\\n\\n.fa-surface {\\n    position: absolute;\\n    -webkit-transform-origin: 0% 0%;\\n    transform-origin: 0% 0%;\\n    -webkit-backface-visibility: visible;\\n    backface-visibility: visible;\\n    -webkit-transform-style: flat;\\n    transform-style: preserve-3d; /* performance */\\n/*    -webkit-box-sizing: border-box;\\n    -moz-box-sizing: border-box;*/\\n    -webkit-tap-highlight-color: transparent;\\n    pointer-events: auto;\\n\\n}\\n\\n.famous-container-group {\\n    position: relative;\\n    width: 100%;\\n    height: 100%;\\n}\\n\\n.fa-container {\\n    position: absolute;\\n    -webkit-transform-origin: center center;\\n    transform-origin: center center;\\n    overflow: hidden;\\n}\\n\\ncanvas.GL {\\n    pointer-events: none;\\n    position: absolute;\\n    opacity: .7;\\n    z-index: 9999;\\n    top: 0px;\\n    left: 0px;\\n}\\n\"; (require(\"/Users/ftripier/Code/Games/One/node_modules/cssify\"))(css); module.exports = css;"; (require("/Users/ftripier/Code/Games/One/node_modules/cssify"))(css); module.exports = css;
},{"/Users/ftripier/Code/Games/One/node_modules/cssify":"/Users/ftripier/Code/Games/One/node_modules/cssify/browser.js"}],"/Users/ftripier/Code/Games/One/Libraries/MixedMode/src/famous/core/Systems/BehaviorSystem.js":[function(require,module,exports){
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Owners: dan@famo.us
 *         felix@famo.us
 *         mike@famo.us
 *
 * @license MPL 2.0
 * @copyright Famous Industries, Inc. 2014
 */

'use strict';

var EntityRegistry = require('../EntityRegistry');
var renderNodes    = EntityRegistry.getLayer('everything');

/**
 * A system that will run over custom components that have an
 *   update function.
 *
 * @class BehaviorSystem
 * @system
 * @singleton
 */
var BehaviorSystem = {};

/**
 * Update will iterate over all of the entities and call
 *   each of their update functions.
 *
 * @method update
 */
BehaviorSystem.update = function update() {
    var i = renderNodes.length;

    while (i--)
        if (renderNodes.entities[i].update)
            renderNodes.entities[i].update();
};

module.exports = BehaviorSystem;


},{"../EntityRegistry":"/Users/ftripier/Code/Games/One/Libraries/MixedMode/src/famous/core/EntityRegistry.js"}],"/Users/ftripier/Code/Games/One/Libraries/MixedMode/src/famous/core/Systems/CoreSystem.js":[function(require,module,exports){
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Owners: dan@famo.us
 *         felix@famo.us
 *         mike@famo.us
 *
 * @license MPL 2.0
 * @copyright Famous Industries, Inc. 2014
 */

'use strict';

var EntityRegistry = require('../EntityRegistry');
var roots          = EntityRegistry.addLayer('Contexts');

/**
 * CoreSystem is responsible for traversing the scene graph and
 *   updating the Transforms of the entities.
 *
 * @class  CoreSystem
 * @system
 * @singleton
 */
var CoreSystem = {};

/**
 * update iterates over each of the Contexts that were registered and
 *   kicks of the recursive updating of their entities.
 *
 * @method update
 */
CoreSystem.update = function update() {
    roots.forEach(coreUpdateAndFeed);
};

/**
 * coreUpdateAndFeed feeds parent information to an entity and so that
 *   each entity can update their transform.  It will then pass down
 *   invalidation states and values to any children.
 *
 * @method coreUpdateAndFeed
 * @private
 *   
 * @param  {Entity}  entity           Entity in the scene graph
 * @param  {Number}  transformReport  bitScheme report of transform invalidations
 * @param  {Array}   incomingMatrix   parent transform as a Float32 Array
 */
function coreUpdateAndFeed(entity, transformReport, incomingMatrix) {
    var transform = entity.getComponent('transform');
    var i         = entity._children.length;

    // Update the Transform based on parent invalidations
    transformReport = transform._update(transformReport, incomingMatrix);

    while (i--) coreUpdateAndFeed(entity._children[i], transformReport, transform._matrix);
}

module.exports = CoreSystem;

},{"../EntityRegistry":"/Users/ftripier/Code/Games/One/Libraries/MixedMode/src/famous/core/EntityRegistry.js"}],"/Users/ftripier/Code/Games/One/Libraries/MixedMode/src/famous/core/Systems/RenderSystem.js":[function(require,module,exports){
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Owners: dan@famo.us
 *         felix@famo.us
 *         mike@famo.us
 *
 * @license MPL 2.0
 * @copyright Famous Industries, Inc. 2014
 */

'use strict';

var EntityRegistry = require('../EntityRegistry'),
    MatrixMath     = require('../../math/4x4matrix'),
    OptionsManager = require('../OptionsManager');

var renderers          = {},
    targetsToRenderers = {};

var containers  = EntityRegistry.addLayer('HasContainer'),
    renderables = EntityRegistry.addLayer('Renderables');

var toDeploy = [];

containers.on('entityPushed', deployContainer);
containers.on('entityRemoved', recallContainer);

var containerToTargets = {};

function deployContainer(entity) {
    if (entity.getContext()) renderers.DOM.deployContainer(entity);
    else                     toDeploy.push(entity); // TODO This is temporary and it sucks
}

function recallContainer(entity) {
    renderers.DOM.recallContainer(entity);
}

function _releventToRenderer(renderer, entity) {
    var targets = renderer.getTargets();
    var j       = targets.length;
    while (j--) if (entity.hasComponent(targets[j])) return true;
    return false;
}

function _releventToAnyRenderer(entity) {
    var rendererNames = Object.keys(renderers),
        i             = rendererNames.length;

    while (i--) if (_releventToRenderer(renderers[rendererNames[i]], entity)) return true;
    return false;
}

var vertexScratch = new Float32Array([0, 0, 0, 0]),
    matrixScratch = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);

// Vertex culling logic
function _isWithin(target, entity, container) {
    // var verticies   = target.getVerticies(),
    //     i           = verticies.length,
    //     v           = null,
    //     origin      = void 0,
    //     isInside    = false,
    //     displaySize = container.getComponent('size').getGlobalSize(),
    //     x           = 0,
    //     y           = 0,
    //     size        = entity.getComponent('size').getGlobalSize(),
    //     ft          = MatrixMath.multiply(matrixScratch,
    //                                       container.getComponent('container').getDisplayMatrix(), 
    //                                       entity.getComponent('transform').getGlobalMatrix());

    // while (!isInside && i--) {
    //     v = verticies[i];
    //     if (target.getOrigin) {
    //         origin  = target.getOrigin();
    //         v[0]   -= size[0] * origin[0];
    //         v[1]   -= size[1] * origin[1];
    //     }
    //     MatrixMath.applyToVector(vertexScratch, ft, v);
    //     if (origin) {
    //         v[0] += size[0] * origin[0];
    //         v[1] += size[1] * origin[1];
    //     }
    //     x = vertexScratch[0] / vertexScratch[3];
    //     y = vertexScratch[1] / vertexScratch[3];
    //     isInside = x <= ( displaySize[0] / 2) &&
    //                y <= ( displaySize[1] / 2) &&
    //                x >= (-displaySize[0] / 2) &&
    //                y >= (-displaySize[1] / 2);
    // } 
    // return isInside;
    return true;
}

/**
 * RenderSystem is responsible for keeping track of the various renderers
 *  and feeding them 
 *
 *
 * @class RenderSystem
 * @system
 */
var RenderSystem = {};

RenderSystem.update = function update() {
    var targets             = Object.keys(targetsToRenderers),
        rendererNames       = Object.keys(renderers),
        target              = null,
        entity              = null,
        container           = null,
        targetName          = void 0,
        containerEnts       = containers.entities,
        entities            = renderables.entities,
        i                   = entities.length,
        targetsLength       = targets.length,
        containerEntLengths = containerEnts.length,
        renderersLength     = 0,
        j                   = toDeploy.length,
        k                   = 0,
        l                   = 0;

    // Update the Container if its transform or size are dirty.
    containers.forEach(function(entity) {
        container = entity.getComponent('container');
        if (entity.getContext() && (container._transformDirty || container._sizeDirty)) renderers.DOM.updateContainer(entity);
    });

    while (j--) deployContainer(toDeploy.pop());

    // For all of the renderables
    while (i--) {
        j      = targetsLength;
        entity = entities[i];
        if (!entity.getContext()) continue;

        // For each renderer
        while (j--) {
            target = entity.getComponent(targets[j]);
            if (!target) continue; // skip if this Renderable does not container the proper target component for this renderer

            k = containerEntLengths;

            if (k) {
                targetName      = target.constructor.toString();
                renderersLength = targetsToRenderers[targetName].length;

                // For each container
                while (k--) {
                    l          = renderersLength;
                    container  = containerEnts[k];

                    // If the target is in the Container
                    if (_isWithin(target, entity, container)) {
                        // Decide if to deploy  and update or just update
                        if (target._isWithin(container)) {
                            while (l--) targetsToRenderers[targetName][l].update(entity, container);
                        } else {
                            while (l--) targetsToRenderers[targetName][l].deploy(entity, container);
                            target._addToContainer(container);
                        }
                    } else if (target._isWithin(container)) { // If the target is culled recall it
                        while (l--) targetsToRenderers[targetName][l].recall(entity, container);
                        target._removeFromContainer(container);
                    }
                }
            }

            // Reset the invalidations after all of the logic for 
            // a particular target 
            if (target.resetInvalidations) target.resetInvalidations();
        }
    }

    // Have each renderer run
    i = rendererNames.length;
    while (i--) renderers[rendererNames[i]].render();
};

/**
 * Add a new renderer which will be called every frame.
 *
 * @method register
 *
 * @param {String} name name of the renderer
 * @param {Object} renderer singleton renderer object
 */
RenderSystem.register = function register(name, renderer) {
    if (renderers[name] != null) return false;

    renderers[name] = renderer;

    var targets = renderer.getTargets(),
        i       = targets.length;

    while (i--) {
        if (targetsToRenderers[targets[i]] == null) targetsToRenderers[targets[i]] = [];
        targetsToRenderers[targets[i]].push(renderer);
    }

    return true;
};

module.exports = RenderSystem;

},{"../../math/4x4matrix":"/Users/ftripier/Code/Games/One/Libraries/MixedMode/src/famous/math/4x4matrix.js","../EntityRegistry":"/Users/ftripier/Code/Games/One/Libraries/MixedMode/src/famous/core/EntityRegistry.js","../OptionsManager":"/Users/ftripier/Code/Games/One/Libraries/MixedMode/src/famous/core/OptionsManager.js"}],"/Users/ftripier/Code/Games/One/Libraries/MixedMode/src/famous/core/Systems/TimeSystem.js":[function(require,module,exports){
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Owners: dan@famo.us
 *         felix@famo.us
 *         mike@famo.us
 *
 * @license MPL 2.0
 * @copyright Famous Industries, Inc. 2014
 */

 'use strict';

var previousTime       = 0, 
    delta              = 0,
    initializationTime = Date.now(),
    currentTime        = initializationTime,
    relativeTime       = initializationTime,
    absoluteTime       = initializationTime,
    previousRelFrame   = 0;

/**
 * TimeSystem is responsible for determining the current moment.
 *
 * @class TimeSystem
 * @system
 */
var TimeSystem = {};

/**
 * Update the time based on the frame data from the Engine.
 *
 * @method update
 *
 * @param {Number} relFrame 
 */
TimeSystem.update = function update(relFrame) {
    previousTime     = currentTime;
    currentTime      = Date.now();
    delta            = currentTime - previousTime;
    relativeTime    += delta * (relFrame - previousRelFrame);
    absoluteTime    += delta;
    previousRelFrame = relFrame;
};

/**
 * Get relative time in ms offfset by the speed at which the Engine is running.
 *
 * @method getRelativeTime
 *
 * @return {Number} the time accounting for Engine's run speed
 */
TimeSystem.getRelativeTime = function getRelativeTime() {
    return relativeTime;
};

/**
 * Get absolute time.
 *
 * @method getAbsoluteTime
 *
 * @return {Number} the time in ms
 */
TimeSystem.getAbsoluteTime = function getAbsoluteTime() {
    return absoluteTime;
};

/**
 * Get the time in which the Engine was instantiated.
 *
 * @method getInitialTime
 *
 * @return {Number} the time in ms
 */
TimeSystem.getInitialTime = function getInitialTime() {
    return initializationTime;
};

/**
 * Get elapsed time since instantiation accounting for Engine speed
 *
 * @method getElapsedRelativeTime
 *
 * @return {Number} the time in ms
 */
TimeSystem.getElapsedRelativeTime = function getElapsedRelativeTime() {
    return relativeTime - initializationTime;
};

/**
 * Get absolute elapsed time since instantiation
 *
 * @method getElapsedAbsoluteTime
 *
 * @return {Number} the time in ms
 */
TimeSystem.getElapsedAbsoluteTime = function getElapsedAbsoluteTime() {
    return absoluteTime - initializationTime;
};

/**
 * Get the time between this frame and last.
 *
 * @method getDelta
 *
 * @return {Number} the time in ms
 */
TimeSystem.getDelta = function getDelta() {
    return delta;
};

module.exports = TimeSystem;

},{}],"/Users/ftripier/Code/Games/One/Libraries/MixedMode/src/famous/core/components/Target.js":[function(require,module,exports){
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Owners: dan@famo.us
 *
 * @license MPL 2.0
 * @copyright Famous Industries, Inc. 2014
 */

'use strict';

var MatrixMath = require('../../math/4x4matrix');

/**
 * Target is the base class for all renderables.  It holds the state of
 *   its verticies, the Containers it is deployed in, the Context it belongs
 *   to, and whether or not origin alignment needs to be applied.
 *
 * @component Target
 * @constructor
 *
 * @param {Entity} entity  Entity that the Target is a component of
 * @param {Object} options options
 */
function Target(entity, options) {
    this.verticies  = options.verticies || [];
    this.containers = {};
    // this.context    = entity.getContext()._id;
    this._hasOrigin = false;
}

/**
 * Get the verticies of the Target.
 *
 * @method getVerticies
 *
 * @return {Array} array of the verticies represented as three element arrays [x, y, z]
 */
Target.prototype.getVerticies = function getVerticies(){
    return this.verticies;
};

/**
 * Determines whether a Target was deployed to a particular container
 *
 * @method _isWithin
 *
 * @param {Number} the id of the Container's Entity
 * @return {Boolean} whether or now the Target was deployed to this particular Container
 */
Target.prototype._isWithin = function _isWithin(container) {
    return this.containers[container._id];
};

/**
 * Mark a Container as having a deployed instance of the Target
 *
 * @method _addToContainer
 *
 * @param {Number} the id of the Container's Entity
 * @return {Boolean} staus of the addition
 */
Target.prototype._addToContainer = function _addToContainer(container) {
    this.containers[container._id] = true;
    return true;
};

/**
 * Unmark a Container as having a deployed instance of the Target
 *
 * @method _removeFromContainer
 *
 * @param {Number} the id of the Container's Entity
 * @return {Boolean} staus of the removal
 */
Target.prototype._removeFromContainer = function _removeFromContainer(container) {
    this.containers[container._id] = false;
    return true;
};

module.exports = Target;

},{"../../math/4x4matrix":"/Users/ftripier/Code/Games/One/Libraries/MixedMode/src/famous/math/4x4matrix.js"}],"/Users/ftripier/Code/Games/One/Libraries/MixedMode/src/famous/events/EventEmitter.js":[function(require,module,exports){
/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/.
*
* Owner: mark@famo.us
* @license MPL 2.0
* @copyright Famous Industries, Inc. 2014
*/

'use strict';

/**
 * EventEmitter represents a channel for events.
 *
 * @class EventEmitter
 * @constructor
 */
function EventEmitter() {
    this.listeners = {};
    this._owner = this;
}

/**
 * Trigger an event, sending to all downstream handlers
 *   listening for provided 'type' key.
 *
 * @method emit
 *
 * @param {string} type event type key (for example, 'click')
 * @param {Object} event event data
 * @return {EventHandler} this
 */
EventEmitter.prototype.emit = function emit(type, event) {
    var handlers = this.listeners[type];
    if (handlers) {
        for (var i = 0; i < handlers.length; i++) {
            handlers[i].call(this._owner, event);
        }
    }
    return this;
};

/**
 * Bind a callback function to an event type handled by this object.
 *
 * @method "on"
 *
 * @param {string} type event type key (for example, 'click')
 * @param {function(string, Object)} handler callback
 * @return {EventHandler} this
 */
EventEmitter.prototype.on = function on(type, handler) {
    if (!(type in this.listeners)) this.listeners[type] = [];
    var index = this.listeners[type].indexOf(handler);
    if (index < 0) this.listeners[type].push(handler);
    return this;
};

/**
 * Alias for "on".
 * @method addListener
 */
EventEmitter.prototype.addListener = EventEmitter.prototype.on;

/**
 * Unbind an event by type and handler.
 *   This undoes the work of "on".
 *
 * @method removeListener
 *
 * @param {string} type event type key (for example, 'click')
 * @param {function} handler function object to remove
 * @return {EventEmitter} this
 */
EventEmitter.prototype.removeListener = function removeListener(type, handler) {
    var index = this.listeners[type].indexOf(handler);
    if (index >= 0) this.listeners[type].splice(index, 1);
    return this;
};

/**
 * Call event handlers with this set to owner.
 *
 * @method bindThis
 *
 * @param {Object} owner object this EventEmitter belongs to
 */
EventEmitter.prototype.bindThis = function bindThis(owner) {
    this._owner = owner;
};

module.exports = EventEmitter;

},{}],"/Users/ftripier/Code/Games/One/Libraries/MixedMode/src/famous/events/EventHandler.js":[function(require,module,exports){
/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/.
*
* Owner: mark@famo.us
* @license MPL 2.0
* @copyright Famous Industries, Inc. 2014
*/

'use strict';

var EventEmitter = require('./EventEmitter');

/**
 * EventHandler forwards received events to a set of provided callback functions.
 * It allows events to be captured, processed, and optionally piped through to other event handlers.
 *
 * @class EventHandler
 * @extends EventEmitter
 * @constructor
 */
function EventHandler() {
    EventEmitter.apply(this, arguments);

    this.downstream = []; // downstream event handlers
    this.downstreamFn = []; // downstream functions

    this.upstream = []; // upstream event handlers
    this.upstreamListeners = {}; // upstream listeners
}
EventHandler.prototype = Object.create(EventEmitter.prototype);
EventHandler.prototype.constructor = EventHandler;

/**
 * Assign an event handler to receive an object's input events.
 *
 * @method setInputHandler
 * @static
 *
 * @param {Object} object object to mix trigger, subscribe, and unsubscribe functions into
 * @param {EventHandler} handler assigned event handler
 */
EventHandler.setInputHandler = function setInputHandler(object, handler) {
    object.trigger = handler.trigger.bind(handler);
    if (handler.subscribe && handler.unsubscribe) {
        object.subscribe = handler.subscribe.bind(handler);
        object.unsubscribe = handler.unsubscribe.bind(handler);
    }
};

/**
 * Assign an event handler to receive an object's output events.
 *
 * @method setOutputHandler
 * @static
 *
 * @param {Object} object object to mix pipe, unpipe, on, addListener, and removeListener functions into
 * @param {EventHandler} handler assigned event handler
 */
EventHandler.setOutputHandler = function setOutputHandler(object, handler) {
    if (handler instanceof EventHandler) handler.bindThis(object);
    object.pipe = handler.pipe.bind(handler);
    object.unpipe = handler.unpipe.bind(handler);
    object.on = handler.on.bind(handler);
    object.addListener = object.on;
    object.removeListener = handler.removeListener.bind(handler);
};

/**
 * Trigger an event, sending to all downstream handlers
 *   listening for provided 'type' key.
 *
 * @method emit
 *
 * @param {string} type event type key (for example, 'click')
 * @param {Object} event event data
 * @return {EventHandler} this
 */
EventHandler.prototype.emit = function emit(type, event) {
    EventEmitter.prototype.emit.apply(this, arguments);
    var i = 0;
    for (i = 0; i < this.downstream.length; i++) {
        if (this.downstream[i].trigger) this.downstream[i].trigger(type, event);
    }
    for (i = 0; i < this.downstreamFn.length; i++) {
        this.downstreamFn[i](type, event);
    }
    return this;
};

/**
 * Alias for emit
 * @method addListener
 */
EventHandler.prototype.trigger = EventHandler.prototype.emit;

/**
 * Add event handler object to set of downstream handlers.
 *
 * @method pipe
 *
 * @param {EventHandler} target event handler target object
 * @return {EventHandler} passed event handler
 */
EventHandler.prototype.pipe = function pipe(target) {
    if (target.subscribe instanceof Function) return target.subscribe(this);

    var downstreamCtx = (target instanceof Function) ? this.downstreamFn : this.downstream;
    var index = downstreamCtx.indexOf(target);
    if (index < 0) downstreamCtx.push(target);

    if (target instanceof Function) target('pipe', null);
    else if (target.trigger) target.trigger('pipe', null);

    return target;
};

/**
 * Remove handler object from set of downstream handlers.
 *   Undoes work of "pipe".
 *
 * @method unpipe
 *
 * @param {EventHandler} target target handler object
 * @return {EventHandler} provided target
 */
EventHandler.prototype.unpipe = function unpipe(target) {
    if (target.unsubscribe instanceof Function) return target.unsubscribe(this);

    var downstreamCtx = (target instanceof Function) ? this.downstreamFn : this.downstream;
    var index = downstreamCtx.indexOf(target);
    if (index >= 0) {
        downstreamCtx.splice(index, 1);
        if (target instanceof Function) target('unpipe', null);
        else if (target.trigger) target.trigger('unpipe', null);
        return target;
    }
    else return false;
};

/**
 * Bind a callback function to an event type handled by this object.
 *
 * @method "on"
 *
 * @param {string} type event type key (for example, 'click')
 * @param {function(string, Object)} handler callback
 * @return {EventHandler} this
 */
EventHandler.prototype.on = function on(type, handler) {
    EventEmitter.prototype.on.apply(this, arguments);
    if (!(type in this.upstreamListeners)) {
        var upstreamListener = this.trigger.bind(this, type);
        this.upstreamListeners[type] = upstreamListener;
        for (var i = 0; i < this.upstream.length; i++) {
            this.upstream[i].on(type, upstreamListener);
        }
    }
    return this;
};

/**
 * Alias for "on"
 * @method addListener
 */
EventHandler.prototype.addListener = EventHandler.prototype.on;

/**
 * Listen for events from an upstream event handler.
 *
 * @method subscribe
 *
 * @param {EventEmitter} source source emitter object
 * @return {EventHandler} this
 */
EventHandler.prototype.subscribe = function subscribe(source) {
    var index = this.upstream.indexOf(source);
    if (index < 0) {
        this.upstream.push(source);
        for (var type in this.upstreamListeners) {
            source.on(type, this.upstreamListeners[type]);
        }
    }
    return this;
};

/**
 * Stop listening to events from an upstream event handler.
 *
 * @method unsubscribe
 *
 * @param {EventEmitter} source source emitter object
 * @return {EventHandler} this
 */
EventHandler.prototype.unsubscribe = function unsubscribe(source) {
    var index = this.upstream.indexOf(source);
    if (index >= 0) {
        this.upstream.splice(index, 1);
        for (var type in this.upstreamListeners) {
            source.removeListener(type, this.upstreamListeners[type]);
        }
    }
    return this;
};

module.exports = EventHandler;

},{"./EventEmitter":"/Users/ftripier/Code/Games/One/Libraries/MixedMode/src/famous/events/EventEmitter.js"}],"/Users/ftripier/Code/Games/One/Libraries/MixedMode/src/famous/gl/geometry.js":[function(require,module,exports){
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Owners: adnan@famo.us
 *
 * @license MPL 2.0
 * @copyright Famous Industries, Inc. 2014
 */

 'use strict';

var TRANSFORM = 'transform';
var SIZE = 'size';
var OPACITY = 'opacity';
var MATERIALS = 'materials';

var Vector = require('./vector');
var Indexer = require('./indexer');
var EntityRegistry = require('../core/EntityRegistry');
var Target = require('../core/components/Target');

/**
 * Geometry is a component that defines the data that should
 *   be drawn to the webGL canvas. Manages vertex data and attributes.
 *
 * @class Geometry
 * @component
 * @constructor
 * 
 * @param {Entity} entity Entity that the Geometry is a component of
 * @param {Object} options instantiation options
 */

function Geometry(entity, options) {
    Target.call(this, entity, {
        verticies: [new Float32Array([0, 0, 0, 1]),
                    new Float32Array([0, 0, 0, 1]),
                    new Float32Array([0, 0, 0, 1]),
                    new Float32Array([0, 0, 0, 1])]
    });

    options = options || {};

    EntityRegistry.register(entity, 'Geometries');
    EntityRegistry.register(entity, 'Renderables');
    
    this.entity = entity;
    this.chunks = {};
    this.vertexBuffers = {};
    this.indexBuffers = {};
    this.addVertexBuffer('vertices', 'a_pos');
    this.addVertexBuffer('coords', 'a_texCoord');
    this.addVertexBuffer('normals', 'a_normal');
    if (options.colors) this.addVertexBuffer('colors', 'a_color');
    if (!('triangles' in options) || options.triangles) this.addIndexBuffer('triangles');
    if (options.lines) this.addIndexBuffer('lines');
    this.spec = {
        primitive: 'triangles',
        resolution: [innerWidth / 2, innerHeight / 2],
        mouse: [0,0],
        brightness: 1, 
        opacity: 1,
        origin: [.5, .5],
        geometry: {
            vertexBuffers: this.vertexBuffers,
            indexBuffers: this.indexBuffers
        }
    };
}

Geometry.toString =  function () {
    return 'geometry';
};


Geometry.prototype = Object.create(Target.prototype);
Geometry.prototype.addVertexBuffer = function addVertexBuffer(name, attribute) {
    var buffer = this.vertexBuffers[attribute] = new Buffer(gl.ARRAY_BUFFER, Float32Array);
    buffer.name = name;
    this[name] = [];
};

Geometry.prototype.addIndexBuffer = function addIndexBuffer(name) {
    var buffer = this.indexBuffers[name] = new Buffer(gl.ELEMENT_ARRAY_BUFFER, Uint16Array);
    this[name] = [];
};

Geometry.prototype.compile = function compile() {
    for (var attribute in this.vertexBuffers) {
        var buffer = this.vertexBuffers[attribute];
        buffer.data = this[buffer.name];
        buffer.compile();
    }

    for (var name in this.indexBuffers) {
        var buffer = this.indexBuffers[name];
        buffer.data = this[name];
        buffer.compile();
    }
};

Geometry.prototype.addNormals = function addNormals() {
    if (!this.normals) this.addVertexBuffer('normals', 'gl_Normal');
    for (var i = 0; i < this.vertices.length; i++) {
        this.normals[i] = new Vector();
    }
    for (var i = 0; i < this.triangles.length; i++) {
        var t = this.triangles[i];
        var a = Vector.fromArray(this.vertices[t[0]]);
        var b = Vector.fromArray(this.vertices[t[1]]);
        var c = Vector.fromArray(this.vertices[t[2]]);
        var normal = b.sub(a).cross(c.sub(a)).normalize();
        this.normals[t[0]] = this.normals[t[0]].add(normal);
        this.normals[t[1]] = this.normals[t[1]].add(normal);
        this.normals[t[2]] = this.normals[t[2]].add(normal);
    }
    for (var i = 0; i < this.vertices.length; i++) {
        this.normals[i] = this.normals[i].normalize().toArray();
    }
    this.compile();
    return this;
};

Geometry.prototype.constructor = Geometry;

Geometry.prototype.render = function () {
    var transform = this.entity.getComponent(TRANSFORM);
    var opacity = this.entity.getComponent(OPACITY);
    var surface = this.entity.getComponent('surface');

    this.spec.transform = transform.getGlobalMatrix();
    this.spec.opacity = opacity ? opacity._globalOpacity : 1; 
    
    if (surface) this.spec.origin = surface.spec.origin;

    return this.spec;
};

Geometry.prototype.loadFromObj = function loadFromObj(url, options) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.onload = function () {
        loadObj.call(this, xhr.responseText, options.scale || .005, options.offset || [0, 0, 0]);
        this.compile();
    }.bind(this);
    xhr.send(null);

    return this;
};

function loadObj(obj, scale, offset) { 
        var vts = []; 
        var nml = []; 
        var indv = [];         
        var indt = []; 
        var indn = []; 
        var txc = [];     
        var lines = obj.split('\n');     
        for(var i = 0; i < lines.length; i++) {
            var line = lines[i]; 
            if (line.indexOf('v ') !== -1) { 
                var vertex = line.split(' '); 
                var vx = parseFloat(vertex[1]) * scale + offset[0]; 
                var vy = parseFloat(vertex[2]) * scale + offset[1]; 
                var vz = parseFloat(vertex[3]) * scale + offset[2]; 
                vts.push([vx, vy, vz]);                 
            }   
            else if (line.indexOf('vt ') !== -1) {                
                var texcoord = line.split(' ');       
                var tx = parseFloat(texcoord[1]); 
                var ty = parseFloat(texcoord[2]); 
                txc.push([tx, ty]);                                 
            }
            else if (line.indexOf('vn ') !== -1) {
                var normal = line.split(' ');                       
                var nx = parseFloat(normal[1]); 
                var ny = parseFloat(normal[2]); 
                var nz = parseFloat(normal[3]);                 
                nml.push([nx, ny, nz]);                  
            }
            else if (line.indexOf('f ') !== -1) {
                var index = line.split(' ');     
                
                if (index[1].indexOf('//') !== -1) {                 
                    var i1 = index[1].split('//'); 
                    var i2 = index[2].split('//'); 
                    var i3 = index[3].split('//'); 
                    indv.push(parseFloat(i1[0]) -1, parseFloat(i2[0]) - 1, parseFloat(i3[0]) - 1); 
                    indn.push(parseFloat(i1[1]) -1, parseFloat(i2[1]) - 1, parseFloat(i3[1]) - 1); 
                }
                else if (index[1].indexOf('/') !== -1) {                    
                    var i1 = index[1].split('/'); 
                    var i2 = index[2].split('/'); 
                    var i3 = index[3].split('/');                   
                    indv.push(parseFloat(i1[0]) - 1, parseFloat(i2[0]) - 1, parseFloat(i3[0]) - 1); 
                    indt.push(parseFloat(i1[1]) - 1, parseFloat(i2[1]) - 1, parseFloat(i3[1]) - 1);                     
                    indn.push(parseFloat(i1[2]) - 1, parseFloat(i2[2]) - 1, parseFloat(i3[2]) - 1); 
                }
                else {                                     
                    indv.push(parseFloat(index[1]) - 1, parseFloat(index[2]) - 1, parseFloat(index[3]) - 1); 
                }    
            }
        }        

    makeProperArray(indv, vts);
    this.vertices = vts;
    //this.normals = makeProperArray(indn, nml); 
    //this.coords = makeProperArray(indt, txc); 

};    

function makeProperArray(indices, array) {            
    var output = []; 
    for(var i = 0; i < indices.length; i++) {
        var temp = array[indices[i]]; 
        for(var j = 0; j < temp.length; j++)
            output.push(temp[j]);     
    } 
    return output; 
}

/**
 * Buffer is a private object that stores references to pass data from
 * a typed array to a VBO.
 *
 * @class Geometry
 * @component
 * @constructor
 * 
 * @param {Target} Location of the vertex data that is being uploaded to gl.
 * @param {Type} Contstructor for the typed array which will store data passed from the application.
 */

function Buffer(target, type) {
    this.buffer = null;
    this.target = target;
    this.type = type;
    this.data = [];
}

Buffer.prototype = {
    compile: function(type) {
        var data = [];
        for (var i = 0, chunk = 10000; i < this.data.length; i += chunk) {
            data = Array.prototype.concat.apply(data, this.data.slice(i, i + chunk));
        }
        var spacing = this.data.length ? data.length / this.data.length : 0;
        if (spacing != Math.round(spacing)) throw 'buffer elements not of consistent size, average size is ' + spacing;
        this.buffer = this.buffer || gl.createBuffer();
        this.buffer.length = data.length;
        this.buffer.spacing = spacing;
        gl.bindBuffer(this.target, this.buffer);
        gl.bufferData(this.target, new this.type(data), type || gl.STATIC_DRAW);
    }
};

module.exports = Geometry;

},{"../core/EntityRegistry":"/Users/ftripier/Code/Games/One/Libraries/MixedMode/src/famous/core/EntityRegistry.js","../core/components/Target":"/Users/ftripier/Code/Games/One/Libraries/MixedMode/src/famous/core/components/Target.js","./indexer":"/Users/ftripier/Code/Games/One/Libraries/MixedMode/src/famous/gl/indexer.js","./vector":"/Users/ftripier/Code/Games/One/Libraries/MixedMode/src/famous/gl/vector.js"}],"/Users/ftripier/Code/Games/One/Libraries/MixedMode/src/famous/gl/indexer.js":[function(require,module,exports){
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Owners: adnan@famo.us
 *
 * @license MPL 2.0
 * @copyright Famous Industries, Inc. 2014
 */

 'use strict';

function Indexer() {
    this.unique = [];
    this.indices = [];
    this.map = {};
}

Indexer.prototype = {
    add: function(obj) {
        var key = JSON.stringify(obj);
        if (! (key in this.map)) {
            this.map[key] = this.unique.length;
            this.unique.push(obj);
        }
        return this.map[key];
    }
};

module.exports = Indexer;

},{}],"/Users/ftripier/Code/Games/One/Libraries/MixedMode/src/famous/gl/shader.js":[function(require,module,exports){
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Owners: adnan@famo.us
 *
 * @license MPL 2.0
 * @copyright Famous Industries, Inc. 2014
 */

'use strict';

module.exports = function (gl) {
    function regexMap(regex, text, callback) {
        var result;
        while ((result = regex.exec(text)) != null) callback(result);
    }
    
    function Shader(vertexSource, fragmentSource) {
        this.vs = vertexSource;
        this.fs = fragmentSource;

        var header = ['precision mediump float;',
                      'uniform mat4 transform;',
                      'uniform mat4 perspective;',
                      'uniform float focalDepth;',
                      'uniform vec3 size;',
                      'uniform vec3 resolution;',
                      'uniform vec2 origin;',
                      'uniform sampler2D texture;',
                      'uniform float brightness;',
                      'uniform float opacity;',
                      'uniform float clock;',
                      'uniform vec2 mouse;',
                      'varying vec3 v_normal;'
                     ].join('\n');
        
        var vertexHeader = header + [
            'attribute vec4 a_pos;',
            'attribute vec4 a_uv;',
            'attribute vec3 a_normal;',
            'attribute vec4 a_color;'
        ].join('\n');

        var fragmentHeader = header + '';
        vertexSource = vertexHeader  + vertexSource;
        fragmentSource = fragmentHeader + fragmentSource;

        function compileSource(type, source) {
            var shader = gl.createShader(type);
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                var i =  1;
                console.log(source.replace(/\n/g, function () { return '\n' + (i++) + ': '; }));
                throw 'compile error: ' + gl.getShaderInfoLog(shader);
            }
            return shader;
        }
        
        this.program = gl.createProgram();
        gl.attachShader(this.program, compileSource(gl.VERTEX_SHADER, vertexSource));
        gl.attachShader(this.program, compileSource(gl.FRAGMENT_SHADER, fragmentSource));
        gl.linkProgram(this.program);
        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            throw 'link error: ' + gl.getProgramInfoLog(this.program);
        }
        this.attributes = {};
        this.uniformLocations = {};

        var isSampler = this.isSampler = {};

        regexMap(/uniform\s+sampler(1D|2D|3D|Cube)\s+(\w+)\s*;/g, vertexSource + fragmentSource,
                 function(groups) { isSampler[groups[2]] = 1; }
                );
        
    }

    function isNumber(n) {
        return ! isNaN(parseFloat(n)) && isFinite(n);
    }

    Shader.prototype = {
        uniforms: function(uniforms) {
            gl.useProgram(this.program);

            for (var name in uniforms) {
                var location = this.uniformLocations[name] || gl.getUniformLocation(this.program, name);
                if (!location) continue;
                this.uniformLocations[name] = location;
                var value = uniforms[name];
                if (Array.isArray(value) || value instanceof Float32Array) {
                    switch (value.length) {
                    case 1: gl.uniform1fv(location, new Float32Array(value)); break;
                    case 2: gl.uniform2fv(location, new Float32Array(value)); break;
                    case 3: gl.uniform3fv(location, new Float32Array(value)); break;
                    case 4: gl.uniform4fv(location, new Float32Array(value)); break;
                    case 9: gl.uniformMatrix3fv(location, false, new Float32Array(value)); break;
                    case 16: gl.uniformMatrix4fv(location, false, new Float32Array(value)); break;
                    default: throw 'dont know how to load uniform "' + name + '" of length ' + value.length;
                    }
                } else if (isNumber(value)) {
                    (this.isSampler[name] ? gl.uniform1i : gl.uniform1f).call(gl, location, value);
                } else {
                    throw 'attempted to set uniform "' + name + '" to invalid value ' + value;
                }
            }

            return this;
        },

        draw: function(mesh, mode) {
            this.drawBuffers(mesh.vertexBuffers,
                             mesh.indexBuffers[mode == gl.LINES ? 'lines' : 'triangles'],
                             arguments.length < 2 ? gl.TRIANGLES : mode);
        },

        drawBuffers: function(vertexBuffers, indexBuffer, mode) {
            var length = 0;
            for (var attribute in vertexBuffers) {
                var buffer = vertexBuffers[attribute];
                var location = this.attributes[attribute] ||
                        gl.getAttribLocation(this.program, attribute);
                if (location == -1 || !buffer.buffer) continue;
                this.attributes[attribute] = location;
                gl.bindBuffer(gl.ARRAY_BUFFER, buffer.buffer);
                gl.enableVertexAttribArray(location);
                gl.vertexAttribPointer(location, buffer.buffer.spacing, gl.FLOAT, gl.FALSE, 0, 0);
                length = buffer.buffer.length / buffer.buffer.spacing;
            }

            for (var attribute in this.attributes) {
                if (!(attribute in vertexBuffers))
                    gl.disableVertexAttribArray(this.attributes[attribute]);
            }

            if (length && (!indexBuffer || indexBuffer.buffer)) {
                if (indexBuffer) {
                    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer.buffer);
                    gl.drawElements(mode, indexBuffer.buffer.length, gl.UNSIGNED_SHORT, 0);
                } else {
                    gl.drawArrays(mode, 0, length);
                }
            }

            return this;
        }
    };
    return Shader;
};

},{}],"/Users/ftripier/Code/Games/One/Libraries/MixedMode/src/famous/gl/vector.js":[function(require,module,exports){
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Owner: david@famo.us
 *
 * @license MPL 2.0
 * @copyright Famous Industries, Inc. 2014
 */

'use strict';

/**
 * Three-element floating point vector.
 *
 * @class Vector
 * @constructor
 *
 * @param {number} x x element value
 * @param {number} y y element value
 * @param {number} z z element value
 */

function Vector(x,y,z) {
    if (arguments.length === 1) this.set(x);
    else {
        this.x = x || 0;
        this.y = y || 0;
        this.z = z || 0;
    }
    return this;
}
var _register = new Vector(0,0,0);

/**
 * Add this element-wise to another Vector, element-wise.
 *   Note: This sets the internal result register, so other references to that vector will change.
 *
 * @method add
 * @param {Vector} v addend
 * @return {Vector} vector sum
 */
Vector.prototype.add = function add(v) {
    return _setXYZ.call(_register,
                        this.x + v.x,
                        this.y + v.y,
                        this.z + v.z
                       );
};

/**
 * Subtract another vector from this vector, element-wise.
 *   Note: This sets the internal result register, so other references to that vector will change.
 *
 * @method sub
 * @param {Vector} v subtrahend
 * @return {Vector} vector difference
 */
Vector.prototype.sub = function sub(v) {
    return _setXYZ.call(_register,
                        this.x - v.x,
                        this.y - v.y,
                        this.z - v.z
                       );
};

/**
 * Scale Vector by floating point r.
 *   Note: This sets the internal result register, so other references to that vector will change.
 *
 * @method mult
 *
 * @param {number} r scalar
 * @return {Vector} vector result
 */
Vector.prototype.mult = function mult(r) {
    return _setXYZ.call(_register,
                        r * this.x,
                        r * this.y,
                        r * this.z
                       );
};

/**
 * Scale Vector by floating point 1/r.
 *   Note: This sets the internal result register, so other references to that vector will change.
 *
 * @method div
 *
 * @param {number} r scalar
 * @return {Vector} vector result
 */
Vector.prototype.div = function div(r) {
    return this.mult(1 / r);
};

/**
 * Given another vector v, return cross product (v)x(this).
 *   Note: This sets the internal result register, so other references to that vector will change.
 *
 * @method cross
 * @param {Vector} v Left Hand Vector
 * @return {Vector} vector result
 */
Vector.prototype.cross = function cross(v) {
    var x = this.x;
    var y = this.y;
    var z = this.z;
    var vx = v.x;
    var vy = v.y;
    var vz = v.z;

    return _setXYZ.call(_register,
                        z * vy - y * vz,
                        x * vz - z * vx,
                        y * vx - x * vy
                       );
};

/**
 * Component-wise equality test between this and Vector v.
 * @method equals
 * @param {Vector} v vector to compare
 * @return {boolean}
 */
Vector.prototype.equals = function equals(v) {
    return (v.x === this.x && v.y === this.y && v.z === this.z);
};

/**
 * Rotate clockwise around x-axis by theta radians.
 *   Note: This sets the internal result register, so other references to that vector will change.
 * @method rotateX
 * @param {number} theta radians
 * @return {Vector} rotated vector
 */
Vector.prototype.rotateX = function rotateX(theta) {
    var x = this.x;
    var y = this.y;
    var z = this.z;

    var cosTheta = Math.cos(theta);
    var sinTheta = Math.sin(theta);

    return _setXYZ.call(_register,
                        x,
                        y * cosTheta - z * sinTheta,
                        y * sinTheta + z * cosTheta
                       );
};

/**
 * Rotate clockwise around y-axis by theta radians.
 *   Note: This sets the internal result register, so other references to that vector will change.
 * @method rotateY
 * @param {number} theta radians
 * @return {Vector} rotated vector
 */
Vector.prototype.rotateY = function rotateY(theta) {
    var x = this.x;
    var y = this.y;
    var z = this.z;

    var cosTheta = Math.cos(theta);
    var sinTheta = Math.sin(theta);

    return _setXYZ.call(_register,
                        z * sinTheta + x * cosTheta,
                        y,
                        z * cosTheta - x * sinTheta
                       );
};

/**
 * Rotate clockwise around z-axis by theta radians.
 *   Note: This sets the internal result register, so other references to that vector will change.
 * @method rotateZ
 * @param {number} theta radians
 * @return {Vector} rotated vector
 */
Vector.prototype.rotateZ = function rotateZ(theta) {
    var x = this.x;
    var y = this.y;
    var z = this.z;

    var cosTheta = Math.cos(theta);
    var sinTheta = Math.sin(theta);

    return _setXYZ.call(_register,
                        x * cosTheta - y * sinTheta,
                        x * sinTheta + y * cosTheta,
                        z
                       );
};

/**
 * Return dot product of this with a second Vector
 * @method dot
 * @param {Vector} v second vector
 * @return {number} dot product
 */
Vector.prototype.dot = function dot(v) {
    return this.x * v.x + this.y * v.y + this.z * v.z;
};

/**
 * Return squared length of this vector
 * @method normSquared
 * @return {number} squared length
 */
Vector.prototype.normSquared = function normSquared() {
    return this.dot(this);
};

/**
 * Return length of this vector
 * @method norm
 * @return {number} length
 */
Vector.prototype.norm = function norm() {
    return Math.sqrt(this.normSquared());
};

/**
 * Scale Vector to specified length.
 *   If length is less than internal tolerance, set vector to [length, 0, 0].
 *   Note: This sets the internal result register, so other references to that vector will change.
 * @method normalize
 *
 * @param {number} length target length, default 1.0
 * @return {Vector}
 */
Vector.prototype.normalize = function normalize(length) {
    if (arguments.length === 0) length = 1;
    var norm = this.norm();

    if (norm > 1e-7) return _setFromVector.call(_register, this.mult(length / norm));
    else return _setXYZ.call(_register, length, 0, 0);
};

/**
 * Make a separate copy of the Vector.
 *
 * @method clone
 *
 * @return {Vector}
 */
Vector.prototype.clone = function clone() {
    return new Vector(this);
};

/**
 * True if and only if every value is 0 (or falsy)
 *
 * @method isZero
 *
 * @return {boolean}
 */
Vector.prototype.isZero = function isZero() {
    return !(this.x || this.y || this.z);
};

function _setXYZ(x,y,z) {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
}

function _setFromArray(v) {
    return _setXYZ.call(this,v[0],v[1],v[2] || 0);
}

function _setFromVector(v) {
    return _setXYZ.call(this, v.x, v.y, v.z);
}

function _setFromNumber(x) {
    return _setXYZ.call(this,x,0,0);
}

/**
 * Set this Vector to the values in the provided Array or Vector.
 *
 * @method set
 * @param {object} v array, Vector, or number
 * @return {Vector} this
 */
Vector.prototype.set = function set(v) {
    if (v instanceof Array)    return _setFromArray.call(this, v);
    if (v instanceof Vector)   return _setFromVector.call(this, v);
    if (typeof v === 'number') return _setFromNumber.call(this, v);
};

Vector.prototype.setXYZ = function(x,y,z) {
    return _setXYZ.apply(this, arguments);
};

Vector.prototype.set1D = function(x) {
    return _setFromNumber.call(this, x);
};

/**
 * Put result of last internal register calculation in specified output vector.
 *
 * @method put
 * @param {Vector} v destination vector
 * @return {Vector} destination vector
 */

Vector.prototype.put = function put(v) {
    if (this === _register) _setFromVector.call(v, _register);
    else _setFromVector.call(v, this);
};

/**
 * Set this vector to [0,0,0]
 *
 * @method clear
 */
Vector.prototype.clear = function clear() {
    return _setXYZ.call(this,0,0,0);
};

/**
 * Scale this Vector down to specified "cap" length.
 *   If Vector shorter than cap, or cap is Infinity, do nothing.
 *   Note: This sets the internal result register, so other references to that vector will change.
 *
 * @method cap
 * @return {Vector} capped vector
 */
Vector.prototype.cap = function vectorCap(cap) {
    if (cap === Infinity) return _setFromVector.call(_register, this);
    var norm = this.norm();
    if (norm > cap) return _setFromVector.call(_register, this.mult(cap / norm));
    else return _setFromVector.call(_register, this);
};

/**
 * Return projection of this Vector onto another.
 *   Note: This sets the internal result register, so other references to that vector will change.
 *
 * @method project
 * @param {Vector} n vector to project upon
 * @return {Vector} projected vector
 */
Vector.prototype.project = function project(n) {
    return n.mult(this.dot(n));
};

/**
 * Reflect this Vector across provided vector.
 *   Note: This sets the internal result register, so other references to that vector will change.
 *
 * @method reflectAcross
 * @param {Vector} n vector to reflect across
 * @return {Vector} reflected vector
 */
Vector.prototype.reflectAcross = function reflectAcross(n) {
    n.normalize().put(n);
    return _setFromVector(_register, this.sub(this.project(n).mult(2)));
};

/**
 * Convert Vector to three-element array.
 *
 * @method get
 * @return {array<number>} three-element array
 */
Vector.prototype.get = function get() {
    return [this.x, this.y, this.z];
};

Vector.prototype.get1D = function() {
    return this.x;
};

module.exports = Vector;


Vector.prototype.times = function times(v) {
    return _setXYZ.call(_register,
                        this.x * v.x,
                        this.y * v.y,
                        this.z * v.z
                       );
}


Vector.prototype.toArray = function () {
    return [this.x, this.y, this.z]
}

Vector.fromArray = function (a) {
    return new Vector(a[0], a[1], a[2]);
}

},{}],"/Users/ftripier/Code/Games/One/Libraries/MixedMode/src/famous/math/4x4matrix.js":[function(require,module,exports){
'use strict';

function multiply(outputArray, left, right) {
    var a00 = left[0],  a01 = left[1],  a02 = left[2],  a03 = left[3],
        a10 = left[4],  a11 = left[5],  a12 = left[6],  a13 = left[7],
        a20 = left[8],  a21 = left[9],  a22 = left[10], a23 = left[11],
        a30 = left[12], a31 = left[13], a32 = left[14], a33 = left[15];
    
    var b0 = right[0], b1 = right[1], b2 = right[2], b3 = right[3]; 

    outputArray[0] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    outputArray[1] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    outputArray[2] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    outputArray[3] = b0*a03 + b1*a13 + b2*a23 + b3*a33;
    
    b0 = right[4]; b1 = right[5]; b2 = right[6]; b3 = right[7];

    outputArray[4] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    outputArray[5] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    outputArray[6] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    outputArray[7] = b0*a03 + b1*a13 + b2*a23 + b3*a33;
    
    b0 = right[8]; b1 = right[9]; b2 = right[10]; b3 = right[11];

    outputArray[8]  = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    outputArray[9]  = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    outputArray[10] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    outputArray[11] = b0*a03 + b1*a13 + b2*a23 + b3*a33;
    
    b0 = right[12]; b1 = right[13]; b2 = right[14]; b3 = right[15];

    outputArray[12] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    outputArray[13] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    outputArray[14] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    outputArray[15] = b0*a03 + b1*a13 + b2*a23 + b3*a33;
    return outputArray;
}


function getTranslationFromMultiplication(outputArray, left, right) {
    var a00 = left[0],  a01 = left[1],
        a10 = left[4],  a11 = left[5],
        a20 = left[8],  a21 = left[9],
        a30 = left[12], a31 = left[13];

    var b0 = right[12],
        b1 = right[13],
        b2 = right[14],
        b3 = right[15];

    outputArray[0] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    outputArray[1] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    return outputArray;
}

function invert(outputArray, matrix) {
    var a00 = matrix[0],  a01 = matrix[1],  a02 = matrix[2],  a03 = matrix[3],
        a10 = matrix[4],  a11 = matrix[5],  a12 = matrix[6],  a13 = matrix[7],
        a20 = matrix[8],  a21 = matrix[9],  a22 = matrix[10], a23 = matrix[11],
        a30 = matrix[12], a31 = matrix[13], a32 = matrix[14], a33 = matrix[15],

        b00 = a00 * a11 - a01 * a10,
        b01 = a00 * a12 - a02 * a10,
        b02 = a00 * a13 - a03 * a10,
        b03 = a01 * a12 - a02 * a11,
        b04 = a01 * a13 - a03 * a11,
        b05 = a02 * a13 - a03 * a12,
        b06 = a20 * a31 - a21 * a30,
        b07 = a20 * a32 - a22 * a30,
        b08 = a20 * a33 - a23 * a30,
        b09 = a21 * a32 - a22 * a31,
        b10 = a21 * a33 - a23 * a31,
        b11 = a22 * a33 - a23 * a32,

        // Calculate the determinant
        det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

    if (!det) return null;
    det = 1.0 / det;

    outputArray[0]  = (a11 * b11 - a12 * b10 + a13 * b09) * det;
    outputArray[1]  = (a02 * b10 - a01 * b11 - a03 * b09) * det;
    outputArray[2]  = (a31 * b05 - a32 * b04 + a33 * b03) * det;
    outputArray[3]  = (a22 * b04 - a21 * b05 - a23 * b03) * det;
    outputArray[4]  = (a12 * b08 - a10 * b11 - a13 * b07) * det;
    outputArray[5]  = (a00 * b11 - a02 * b08 + a03 * b07) * det;
    outputArray[6]  = (a32 * b02 - a30 * b05 - a33 * b01) * det;
    outputArray[7]  = (a20 * b05 - a22 * b02 + a23 * b01) * det;
    outputArray[8]  = (a10 * b10 - a11 * b08 + a13 * b06) * det;
    outputArray[9]  = (a01 * b08 - a00 * b10 - a03 * b06) * det;
    outputArray[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
    outputArray[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
    outputArray[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
    outputArray[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
    outputArray[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
    outputArray[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
    return outputArray;
}

function getWfromMultiplication(left, right) {
    var a00 = left[0],  a01 = left[1],  a02 = left[2],  a03 = left[3],
        a10 = left[4],  a11 = left[5],  a12 = left[6],  a13 = left[7],
        a20 = left[8],  a21 = left[9],  a22 = left[10], a23 = left[11],
        a30 = left[12], a31 = left[13], a32 = left[14], a33 = left[15];

    var b0 = right[12], b1 = right[13], b2 = right[14], b3 = right[15];

    return b0*a00 + b1*a10 + b2*a20 + b3*a30 + b0*a01 + b1*a11 + b2*a21 + b3*a31 + b0*a02 + b1*a12 + b2*a22 + b3*a32 + b0*a03 + b1*a13 + b2*a23 + b3*a33;
}

function applyToVector(output, matrix, vector) {
    var a00 = matrix[0],  a01 = matrix[1],  a02 = matrix[2],  a03 = matrix[3],
        a10 = matrix[4],  a11 = matrix[5],  a12 = matrix[6],  a13 = matrix[7],
        a20 = matrix[8],  a21 = matrix[9],  a22 = matrix[10], a23 = matrix[11],
        a30 = matrix[12], a31 = matrix[13], a32 = matrix[14], a33 = matrix[15];

    var v0 = vector[0], v1 = vector[1], v2 = vector[2], v3 = vector[3];

    output[0] = a00 * v0 + a10 * v1 + a20 * v2 + a30 * v3;
    output[1] = a01 * v0 + a11 * v1 + a21 * v2 + a31 * v3;
    output[2] = a02 * v0 + a12 * v1 + a22 * v2 + a32 * v3;
    output[3] = a03 * v0 + a13 * v1 + a23 * v2 + a33 * v3;

    return output;
}

module.exports = {
    multiply                         : multiply,
    getTranslationFromMultiplication : getTranslationFromMultiplication,
    invert                           : invert,
    IDENTITY                         : new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]),
    getWfromMultiplication           : getWfromMultiplication,
    applyToVector                    : applyToVector
};
},{}],"/Users/ftripier/Code/Games/One/Libraries/MixedMode/src/famous/transitions/LiftSystem.js":[function(require,module,exports){
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Owners: dan@famo.us
 *         felix@famo.us
 *         mike@famo.us
 *
 * @license MPL 2.0
 * @copyright Famous Industries, Inc. 2014
 */

'use strict';

var EntityRegistry = require('../core/EntityRegistry');
var liftRoots      = EntityRegistry.addLayer('Lift');

/**
 * LiftSystem is responsible for traversing the scene graph and
 *   updating the Transforms, Sizes, and Opacities of the entities.
 *
 * @class  LiftSystem
 * @system
 * @singleton
 */
var LiftSystem = {};

/**
 * update iterates over each of the Contexts that were registered and
 *   kicks of the recursive updating of their entities.
 *
 * @method update
 */
var test = [];
LiftSystem.update = function update() {
    var rootParams;
    var cleanup = [];
    var lift;

    for (var i = 0; i < liftRoots.length; i++) {
        lift = liftRoots[i].getComponent('LiftComponent');
        rootParams = lift._update();
        rootParams.unshift(liftRoots[i]);
        coreUpdateAndFeed.apply(null, rootParams);

        if (lift.done) {
            liftRoots[i].removeComponent('LiftComponent');
            EntityRegistry.deregister(liftRoots[i], 'Lift');
        }
    }
}

/**
 * coreUpdateAndFeed feeds parent information to an entity and so that
 *   each entity can update their transform.  It 
 *   will then pass down invalidation states and values to any children.
 *
 * @method coreUpdateAndFeed
 * @private
 *   
 * @param  {Entity}  entity           Entity in the scene graph
 * @param  {Number}  transformReport  bitScheme report of transform invalidations
 * @param  {Array}   incomingMatrix   parent transform as a Float32 Array
 */
function coreUpdateAndFeed(entity, transformReport, incomingMatrix) {
    if (!entity) return;
    var transform = entity.getComponent('transform');
    var i         = entity._children.length;

    transformReport = transform._update(transformReport, incomingMatrix);

    while (i--) 
        coreUpdateAndFeed(
            entity._children[i],
            transformReport,
            transform._matrix);
}

module.exports = LiftSystem;

},{"../core/EntityRegistry":"/Users/ftripier/Code/Games/One/Libraries/MixedMode/src/famous/core/EntityRegistry.js"}],"/Users/ftripier/Code/Games/One/Source/Events/EventEmitter.js":[function(require,module,exports){
/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/.
*
* Owner: mark@famo.us
* @license MPL 2.0
* @copyright Famous Industries, Inc. 2014
*/

/**
 * EventEmitter represents a channel for events.
 *
 * @class EventEmitter
 * @constructor
 */
function EventEmitter() {
    this.listeners = {};
    this._owner = this;
}

/**
 * Trigger an event, sending to all downstream handlers
 *   listening for provided 'type' key.
 *
 * @method emit
 *
 * @param {string} type event type key (for example, 'click')
 * @param {Object} event event data
 * @return {EventHandler} this
 */
EventEmitter.prototype.emit = function emit(type, event) {
    var handlers = this.listeners[type];
    if (handlers) {
        for (var i = 0; i < handlers.length; i++) {
            handlers[i].call(this._owner, event);
        }
    }
    return this;
};

/**
 * Bind a callback function to an event type handled by this object.
 *
 * @method "on"
 *
 * @param {string} type event type key (for example, 'click')
 * @param {function(string, Object)} handler callback
 * @return {EventHandler} this
 */
EventEmitter.prototype.on = function on(type, handler) {
    if (!(type in this.listeners)) this.listeners[type] = [];
    var index = this.listeners[type].indexOf(handler);
    if (index < 0) this.listeners[type].push(handler);
    return this;
};

/**
 * Alias for "on".
 * @method addListener
 */
EventEmitter.prototype.addListener = EventEmitter.prototype.on;

/**
 * Unbind an event by type and handler.
 *   This undoes the work of "on".
 *
 * @method removeListener
 *
 * @param {string} type event type key (for example, 'click')
 * @param {function} handler function object to remove
 * @return {EventEmitter} this
 */
EventEmitter.prototype.removeListener = function removeListener(type, handler) {
    var index = this.listeners[type].indexOf(handler);
    if (index >= 0) this.listeners[type].splice(index, 1);
    return this;
};

/**
 * Call event handlers with this set to owner.
 *
 * @method bindThis
 *
 * @param {Object} owner object this EventEmitter belongs to
 */
EventEmitter.prototype.bindThis = function bindThis(owner) {
    this._owner = owner;
};

module.exports = EventEmitter;
},{}],"/Users/ftripier/Code/Games/One/Source/Events/EventHandler.js":[function(require,module,exports){
/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/.
*
* Owner: mark@famo.us
* @license MPL 2.0
* @copyright Famous Industries, Inc. 2014
*/

var EventEmitter = require('./EventEmitter');

/**
 * EventHandler forwards received events to a set of provided callback functions.
 * It allows events to be captured, processed, and optionally piped through to other event handlers.
 *
 * @class EventHandler
 * @extends EventEmitter
 * @constructor
 */
function EventHandler() {
    EventEmitter.apply(this, arguments);

    this.downstream = []; // downstream event handlers
    this.downstreamFn = []; // downstream functions

    this.upstream = []; // upstream event handlers
    this.upstreamListeners = {}; // upstream listeners
}
EventHandler.prototype = Object.create(EventEmitter.prototype);
EventHandler.prototype.constructor = EventHandler;

/**
 * Assign an event handler to receive an object's input events.
 *
 * @method setInputHandler
 * @static
 *
 * @param {Object} object object to mix trigger, subscribe, and unsubscribe functions into
 * @param {EventHandler} handler assigned event handler
 */
EventHandler.setInputHandler = function setInputHandler(object, handler) {
    object.trigger = handler.trigger.bind(handler);
    if (handler.subscribe && handler.unsubscribe) {
        object.subscribe = handler.subscribe.bind(handler);
        object.unsubscribe = handler.unsubscribe.bind(handler);
    }
};

/**
 * Assign an event handler to receive an object's output events.
 *
 * @method setOutputHandler
 * @static
 *
 * @param {Object} object object to mix pipe, unpipe, on, addListener, and removeListener functions into
 * @param {EventHandler} handler assigned event handler
 */
EventHandler.setOutputHandler = function setOutputHandler(object, handler) {
    if (handler instanceof EventHandler) handler.bindThis(object);
    object.pipe = handler.pipe.bind(handler);
    object.unpipe = handler.unpipe.bind(handler);
    object.on = handler.on.bind(handler);
    object.addListener = object.on;
    object.removeListener = handler.removeListener.bind(handler);
};

/**
 * Trigger an event, sending to all downstream handlers
 *   listening for provided 'type' key.
 *
 * @method emit
 *
 * @param {string} type event type key (for example, 'click')
 * @param {Object} event event data
 * @return {EventHandler} this
 */
EventHandler.prototype.emit = function emit(type, event) {
    EventEmitter.prototype.emit.apply(this, arguments);
    var i = 0;
    for (i = 0; i < this.downstream.length; i++) {
        if (this.downstream[i].trigger) this.downstream[i].trigger(type, event);
    }
    for (i = 0; i < this.downstreamFn.length; i++) {
        this.downstreamFn[i](type, event);
    }
    return this;
};

/**
 * Alias for emit
 * @method addListener
 */
EventHandler.prototype.trigger = EventHandler.prototype.emit;

/**
 * Add event handler object to set of downstream handlers.
 *
 * @method pipe
 *
 * @param {EventHandler} target event handler target object
 * @return {EventHandler} passed event handler
 */
EventHandler.prototype.pipe = function pipe(target) {
    if (target.subscribe instanceof Function) return target.subscribe(this);

    var downstreamCtx = (target instanceof Function) ? this.downstreamFn : this.downstream;
    var index = downstreamCtx.indexOf(target);
    if (index < 0) downstreamCtx.push(target);

    if (target instanceof Function) target('pipe', null);
    else if (target.trigger) target.trigger('pipe', null);

    return target;
};

/**
 * Remove handler object from set of downstream handlers.
 *   Undoes work of "pipe".
 *
 * @method unpipe
 *
 * @param {EventHandler} target target handler object
 * @return {EventHandler} provided target
 */
EventHandler.prototype.unpipe = function unpipe(target) {
    if (target.unsubscribe instanceof Function) return target.unsubscribe(this);

    var downstreamCtx = (target instanceof Function) ? this.downstreamFn : this.downstream;
    var index = downstreamCtx.indexOf(target);
    if (index >= 0) {
        downstreamCtx.splice(index, 1);
        if (target instanceof Function) target('unpipe', null);
        else if (target.trigger) target.trigger('unpipe', null);
        return target;
    }
    else return false;
};

/**
 * Bind a callback function to an event type handled by this object.
 *
 * @method "on"
 *
 * @param {string} type event type key (for example, 'click')
 * @param {function(string, Object)} handler callback
 * @return {EventHandler} this
 */
EventHandler.prototype.on = function on(type, handler) {
    EventEmitter.prototype.on.apply(this, arguments);
    if (!(type in this.upstreamListeners)) {
        var upstreamListener = this.trigger.bind(this, type);
        this.upstreamListeners[type] = upstreamListener;
        for (var i = 0; i < this.upstream.length; i++) {
            this.upstream[i].on(type, upstreamListener);
        }
    }
    return this;
};

/**
 * Alias for "on"
 * @method addListener
 */
EventHandler.prototype.addListener = EventHandler.prototype.on;

/**
 * Listen for events from an upstream event handler.
 *
 * @method subscribe
 *
 * @param {EventEmitter} source source emitter object
 * @return {EventHandler} this
 */
EventHandler.prototype.subscribe = function subscribe(source) {
    var index = this.upstream.indexOf(source);
    if (index < 0) {
        this.upstream.push(source);
        for (var type in this.upstreamListeners) {
            source.on(type, this.upstreamListeners[type]);
        }
    }
    return this;
};

/**
 * Stop listening to events from an upstream event handler.
 *
 * @method unsubscribe
 *
 * @param {EventEmitter} source source emitter object
 * @return {EventHandler} this
 */
EventHandler.prototype.unsubscribe = function unsubscribe(source) {
    var index = this.upstream.indexOf(source);
    if (index >= 0) {
        this.upstream.splice(index, 1);
        for (var type in this.upstreamListeners) {
            source.removeListener(type, this.upstreamListeners[type]);
        }
    }
    return this;
};

module.exports = EventHandler;
},{"./EventEmitter":"/Users/ftripier/Code/Games/One/Source/Events/EventEmitter.js"}],"/Users/ftripier/Code/Games/One/Source/Game/Engine.js":[function(require,module,exports){
var EventHandler       = require('../Events/EventHandler');

var Engine          = {};

Engine.eventInput      = new EventHandler();
Engine.eventOutput     = new EventHandler();

EventHandler.setInputHandler(Engine, Engine.eventInput);
EventHandler.setOutputHandler(Engine, Engine.eventOutput);

Engine.currentState = null;

Engine.setState     = function setState(state)
{
	if (state.initialize) state.initialize();
	
	if (this.currentState)
	{
		this.currentState.unpipe(Engine.eventInput);
		this.currentState.hide();
	}

	state.pipe(this.eventInput);
	state.show();

	this.currentState = state;
};

Engine.step         = function step(time)
{
	var state = Engine.currentState;
	if (state)
	{
		if (state.update) state.update();
	}
};

module.exports = Engine;
},{"../Events/EventHandler":"/Users/ftripier/Code/Games/One/Source/Events/EventHandler.js"}],"/Users/ftripier/Code/Games/One/Source/Game/ImageLoader.js":[function(require,module,exports){
var ASSET_TYPE = 'image';

var EventHandler       = require('../Events/EventHandler');

var ImageLoader  = {};
var Images       = {};

ImageLoader.eventInput      = new EventHandler();
ImageLoader.eventOutput     = new EventHandler();

EventHandler.setInputHandler(ImageLoader, ImageLoader.eventInput);
EventHandler.setOutputHandler(ImageLoader, ImageLoader.eventOutput);

ImageLoader.load = function load(asset)
{
    var source = asset.source;
    if (!Images[source])
    {
        var image = new Image();
        image.src = source;
        image.onload = function() {
            finishedLoading(source);
        };
        Images[source] = image;
    }
};

ImageLoader.get  = function get(source)
{
    return Images[source];
};

ImageLoader.toString = function toString()
{
    return ASSET_TYPE;
};

function finishedLoading(source)
{
    ImageLoader.eventOutput.emit('doneLoading', {source: source, type: ASSET_TYPE});
}

module.exports = ImageLoader;
},{"../Events/EventHandler":"/Users/ftripier/Code/Games/One/Source/Events/EventHandler.js"}],"/Users/ftripier/Code/Games/One/Source/Game/Viewport.js":[function(require,module,exports){
var EventHandler       = require('../Events/EventHandler');

var Viewport = {};

Viewport.eventInput      = new EventHandler();
Viewport.eventOutput     = new EventHandler();

EventHandler.setInputHandler(Viewport, Viewport.eventInput);
EventHandler.setOutputHandler(Viewport, Viewport.eventOutput);

window.onresize = handleResize;

function handleResize()
{
	Viewport.eventOutput.emit('resize');
}

module.exports = Viewport;
},{"../Events/EventHandler":"/Users/ftripier/Code/Games/One/Source/Events/EventHandler.js"}],"/Users/ftripier/Code/Games/One/Source/States/Loading.js":[function(require,module,exports){
var COMPLETE = "complete";
var LOAD_STARTED = "startLoading";
var LOAD_COMPLETED = "doneLoading";
var NONE = 'none';
var VISIBLE = 'inline';

var EventHandler       = require('../Events/EventHandler');

var Loading          = {};
var bodyReady        = false;
var assetStack       = [];
var loaderRegistry   = {};
var container        = null;
var splashScreen     = new Image();
splashScreen.src     = '../../Assets/Loading....png';
splashScreen.width   = splashWidth = 500;
splashScreen.height  = splashHeight = 160;
Loading.eventInput      = new EventHandler();
Loading.eventOutput     = new EventHandler();

EventHandler.setInputHandler(Loading, Loading.eventInput);
EventHandler.setOutputHandler(Loading, Loading.eventOutput);

Loading.eventInput.on(LOAD_COMPLETED, handleCompletedLoad);
Loading.eventInput.on('resize', handleResize);

Loading.initialize = function initialize()
{
    if (!container)
    {
        container = document.getElementById('loading');
        container.appendChild(splashScreen);
        splashScreen.style.position = 'absolute';
        splashScreen.style.top = (window.innerHeight * 0.5) - (splashHeight * 0.5) + 'px';
        splashScreen.style.left = (window.innerWidth * 0.5) - (splashWidth* 0.5) + 'px';
    }
    if (assetStack.length)
    {
        this.eventOutput.emit(LOAD_STARTED);
        for (var i = 0; i < assetStack.length; i++)
        {
            var asset  = assetStack[i];
            var loader = asset.type;
            loaderRegistry[loader].load(asset);
        }
    }
};

Loading.load       = function load(asset)
{
    assetStack.push(asset);
};

Loading.show       = function show()
{
    container.style.display = VISIBLE;
};

Loading.hide       = function hide()
{
    container.style.display = NONE;
};

Loading.register   = function register(loader)
{
    var loaderName             = loader.toString();
    loaderRegistry[loaderName] = loader;
    loader.pipe(this.eventInput);
};

function handleCompletedLoad(data)
{
    setTimeout(function()
    {
        var source = data.source;
        var location = assetStack.indexOf(source);
        if (location) assetStack.splice(location, 1);
        if (!assetStack.length) Loading.eventOutput.emit(LOAD_COMPLETED);
    }, 1000);
}

function handleResize()
{
    splashScreen.style.top = (window.innerHeight * 0.5) - (splashHeight * 0.5) + 'px';
    splashScreen.style.left = (window.innerWidth * 0.5) - (splashWidth* 0.5) + 'px';
}

module.exports = Loading;
},{"../Events/EventHandler":"/Users/ftripier/Code/Games/One/Source/Events/EventHandler.js"}],"/Users/ftripier/Code/Games/One/Source/States/Menu.js":[function(require,module,exports){
var NONE = 'none';
var VISIBLE = 'inline';

var EventHandler       = require('../Events/EventHandler');

var Menu          = {};

Menu.eventInput      = new EventHandler();
Menu.eventOutput     = new EventHandler();

EventHandler.setInputHandler(Menu, Menu.eventInput);
EventHandler.setOutputHandler(Menu, Menu.eventOutput);

Menu.eventInput.on('resize', handleResize);

var menuElement = null,
container       = null,
newGame         = null;

Menu.initialize = function initialize()
{
    container = document.getElementById('menu');
    menuElement = document.createElement('div');
    menuElement.style.position = 'absolute';
    newGame     = document.createElement('div');
    newGame.onclick = startNewGame;
    newGame.innerHTML = 'New Game';
    newGame.style.fontSize = '50px';
    newGame.style.fontFamily = 'Helvetica';
    newGame.style.color = '#FFF';
    menuElement.appendChild(newGame);
    container.appendChild(menuElement);
    menuElement.style.top  = (window.innerHeight * 0.5) - (58 * 0.5) + 'px';
    menuElement.style.left = (window.innerWidth * 0.5) - (251 * 0.5) + 'px';
};

Menu.show       = function show()
{
    container.style.display = VISIBLE;
};

Menu.hide       = function hide()
{
    container.style.display = NONE;
};

function handleResize()
{
    menuElement.style.top = (window.innerHeight * 0.5) - (58 * 0.5) + 'px';
    menuElement.style.left = (window.innerWidth * 0.5) - (251 * 0.5) + 'px';
}

function startNewGame()
{
    Menu.eventOutput.emit('newGame');
}

module.exports = Menu;
},{"../Events/EventHandler":"/Users/ftripier/Code/Games/One/Source/Events/EventHandler.js"}],"/Users/ftripier/Code/Games/One/Source/States/Playing.js":[function(require,module,exports){
var NONE = 'none';
var VISIBLE = 'inline';

var EventHandler       = require('../Events/EventHandler');
var FamousEngine       = require('../../Libraries/MixedMode/src/famous/core/Engine');

var Playing          = {};

Playing.eventInput      = new EventHandler();
Playing.eventOutput     = new EventHandler();

EventHandler.setInputHandler(Playing, Playing.eventInput);
EventHandler.setOutputHandler(Playing, Playing.eventOutput);

Playing.initialize = function initialize()
{
	console.log(1)
 	FamousEngine.createContext({ hasCamera: false });
};

Playing.update     = function update()
{
	FamousEngine.step();
};

Playing.show       = function show()
{
};

Playing.hide       = function hide()
{
};

module.exports = Playing;
},{"../../Libraries/MixedMode/src/famous/core/Engine":"/Users/ftripier/Code/Games/One/Libraries/MixedMode/src/famous/core/Engine.js","../Events/EventHandler":"/Users/ftripier/Code/Games/One/Source/Events/EventHandler.js"}],"/Users/ftripier/Code/Games/One/Source/main.js":[function(require,module,exports){
var Engine  = require('./Game/Engine');
var Loading = require('./States/Loading');
var Menu    = require('./States/Menu');
var Playing = require('./States/Playing');
var EventHandler = require('./Events/EventHandler');
var ImageLoader  = require('./Game/ImageLoader');
var Viewport     = require('./Game/Viewport');

var Controller = new EventHandler();

Viewport.pipe(Menu);
Viewport.pipe(Loading);
Viewport.pipe(Playing);

Engine.pipe(Controller);
Menu.pipe(Controller);
Loading.pipe(Controller);

Controller.on('doneLoading', goToMenu);
Controller.on('newGame', startGame);

var spritesheet = {
	type: 'image',
	source: '../Assets/crate.gif',
	data: {}
};

Loading.register(ImageLoader);
Loading.load(spritesheet);

Engine.setState(Loading);

function goToMenu()
{
    Engine.setState(Menu);
}

function startGame()
{
	Engine.setState(Playing);
}

requestAnimationFrame(Engine.step);
},{"./Events/EventHandler":"/Users/ftripier/Code/Games/One/Source/Events/EventHandler.js","./Game/Engine":"/Users/ftripier/Code/Games/One/Source/Game/Engine.js","./Game/ImageLoader":"/Users/ftripier/Code/Games/One/Source/Game/ImageLoader.js","./Game/Viewport":"/Users/ftripier/Code/Games/One/Source/Game/Viewport.js","./States/Loading":"/Users/ftripier/Code/Games/One/Source/States/Loading.js","./States/Menu":"/Users/ftripier/Code/Games/One/Source/States/Menu.js","./States/Playing":"/Users/ftripier/Code/Games/One/Source/States/Playing.js"}],"/Users/ftripier/Code/Games/One/node_modules/cssify/browser.js":[function(require,module,exports){
module.exports = function (css, customDocument) {
  var doc = customDocument || document;
  if (doc.createStyleSheet) {
    doc.createStyleSheet().cssText = css;
  } else {
    var head = doc.getElementsByTagName('head')[0],
        style = doc.createElement('style');

    style.type = 'text/css';
  
    if (style.styleSheet) {
      style.styleSheet.cssText = css;
    } else {
      style.appendChild(doc.createTextNode(css));
    }
    
    head.appendChild(style); 
  }
};

module.exports.byUrl = function(url) {
  if (document.createStyleSheet) {
    document.createStyleSheet(url);
  } else {
    var head = document.getElementsByTagName('head')[0],
        link = document.createElement('link');

    link.rel = 'stylesheet';
    link.href = url;
  
    head.appendChild(link); 
  }
};

},{}]},{},["/Users/ftripier/Code/Games/One/Source/main.js"])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9mdHJpcGllci9Db2RlL0dhbWVzL09uZS9ub2RlX21vZHVsZXMvd2F0Y2hpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9Vc2Vycy9mdHJpcGllci9Db2RlL0dhbWVzL09uZS9MaWJyYXJpZXMvTWl4ZWRNb2RlL3NyYy9mYW1vdXMvY29yZS9Db21wb25lbnRzL0NhbWVyYS5qcyIsIi9Vc2Vycy9mdHJpcGllci9Db2RlL0dhbWVzL09uZS9MaWJyYXJpZXMvTWl4ZWRNb2RlL3NyYy9mYW1vdXMvY29yZS9Db21wb25lbnRzL0NvbnRhaW5lci5qcyIsIi9Vc2Vycy9mdHJpcGllci9Db2RlL0dhbWVzL09uZS9MaWJyYXJpZXMvTWl4ZWRNb2RlL3NyYy9mYW1vdXMvY29yZS9Db21wb25lbnRzL1N1cmZhY2UuanMiLCIvVXNlcnMvZnRyaXBpZXIvQ29kZS9HYW1lcy9PbmUvTGlicmFyaWVzL01peGVkTW9kZS9zcmMvZmFtb3VzL2NvcmUvQ29tcG9uZW50cy9UYXJnZXQuanMiLCIvVXNlcnMvZnRyaXBpZXIvQ29kZS9HYW1lcy9PbmUvTGlicmFyaWVzL01peGVkTW9kZS9zcmMvZmFtb3VzL2NvcmUvQ29tcG9uZW50cy9UcmFuc2Zvcm0uanMiLCIvVXNlcnMvZnRyaXBpZXIvQ29kZS9HYW1lcy9PbmUvTGlicmFyaWVzL01peGVkTW9kZS9zcmMvZmFtb3VzL2NvcmUvQ29udGV4dC5qcyIsIi9Vc2Vycy9mdHJpcGllci9Db2RlL0dhbWVzL09uZS9MaWJyYXJpZXMvTWl4ZWRNb2RlL3NyYy9mYW1vdXMvY29yZS9FbmdpbmUuanMiLCIvVXNlcnMvZnRyaXBpZXIvQ29kZS9HYW1lcy9PbmUvTGlicmFyaWVzL01peGVkTW9kZS9zcmMvZmFtb3VzL2NvcmUvRW50aXR5LmpzIiwiL1VzZXJzL2Z0cmlwaWVyL0NvZGUvR2FtZXMvT25lL0xpYnJhcmllcy9NaXhlZE1vZGUvc3JjL2ZhbW91cy9jb3JlL0VudGl0eVJlZ2lzdHJ5LmpzIiwiL1VzZXJzL2Z0cmlwaWVyL0NvZGUvR2FtZXMvT25lL0xpYnJhcmllcy9NaXhlZE1vZGUvc3JjL2ZhbW91cy9jb3JlL0xheWVyLmpzIiwiL1VzZXJzL2Z0cmlwaWVyL0NvZGUvR2FtZXMvT25lL0xpYnJhcmllcy9NaXhlZE1vZGUvc3JjL2ZhbW91cy9jb3JlL09wdGlvbnNNYW5hZ2VyLmpzIiwiL1VzZXJzL2Z0cmlwaWVyL0NvZGUvR2FtZXMvT25lL0xpYnJhcmllcy9NaXhlZE1vZGUvc3JjL2ZhbW91cy9jb3JlL1JlbmRlcmVycy9ET01yZW5kZXJlci5qcyIsIi9Vc2Vycy9mdHJpcGllci9Db2RlL0dhbWVzL09uZS9MaWJyYXJpZXMvTWl4ZWRNb2RlL3NyYy9mYW1vdXMvY29yZS9SZW5kZXJlcnMvRWxlbWVudEFsbG9jYXRvci5qcyIsIi9Vc2Vycy9mdHJpcGllci9Db2RlL0dhbWVzL09uZS9MaWJyYXJpZXMvTWl4ZWRNb2RlL3NyYy9mYW1vdXMvY29yZS9SZW5kZXJlcnMvV2ViR0xSZW5kZXJlci5qcyIsIi9Vc2Vycy9mdHJpcGllci9Db2RlL0dhbWVzL09uZS9MaWJyYXJpZXMvTWl4ZWRNb2RlL3NyYy9mYW1vdXMvY29yZS9TdHlsZXNoZWV0L2ZhbW91cy5jc3MiLCIvVXNlcnMvZnRyaXBpZXIvQ29kZS9HYW1lcy9PbmUvTGlicmFyaWVzL01peGVkTW9kZS9zcmMvZmFtb3VzL2NvcmUvU3lzdGVtcy9CZWhhdmlvclN5c3RlbS5qcyIsIi9Vc2Vycy9mdHJpcGllci9Db2RlL0dhbWVzL09uZS9MaWJyYXJpZXMvTWl4ZWRNb2RlL3NyYy9mYW1vdXMvY29yZS9TeXN0ZW1zL0NvcmVTeXN0ZW0uanMiLCIvVXNlcnMvZnRyaXBpZXIvQ29kZS9HYW1lcy9PbmUvTGlicmFyaWVzL01peGVkTW9kZS9zcmMvZmFtb3VzL2NvcmUvU3lzdGVtcy9SZW5kZXJTeXN0ZW0uanMiLCIvVXNlcnMvZnRyaXBpZXIvQ29kZS9HYW1lcy9PbmUvTGlicmFyaWVzL01peGVkTW9kZS9zcmMvZmFtb3VzL2NvcmUvU3lzdGVtcy9UaW1lU3lzdGVtLmpzIiwiL1VzZXJzL2Z0cmlwaWVyL0NvZGUvR2FtZXMvT25lL0xpYnJhcmllcy9NaXhlZE1vZGUvc3JjL2ZhbW91cy9jb3JlL2NvbXBvbmVudHMvVGFyZ2V0LmpzIiwiL1VzZXJzL2Z0cmlwaWVyL0NvZGUvR2FtZXMvT25lL0xpYnJhcmllcy9NaXhlZE1vZGUvc3JjL2ZhbW91cy9ldmVudHMvRXZlbnRFbWl0dGVyLmpzIiwiL1VzZXJzL2Z0cmlwaWVyL0NvZGUvR2FtZXMvT25lL0xpYnJhcmllcy9NaXhlZE1vZGUvc3JjL2ZhbW91cy9ldmVudHMvRXZlbnRIYW5kbGVyLmpzIiwiL1VzZXJzL2Z0cmlwaWVyL0NvZGUvR2FtZXMvT25lL0xpYnJhcmllcy9NaXhlZE1vZGUvc3JjL2ZhbW91cy9nbC9nZW9tZXRyeS5qcyIsIi9Vc2Vycy9mdHJpcGllci9Db2RlL0dhbWVzL09uZS9MaWJyYXJpZXMvTWl4ZWRNb2RlL3NyYy9mYW1vdXMvZ2wvaW5kZXhlci5qcyIsIi9Vc2Vycy9mdHJpcGllci9Db2RlL0dhbWVzL09uZS9MaWJyYXJpZXMvTWl4ZWRNb2RlL3NyYy9mYW1vdXMvZ2wvc2hhZGVyLmpzIiwiL1VzZXJzL2Z0cmlwaWVyL0NvZGUvR2FtZXMvT25lL0xpYnJhcmllcy9NaXhlZE1vZGUvc3JjL2ZhbW91cy9nbC92ZWN0b3IuanMiLCIvVXNlcnMvZnRyaXBpZXIvQ29kZS9HYW1lcy9PbmUvTGlicmFyaWVzL01peGVkTW9kZS9zcmMvZmFtb3VzL21hdGgvNHg0bWF0cml4LmpzIiwiL1VzZXJzL2Z0cmlwaWVyL0NvZGUvR2FtZXMvT25lL0xpYnJhcmllcy9NaXhlZE1vZGUvc3JjL2ZhbW91cy90cmFuc2l0aW9ucy9MaWZ0U3lzdGVtLmpzIiwiL1VzZXJzL2Z0cmlwaWVyL0NvZGUvR2FtZXMvT25lL1NvdXJjZS9FdmVudHMvRXZlbnRFbWl0dGVyLmpzIiwiL1VzZXJzL2Z0cmlwaWVyL0NvZGUvR2FtZXMvT25lL1NvdXJjZS9FdmVudHMvRXZlbnRIYW5kbGVyLmpzIiwiL1VzZXJzL2Z0cmlwaWVyL0NvZGUvR2FtZXMvT25lL1NvdXJjZS9HYW1lL0VuZ2luZS5qcyIsIi9Vc2Vycy9mdHJpcGllci9Db2RlL0dhbWVzL09uZS9Tb3VyY2UvR2FtZS9JbWFnZUxvYWRlci5qcyIsIi9Vc2Vycy9mdHJpcGllci9Db2RlL0dhbWVzL09uZS9Tb3VyY2UvR2FtZS9WaWV3cG9ydC5qcyIsIi9Vc2Vycy9mdHJpcGllci9Db2RlL0dhbWVzL09uZS9Tb3VyY2UvU3RhdGVzL0xvYWRpbmcuanMiLCIvVXNlcnMvZnRyaXBpZXIvQ29kZS9HYW1lcy9PbmUvU291cmNlL1N0YXRlcy9NZW51LmpzIiwiL1VzZXJzL2Z0cmlwaWVyL0NvZGUvR2FtZXMvT25lL1NvdXJjZS9TdGF0ZXMvUGxheWluZy5qcyIsIi9Vc2Vycy9mdHJpcGllci9Db2RlL0dhbWVzL09uZS9Tb3VyY2UvbWFpbi5qcyIsIi9Vc2Vycy9mdHJpcGllci9Db2RlL0dhbWVzL09uZS9ub2RlX21vZHVsZXMvY3NzaWZ5L2Jyb3dzZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbE1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN01BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcmFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVZQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4UkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeE5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMU9BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdk1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwSkE7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN01BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOU1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xRQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN1lBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyogVGhpcyBTb3VyY2UgQ29kZSBGb3JtIGlzIHN1YmplY3QgdG8gdGhlIHRlcm1zIG9mIHRoZSBNb3ppbGxhIFB1YmxpY1xuICogTGljZW5zZSwgdi4gMi4wLiBJZiBhIGNvcHkgb2YgdGhlIE1QTCB3YXMgbm90IGRpc3RyaWJ1dGVkIHdpdGggdGhpc1xuICogZmlsZSwgWW91IGNhbiBvYnRhaW4gb25lIGF0IGh0dHA6Ly9tb3ppbGxhLm9yZy9NUEwvMi4wLy5cbiAqXG4gKiBPd25lcnM6IGRhbkBmYW1vLnVzXG4gKiAgICAgICAgIGZlbGl4QGZhbW8udXNcbiAqICAgICAgICAgbWlrZUBmYW1vLnVzXG4gKlxuICogQGxpY2Vuc2UgTVBMIDIuMFxuICogQGNvcHlyaWdodCBGYW1vdXMgSW5kdXN0cmllcywgSW5jLiAyMDE0XG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgTWF0cml4TWF0aCAgICAgPSByZXF1aXJlKCcuLi8uLi9tYXRoLzR4NG1hdHJpeCcpO1xudmFyIE9wdGlvbnNNYW5hZ2VyID0gcmVxdWlyZSgnLi4vT3B0aW9uc01hbmFnZXInKTtcblxuLy8gQ09OU1RTXG52YXIgQ09NUE9ORU5UX05BTUUgPSAnY2FtZXJhJztcbnZhciBQUk9KRUNUSU9OICAgICA9ICdwcm9qZWN0aW9uJztcblxuLyoqXG4gKiBDYW1lcmFcbiAqXG4gKiBAY29tcG9uZW50IENhbWVyYVxuICogQGNvbnN0cnVjdG9yXG4gKiBcbiAqIEBwYXJhbSB7RW50aXR5fSBlbnRpdHkgIEVudGl0eSB0aGF0IHRoZSBDb250YWluZXIgaXMgYSBjb21wb25lbnQgb2ZcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIFtkZXNjcmlwdGlvbl1cbiAqL1xuZnVuY3Rpb24gQ2FtZXJhKGVudGl0eSwgb3B0aW9ucykge1xuICAgIHRoaXMuX2VudGl0eSAgICAgICAgICAgICAgPSBlbnRpdHk7XG4gICAgdGhpcy5fcHJvamVjdGlvblRyYW5zZm9ybSA9IG5ldyBGbG9hdDMyQXJyYXkoWzEsIDAsIDAsIDAsIDAsIDEsIDAsIDAsIDAsIDAsIDEsIDAsIDAsIDAsIDAsIDFdKTtcblxuICAgIHRoaXMub3B0aW9ucyAgICAgICAgICAgICAgPSBPYmplY3QuY3JlYXRlKENhbWVyYS5ERUZBVUxUX09QVElPTlMpO1xuICAgIHRoaXMuX29wdGlvbnNNYW5hZ2VyICAgICAgPSBuZXcgT3B0aW9uc01hbmFnZXIodGhpcy5vcHRpb25zKTtcbiAgICB0aGlzLl9vcHRpb25zTWFuYWdlci5vbignY2hhbmdlJywgX2V2ZW50c0NoYW5nZS5iaW5kKHRoaXMpKTsgLy9yb2J1c3QgaW50ZWdyYXRpb25cblxuICAgIGlmIChvcHRpb25zKSB0aGlzLnNldE9wdGlvbnMob3B0aW9ucyk7XG5cbiAgICBfcmVjYWxjdWxhdGVQcm9qZWN0aW9uVHJhbnNmb3JtLmNhbGwodGhpcyk7XG59XG5cbkNhbWVyYS5ERUZBVUxUX09QVElPTlMgPSB7XG4gICAgcHJvamVjdGlvbiA6IHtcbiAgICAgICAgdHlwZSAgICA6ICdwaW5ob2xlJyxcbiAgICAgICAgb3B0aW9ucyA6IHtcbiAgICAgICAgICAgIGZvY2FsUG9pbnQgOiBbMCwgMCwgLTEwMDBdXG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5DYW1lcmEudG9TdHJpbmcgPSBmdW5jdGlvbiB0b1N0cmluZygpIHtcbiAgICByZXR1cm4gQ09NUE9ORU5UX05BTUU7XG59O1xuXG5DYW1lcmEucHJvamVjdGlvblRyYW5zZm9ybXMgPSB7fTtcblxuQ2FtZXJhLnByb2plY3Rpb25UcmFuc2Zvcm1zLnBpbmhvbGUgPSBmdW5jdGlvbiBwaW5ob2xlKHRyYW5zZm9ybSwgZm9jYWxWZWN0b3IpIHtcbiAgICB2YXIgY29udGV4dFNpemUgICA9IHRoaXMuX2VudGl0eS5nZXRDb250ZXh0KCkuX3NpemU7XG4gICAgdmFyIGNvbnRleHRXaWR0aCAgPSBjb250ZXh0U2l6ZVswXTtcbiAgICB2YXIgY29udGV4dEhlaWdodCA9IGNvbnRleHRTaXplWzFdO1xuXG4gICAgdmFyIGZvY2FsRGl2aWRlICAgICAgICA9IGZvY2FsVmVjdG9yWzJdID8gMS9mb2NhbFZlY3RvclsyXSA6IDA7XG4gICAgdmFyIHdpZHRoVG9IZWlnaHRSYXRpbyA9IChjb250ZXh0V2lkdGggPiBjb250ZXh0SGVpZ2h0KSA/IGNvbnRleHRXaWR0aC9jb250ZXh0SGVpZ2h0IDogMTtcbiAgICB2YXIgaGVpZ2h0VG9XaWR0aFJhdGlvID0gKGNvbnRleHRIZWlnaHQgPiBjb250ZXh0V2lkdGgpID8gY29udGV4dEhlaWdodC9jb250ZXh0V2lkdGggOiAxO1xuXG4gICAgdmFyIGxlZnQgICA9IC13aWR0aFRvSGVpZ2h0UmF0aW87XG4gICAgdmFyIHJpZ2h0ICA9IHdpZHRoVG9IZWlnaHRSYXRpbztcbiAgICB2YXIgdG9wICAgID0gaGVpZ2h0VG9XaWR0aFJhdGlvO1xuICAgIHZhciBib3R0b20gPSAtaGVpZ2h0VG9XaWR0aFJhdGlvO1xuXG4gICAgdmFyIGxyID0gMSAvIChsZWZ0IC0gcmlnaHQpO1xuICAgIHZhciBidCA9IDEgLyAoYm90dG9tIC0gdG9wKTtcblxuICAgIHRyYW5zZm9ybVswXSAgPSAtMiAqIGxyO1xuICAgIHRyYW5zZm9ybVsxXSAgPSAwO1xuICAgIHRyYW5zZm9ybVsyXSAgPSAwO1xuICAgIHRyYW5zZm9ybVszXSAgPSAwO1xuICAgIFxuICAgIHRyYW5zZm9ybVs0XSAgPSAwO1xuICAgIHRyYW5zZm9ybVs1XSAgPSAtMiAqIGJ0O1xuICAgIHRyYW5zZm9ybVs2XSAgPSAwO1xuICAgIHRyYW5zZm9ybVs3XSAgPSAwO1xuICAgXG4gICAgdHJhbnNmb3JtWzhdICA9IC1mb2NhbERpdmlkZSAqIGZvY2FsVmVjdG9yWzBdO1xuICAgIHRyYW5zZm9ybVs5XSAgPSAtZm9jYWxEaXZpZGUgKiBmb2NhbFZlY3RvclsxXTtcbiAgICB0cmFuc2Zvcm1bMTBdID0gZm9jYWxEaXZpZGU7XG4gICAgdHJhbnNmb3JtWzExXSA9IC1mb2NhbERpdmlkZTtcbiAgICBcbiAgICB0cmFuc2Zvcm1bMTJdID0gMDtcbiAgICB0cmFuc2Zvcm1bMTNdID0gMDtcbiAgICB0cmFuc2Zvcm1bMTRdID0gMDtcbiAgICB0cmFuc2Zvcm1bMTVdID0gMTtcblxuICAgIHJldHVybiB0cmFuc2Zvcm07XG59O1xuXG5DYW1lcmEucHJvamVjdGlvblRyYW5zZm9ybXMub3J0aG9ncmFwaGljID0gZnVuY3Rpb24gb3J0aG9ncmFwaGljKHRyYW5zZm9ybSkge1xuICAgIHZhciBjb250ZXh0U2l6ZSAgID0gdGhpcy5fZW50aXR5LmdldENvbnRleHQoKS5fc2l6ZTtcbiAgICB2YXIgY29udGV4dFdpZHRoICA9IGNvbnRleHRTaXplWzBdO1xuICAgIHZhciBjb250ZXh0SGVpZ2h0ID0gY29udGV4dFNpemVbMV07XG5cbiAgICB2YXIgd2lkdGhUb0hlaWdodFJhdGlvID0gKGNvbnRleHRXaWR0aCA+IGNvbnRleHRIZWlnaHQpID8gY29udGV4dFdpZHRoL2NvbnRleHRIZWlnaHQgOiAxO1xuICAgIHZhciBoZWlnaHRUb1dpZHRoUmF0aW8gPSAoY29udGV4dEhlaWdodCA+IGNvbnRleHRXaWR0aCkgPyBjb250ZXh0SGVpZ2h0L2NvbnRleHRXaWR0aCA6IDE7XG5cbiAgICB2YXIgbGVmdCAgID0gLXdpZHRoVG9IZWlnaHRSYXRpbztcbiAgICB2YXIgcmlnaHQgID0gd2lkdGhUb0hlaWdodFJhdGlvO1xuICAgIHZhciB0b3AgICAgPSBoZWlnaHRUb1dpZHRoUmF0aW87XG4gICAgdmFyIGJvdHRvbSA9IC1oZWlnaHRUb1dpZHRoUmF0aW87XG5cbiAgICB2YXIgbHIgPSAxIC8gKGxlZnQgLSByaWdodCk7XG4gICAgdmFyIGJ0ID0gMSAvIChib3R0b20gLSB0b3ApO1xuICAgIHZhciBuZiA9IDEgLyAobmVhciAtIGZhcik7XG5cbiAgICB0cmFuc2Zvcm1bMF0gID0gLTIgKiBscjtcbiAgICB0cmFuc2Zvcm1bMV0gID0gMDtcbiAgICB0cmFuc2Zvcm1bMl0gID0gMDtcbiAgICB0cmFuc2Zvcm1bM10gID0gMDtcbiAgICBcbiAgICB0cmFuc2Zvcm1bNF0gID0gMDtcbiAgICB0cmFuc2Zvcm1bNV0gID0gLTIgKiBidDtcbiAgICB0cmFuc2Zvcm1bNl0gID0gMDtcbiAgICB0cmFuc2Zvcm1bN10gID0gMDtcbiAgICBcbiAgICB0cmFuc2Zvcm1bOF0gID0gMDtcbiAgICB0cmFuc2Zvcm1bOV0gID0gMDtcbiAgICB0cmFuc2Zvcm1bMTBdID0gMiAqIG5mO1xuICAgIHRyYW5zZm9ybVsxMV0gPSAwO1xuICAgIFxuICAgIHRyYW5zZm9ybVsxMl0gPSAobGVmdCArIHJpZ2h0KSAqIGxyO1xuICAgIHRyYW5zZm9ybVsxM10gPSAodG9wICsgYm90dG9tKSAqIGJ0O1xuICAgIHRyYW5zZm9ybVsxNF0gPSAoZmFyICsgbmVhcikgKiBuZjtcbiAgICB0cmFuc2Zvcm1bMTVdID0gMTtcblxuICAgIHJldHVybiB0cmFuc2Zvcm07XG59O1xuXG5DYW1lcmEucHJvamVjdGlvblRyYW5zZm9ybXMucGVyc3BlY3RpdmUgPSBmdW5jdGlvbiBwZXJzcGVjdGl2ZSh0cmFuc2Zvcm0sIGZvdnksIG5lYXIsIGZhcikge1xuICAgIHZhciBjb250ZXh0U2l6ZSAgID0gdGhpcy5fZW50aXR5LmdldENvbnRleHQoKS5fc2l6ZTtcbiAgICB2YXIgY29udGV4dFdpZHRoICA9IGNvbnRleHRTaXplWzBdO1xuICAgIHZhciBjb250ZXh0SGVpZ2h0ID0gY29udGV4dFNpemVbMV07XG5cbiAgICB2YXIgYXNwZWN0ID0gY29udGV4dFdpZHRoL2NvbnRleHRIZWlnaHQ7XG5cbiAgICB2YXIgZiAgPSAxLjAgLyBNYXRoLnRhbihmb3Z5IC8gMik7XG4gICAgdmFyIG5mID0gMSAvIChuZWFyIC0gZmFyKTtcblxuICAgIHRyYW5zZm9ybVswXSAgPSBmIC8gYXNwZWN0O1xuICAgIHRyYW5zZm9ybVsxXSAgPSAwO1xuICAgIHRyYW5zZm9ybVsyXSAgPSAwO1xuICAgIHRyYW5zZm9ybVszXSAgPSAwO1xuICAgIHRyYW5zZm9ybVs0XSAgPSAwO1xuICAgIHRyYW5zZm9ybVs1XSAgPSBmO1xuICAgIHRyYW5zZm9ybVs2XSAgPSAwO1xuICAgIHRyYW5zZm9ybVs3XSAgPSAwO1xuICAgIHRyYW5zZm9ybVs4XSAgPSAwO1xuICAgIHRyYW5zZm9ybVs5XSAgPSAwO1xuICAgIHRyYW5zZm9ybVsxMF0gPSAoZmFyICsgbmVhcikgKiBuZjtcbiAgICB0cmFuc2Zvcm1bMTFdID0gLTE7XG4gICAgdHJhbnNmb3JtWzEyXSA9IDA7XG4gICAgdHJhbnNmb3JtWzEzXSA9IDA7XG4gICAgdHJhbnNmb3JtWzE0XSA9ICgyICogZmFyICogbmVhcikgKiBuZjtcbiAgICB0cmFuc2Zvcm1bMTVdID0gMDtcbiAgICByZXR1cm4gdHJhbnNmb3JtO1xufTtcblxuZnVuY3Rpb24gX2V2ZW50c0NoYW5nZShkYXRhKSB7XG4gICAgaWYgKGRhdGEuaWQgPT09IFBST0pFQ1RJT04pIHtcbiAgICAgICAgX3JlY2FsY3VsYXRlUHJvamVjdGlvblRyYW5zZm9ybS5jYWxsKHRoaXMpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gX3JlY2FsY3VsYXRlUHJvamVjdGlvblRyYW5zZm9ybSgpIHtcbiAgICB2YXIgb3B0aW9ucyA9IFt0aGlzLl9wcm9qZWN0aW9uVHJhbnNmb3JtXTtcbiAgICBmb3IgKHZhciBrZXkgaW4gdGhpcy5vcHRpb25zLnByb2plY3Rpb24ub3B0aW9ucykge1xuICAgICAgICBvcHRpb25zLnB1c2godGhpcy5vcHRpb25zLnByb2plY3Rpb24ub3B0aW9uc1trZXldKTtcbiAgICB9XG4gICAgcmV0dXJuIENhbWVyYS5wcm9qZWN0aW9uVHJhbnNmb3Jtc1t0aGlzLm9wdGlvbnMucHJvamVjdGlvbi50eXBlXS5hcHBseSh0aGlzLCBvcHRpb25zKTtcbn1cblxuQ2FtZXJhLnByb3RvdHlwZS5nZXRQcm9qZWN0aW9uVHJhbnNmb3JtID0gZnVuY3Rpb24gZ2V0UHJvamVjdGlvblRyYW5zZm9ybSgpIHtcbiAgICByZXR1cm4gdGhpcy5fcHJvamVjdGlvblRyYW5zZm9ybTtcbn07XG5cbkNhbWVyYS5wcm90b3R5cGUuc2V0T3B0aW9ucyA9IGZ1bmN0aW9uIHNldE9wdGlvbnMob3B0aW9ucykge1xuICAgIHJldHVybiB0aGlzLl9vcHRpb25zTWFuYWdlci5zZXRPcHRpb25zKG9wdGlvbnMpO1xufTtcblxuQ2FtZXJhLnByb3RvdHlwZS5nZXRPcHRpb25zID0gZnVuY3Rpb24gZ2V0T3B0aW9ucygpIHtcbiAgICByZXR1cm4gdGhpcy5vcHRpb25zO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBDYW1lcmE7XG4iLCIvKiBUaGlzIFNvdXJjZSBDb2RlIEZvcm0gaXMgc3ViamVjdCB0byB0aGUgdGVybXMgb2YgdGhlIE1vemlsbGEgUHVibGljXG4gKiBMaWNlbnNlLCB2LiAyLjAuIElmIGEgY29weSBvZiB0aGUgTVBMIHdhcyBub3QgZGlzdHJpYnV0ZWQgd2l0aCB0aGlzXG4gKiBmaWxlLCBZb3UgY2FuIG9idGFpbiBvbmUgYXQgaHR0cDovL21vemlsbGEub3JnL01QTC8yLjAvLlxuICpcbiAqIE93bmVyczogZGFuQGZhbW8udXNcbiAqICAgICAgICAgZmVsaXhAZmFtby51c1xuICogICAgICAgICBtaWtlQGZhbW8udXNcbiAqXG4gKiBAbGljZW5zZSBNUEwgMi4wXG4gKiBAY29weXJpZ2h0IEZhbW91cyBJbmR1c3RyaWVzLCBJbmMuIDIwMTRcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBFbnRpdHlSZWdpc3RyeSA9IHJlcXVpcmUoJy4uL0VudGl0eVJlZ2lzdHJ5Jyk7XG52YXIgTWF0cml4TWF0aCAgICAgPSByZXF1aXJlKCcuLi8uLi9tYXRoLzR4NG1hdHJpeCcpO1xudmFyIEV2ZW50SGFuZGxlciAgID0gcmVxdWlyZSgnLi4vLi4vZXZlbnRzL0V2ZW50SGFuZGxlcicpO1xuXG4vLyBDb25zdHNcbnZhciBDT05UQUlORVIgPSAnY29udGFpbmVyJztcblxuLyoqXG4gKiBDb250YWluZXIgaXMgYSBjb21wb25lbnQgdGhhdCBjYW4gYmUgYWRkZWQgdG8gYW4gRW50aXR5IHRoYXRcbiAqICAgaXMgcmVwcmVzZW50ZWQgYnkgYSBET00gbm9kZSB0aHJvdWdoIHdoaWNoIG90aGVyIHJlbmRlcmFibGVzXG4gKiAgIGluIHRoZSBzY2VuZSBncmFwaCBjYW4gYmUgZHJhd24gaW5zaWRlIG9mLlxuICpcbiAqIEBjbGFzcyBDb250YWluZXJcbiAqIEBjb21wb25lbnRcbiAqIEBjb25zdHJ1Y3RvclxuICogXG4gKiBAcGFyYW0ge0VudGl0eX0gZW50aXR5ICBFbnRpdHkgdGhhdCB0aGUgQ29udGFpbmVyIGlzIGEgY29tcG9uZW50IG9mXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyBvcHRpb25zXG4gKi9cbmZ1bmN0aW9uIENvbnRhaW5lcihlbnRpdHksIG9wdGlvbnMpIHtcblxuICAgIC8vIFRPRE86IE1vc3Qgb2YgdGhlc2UgcHJvcGVydGllcyBzaG91bGQgYmUgYWNjZXNzZWQgZnJvbSBnZXR0ZXIgTWV0aG9kcywgbm90IHJlYWQgZGlyZWN0bHkgYXMgdGhleSBjdXJyZW50bHkgYXJlIGluIERPTVJlbmRlcmVyXG5cbiAgICBFbnRpdHlSZWdpc3RyeS5yZWdpc3RlcihlbnRpdHksICdIYXNDb250YWluZXInKTtcbiAgICB0aGlzLl9lbnRpdHkgICAgICAgID0gZW50aXR5O1xuICAgIHRoaXMuX2NvbnRhaW5lciAgICAgPSBvcHRpb25zLmNvbnRhaW5lcjtcbiAgICB2YXIgdHJhbnNmb3JtICAgICAgID0gZW50aXR5LmdldENvbXBvbmVudCgndHJhbnNmb3JtJyk7XG4gICAgdGhpcy5faW52ZXJzZU1hdHJpeCA9IG5ldyBGbG9hdDMyQXJyYXkoWzEsIDAsIDAsIDAsIDAsIDEsIDAsIDAsIDAsIDAsIDEsIDAsIDAsIDAsIDAsIDFdKTtcbiAgICB0aGlzLl9zaXplICAgICAgICAgID0gb3B0aW9ucy5zaXplIHx8IGVudGl0eS5nZXRDb250ZXh0KCkuX3NpemUuc2xpY2UoKTtcbiAgICB0aGlzLm9yaWdpbiAgICAgICAgID0gWzAuNSwgMC41XTtcblxuICAgIHRoaXMuX2V2ZW50T3V0cHV0ID0gbmV3IEV2ZW50SGFuZGxlcigpO1xuICAgIHRoaXMuX2V2ZW50T3V0cHV0LmJpbmRUaGlzKHRoaXMpO1xuXG4gICAgdGhpcy5fZXZlbnRzID0ge1xuICAgICAgICBldmVudEZvcndhcmRlcjogZnVuY3Rpb24gZXZlbnRGb3J3YXJkZXIoZXZlbnQpIHtcbiAgICAgICAgICAgIHRoaXMuZW1pdChldmVudC50eXBlLCBldmVudCk7XG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB9LmJpbmQodGhpcyksXG4gICAgICAgIG9uICAgIDogW10sXG4gICAgICAgIG9mZiAgIDogW10sXG4gICAgICAgIGRpcnR5IDogZmFsc2VcbiAgICB9O1xuXG4gICAgdGhpcy5fdHJhbnNmb3JtRGlydHkgPSB0cnVlO1xuICAgIHRoaXMuX3NpemVEaXJ0eSAgICAgID0gdHJ1ZTtcblxuICAgIC8vIEludmVyc2VzIHRoZSBDb250YWluZXIncyB0cmFuc2Zvcm0gbWF0cml4IHRvIGhhdmUgZWxlbWVudHMgbmVzdGVkIGluc2lkZVxuICAgIC8vIHRvIGFwcGVhciBpbiB3b3JsZCBzcGFjZS5cbiAgICB0cmFuc2Zvcm0ub24oJ2ludmFsaWRhdGVkJywgZnVuY3Rpb24ocmVwb3J0KSB7XG4gICAgICAgIE1hdHJpeE1hdGguaW52ZXJ0KHRoaXMuX2ludmVyc2VNYXRyaXgsIHRyYW5zZm9ybS5fbWF0cml4KTtcbiAgICAgICAgdGhpcy5fdHJhbnNmb3JtRGlydHkgPSB0cnVlO1xuICAgIH0uYmluZCh0aGlzKSk7XG59XG5cbkNvbnRhaW5lci50b1N0cmluZyA9IGZ1bmN0aW9uIHRvU3RyaW5nKCkge1xuICAgIHJldHVybiBDT05UQUlORVI7XG59O1xuXG4vKipcbiAqIEJpbmQgYSBjYWxsYmFjayBmdW5jdGlvbiB0byBhbiBldmVudCB0eXBlIGhhbmRsZWQgYnkgdGhpcyBvYmplY3Qnc1xuICogIEV2ZW50SGFuZGxlci5cbiAqXG4gKiBAbWV0aG9kIG9uXG4gKiBAY2hhaW5hYmxlXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHR5cGUgZXZlbnQgdHlwZSBrZXkgKGZvciBleGFtcGxlLCAnY2xpY2snKVxuICogQHBhcmFtIHtmdW5jdGlvbihzdHJpbmcsIE9iamVjdCl9IGhhbmRsZXIgY2FsbGJhY2tcbiAqL1xuQ29udGFpbmVyLnByb3RvdHlwZS5vbiA9IGZ1bmN0aW9uIG9uKGV2ZW50LCBjYikge1xuICAgIGlmICh0eXBlb2YgZXZlbnQgPT09ICdzdHJpbmcnICYmIGNiIGluc3RhbmNlb2YgRnVuY3Rpb24pIHtcbiAgICAgICAgdGhpcy5fZXZlbnRPdXRwdXQub24oZXZlbnQsIGNiKTtcbiAgICAgICAgaWYgKHRoaXMuX2V2ZW50cy5vbi5pbmRleE9mKGV2ZW50KSA8IDApIHtcbiAgICAgICAgICAgIHRoaXMuX2V2ZW50cy5vbi5wdXNoKGV2ZW50KTtcbiAgICAgICAgICAgIHRoaXMuX2V2ZW50cy5kaXJ0eSA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGluZGV4ID0gdGhpcy5fZXZlbnRzLm9mZi5pbmRleE9mKGV2ZW50KTtcbiAgICAgICAgaWYgKGluZGV4ID4gLTEpIHRoaXMuX2V2ZW50cy5vZmYuc3BsaWNlKGluZGV4LCAxKTtcbiAgICB9IGVsc2UgdGhyb3cgbmV3IEVycm9yKCdvbiB0YWtlcyBhbiBldmVudCBuYW1lIGFzIGEgc3RyaW5nIGFuZCBhIGNhbGxiYWNrIHRvIGJlIGZpcmVkIHdoZW4gdGhhdCBldmVudCBpcyByZWNlaXZlZCcpO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBSZW1vdmUgYSBmdW5jdGlvbiB0byBhIHBhcnRpY3VsYXIgZXZlbnQgb2NjdXJpbmcuXG4gKlxuICogQG1ldGhvZCAgb2ZmXG4gKiBAY2hhaW5hYmxlXG4gKiBcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudCBuYW1lIG9mIHRoZSBldmVudCB0byBjYWxsIHRoZSBmdW5jdGlvbiB3aGVuIG9jY3VyaW5nXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYiBjYWxsYmFjayBmdW5jdGlvbiB0byBiZSBjYWxsZWQgd2hlbiB0aGUgZXZlbnQgaXMgcmVjaWV2ZWQuXG4gKi9cbkNvbnRhaW5lci5wcm90b3R5cGUub2ZmID0gZnVuY3Rpb24gb2ZmKGV2ZW50LCBjYikge1xuICAgIGlmICh0eXBlb2YgZXZlbnQgPT09ICdzdHJpbmcnICYmIGNiIGluc3RhbmNlb2YgRnVuY3Rpb24pIHtcbiAgICAgICAgdmFyIGluZGV4ID0gdGhpcy5fZXZlbnRzLm9uLmluZGV4T2YoZXZlbnQpO1xuICAgICAgICBpZiAoaW5kZXggPj0gMCkge1xuICAgICAgICAgICAgdGhpcy5fZXZlbnRPdXRwdXQucmVtb3ZlTGlzdGVuZXIoZXZlbnQsIGNiKTtcbiAgICAgICAgICAgIHRoaXMuX2V2ZW50cy5vbi5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgdGhpcy5fZXZlbnRzLm9mZi5wdXNoKGV2ZW50KTtcbiAgICAgICAgICAgIHRoaXMuX2V2ZW50cy5kaXJ0eSA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9IGVsc2UgdGhyb3cgbmV3IEVycm9yKCdvZmYgdGFrZXMgYW4gZXZlbnQgbmFtZSBhcyBhIHN0cmluZyBhbmQgYSBjYWxsYmFjayB0byBiZSBmaXJlZCB3aGVuIHRoYXQgZXZlbnQgaXMgcmVjZWl2ZWQnKTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQWRkIGV2ZW50IGhhbmRsZXIgb2JqZWN0IHRvIHRoZSBFdmVudEhhbmRsZXIncyBkb3duc3RyZWFtIGhhbmRsZXJzLlxuICpcbiAqIEBtZXRob2QgcGlwZVxuICpcbiAqIEBwYXJhbSB7RXZlbnRIYW5kbGVyfSB0YXJnZXQgZXZlbnQgaGFuZGxlciB0YXJnZXQgb2JqZWN0XG4gKiBAcmV0dXJuIHtFdmVudEhhbmRsZXJ9IHBhc3NlZCBldmVudCBoYW5kbGVyXG4gKi9cbkNvbnRhaW5lci5wcm90b3R5cGUucGlwZSA9IGZ1bmN0aW9uIHBpcGUodGFyZ2V0KSB7XG4gICAgdmFyIHJlc3VsdCA9IHRoaXMuX2V2ZW50T3V0cHV0LnBpcGUodGFyZ2V0KTtcbiAgICBmb3IgKHZhciBldmVudCBpbiB0aGlzLl9ldmVudE91dHB1dC5saXN0ZW5lcnMpIHtcbiAgICAgICAgaWYgKHRoaXMuX2V2ZW50cy5vbi5pbmRleE9mKGV2ZW50KSA8IDApIHtcbiAgICAgICAgICAgIHRoaXMuX2V2ZW50cy5vbi5wdXNoKGV2ZW50KTtcbiAgICAgICAgICAgIHRoaXMuX2V2ZW50cy5kaXJ0eSA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbn07XG5cbiAvKipcbiAqIFJlbW92ZSBoYW5kbGVyIG9iamVjdCBmcm9tIHRoZSBFdmVudEhhbmRsZXIncyBkb3duc3RyZWFtIGhhbmRsZXJzLlxuICogICBVbmRvZXMgd29yayBvZiBcInBpcGVcIi5cbiAqXG4gKiBAbWV0aG9kIHVucGlwZVxuICpcbiAqIEBwYXJhbSB7RXZlbnRIYW5kbGVyfSB0YXJnZXQgdGFyZ2V0IGhhbmRsZXIgb2JqZWN0XG4gKiBAcmV0dXJuIHtFdmVudEhhbmRsZXJ9IHByb3ZpZGVkIHRhcmdldFxuICovXG5Db250YWluZXIucHJvdG90eXBlLnVucGlwZSA9IGZ1bmN0aW9uIHVucGlwZSh0YXJnZXQpIHtcbiAgICByZXR1cm4gdGhpcy5fZXZlbnRPdXRwdXQudW5waXBlKHRhcmdldCk7XG59O1xuXG4vKipcbiAqIFRyaWdnZXIgYW4gZXZlbnQsIHNlbmRpbmcgdG8gYWxsIG9mIHRoZSBFdmVuZXRIYW5kbGVyJ3MgXG4gKiAgZG93bnN0cmVhbSBoYW5kbGVycyBsaXN0ZW5pbmcgZm9yIHByb3ZpZGVkICd0eXBlJyBrZXkuXG4gKlxuICogQG1ldGhvZCBlbWl0XG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHR5cGUgZXZlbnQgdHlwZSBrZXkgKGZvciBleGFtcGxlLCAnY2xpY2snKVxuICogQHBhcmFtIHtPYmplY3R9IGV2ZW50IGV2ZW50IGRhdGFcbiAqIEByZXR1cm4ge0V2ZW50SGFuZGxlcn0gdGhpc1xuICovXG5Db250YWluZXIucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbiBlbWl0KHR5cGUsIGV2ZW50KSB7XG4gICAgaWYgKGV2ZW50ICYmICFldmVudC5vcmlnaW4pIGV2ZW50Lm9yaWdpbiA9IHRoaXM7XG4gICAgdmFyIGhhbmRsZWQgPSB0aGlzLl9ldmVudE91dHB1dC5lbWl0KHR5cGUsIGV2ZW50KTtcbiAgICBpZiAoaGFuZGxlZCAmJiBldmVudCAmJiBldmVudC5zdG9wUHJvcGFnYXRpb24pIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIHJldHVybiBoYW5kbGVkO1xufTtcblxuLyoqXG4gKiBHZXQgdGhlIGRpc3BsYXkgbWF0cml4IG9mIHRoZSBDb250YWluZXIuXG4gKlxuICogQG1ldGhvZCBnZXREaXNwbGF5TWF0cml4XG4gKiBcbiAqIEByZXR1cm4ge0FycmF5fSBkaXNwbGF5IG1hdHJpeCBvZiB0aGUgQ29udGFpbmVyXG4gKi9cbkNvbnRhaW5lci5wcm90b3R5cGUuZ2V0RGlzcGxheU1hdHJpeCA9IGZ1bmN0aW9uIGdldERpc3BsYXlNYXRyaXgoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2ludmVyc2VNYXRyaXg7XG59O1xuXG4vKipcbiAqIEdldCB0aGUgc2l6ZSBvZiB0aGUgQ29udGFpbmVyLlxuICpcbiAqIEBtZXRob2QgZ2V0U2l6ZVxuICogXG4gKiBAcmV0dXJuIHtBcnJheX0gMiBkaW1lbnNpb25hbCBhcnJheSBvZiByZXByZXNlbnRpbmcgdGhlIHNpemUgb2YgdGhlIENvbnRhaW5lclxuICovXG5Db250YWluZXIucHJvdG90eXBlLmdldFNpemUgPSBmdW5jdGlvbiBnZXRTaXplKCkge1xuICAgIHJldHVybiB0aGlzLl9zaXplO1xufTtcblxuLyoqXG4gKiBTZXQgdGhlIHNpemUgb2YgdGhlIENvbnRhaW5lci5cbiAqXG4gKiBAbWV0aG9kIHNldFNpemVcbiAqIEBjaGFpbmFibGVcbiAqIFxuICogQHJldHVybiB7QXJyYXl9IDIgZGltZW5zaW9uYWwgYXJyYXkgb2YgcmVwcmVzZW50aW5nIHRoZSBzaXplIG9mIHRoZSBDb250YWluZXJcbiAqL1xuQ29udGFpbmVyLnByb3RvdHlwZS5zZXRTaXplID0gZnVuY3Rpb24gc2V0U2l6ZSh3aWR0aCwgaGVpZ2h0KSB7XG4gICAgdGhpcy5fc2l6ZVswXSAgID0gd2lkdGg7XG4gICAgdGhpcy5fc2l6ZVsxXSAgID0gaGVpZ2h0O1xuICAgIHRoaXMuX3NpemVEaXJ0eSA9IHRydWU7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IENvbnRhaW5lcjtcbiIsIi8qIFRoaXMgU291cmNlIENvZGUgRm9ybSBpcyBzdWJqZWN0IHRvIHRoZSB0ZXJtcyBvZiB0aGUgTW96aWxsYSBQdWJsaWNcbiAqIExpY2Vuc2UsIHYuIDIuMC4gSWYgYSBjb3B5IG9mIHRoZSBNUEwgd2FzIG5vdCBkaXN0cmlidXRlZCB3aXRoIHRoaXNcbiAqIGZpbGUsIFlvdSBjYW4gb2J0YWluIG9uZSBhdCBodHRwOi8vbW96aWxsYS5vcmcvTVBMLzIuMC8uXG4gKlxuICogT3duZXJzOiBkYW5AZmFtby51c1xuICogICAgICAgICBmZWxpeEBmYW1vLnVzXG4gKiAgICAgICAgIG1pa2VAZmFtby51c1xuICpcbiAqIEBsaWNlbnNlIE1QTCAyLjBcbiAqIEBjb3B5cmlnaHQgRmFtb3VzIEluZHVzdHJpZXMsIEluYy4gMjAxNFxuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIEVudGl0eVJlZ2lzdHJ5ID0gcmVxdWlyZSgnLi4vRW50aXR5UmVnaXN0cnknKSxcbiAgICBUYXJnZXQgICAgICAgICA9IHJlcXVpcmUoJy4vVGFyZ2V0JyksXG4gICAgRXZlbnRIYW5kbGVyICAgPSByZXF1aXJlKCcuLi8uLi9ldmVudHMvRXZlbnRIYW5kbGVyJyk7XG5cbi8vIENPTlNUU1xudmFyIFRSQU5TRk9STSA9ICd0cmFuc2Zvcm0nO1xudmFyIFNJWkUgICAgICA9ICdzaXplJztcbnZhciBPUEFDSVRZICAgPSAnb3BhY2l0eSc7XG52YXIgU1VSRkFDRSAgID0gJ3N1cmZhY2UnO1xuXG4vKipcbiAqIFN1cmZhY2UgaXMgYSBjb21wb25lbnQgdGhhdCBkZWZpbmVzIHRoZSBkYXRhIHRoYXQgc2hvdWxkXG4gKiAgIGJlIGRyYXduIHRvIGFuIEhUTUxFbGVtZW50LiAgTWFuYWdlcyBDU1Mgc3R5bGVzLCBIVE1MIGF0dHJpYnV0ZXMsXG4gKiAgIGNsYXNzZXMsIGFuZCBjb250ZW50LlxuICpcbiAqIEBjbGFzcyBTdXJmYWNlXG4gKiBAY29tcG9uZW50XG4gKiBAY29uc3RydWN0b3JcbiAqIFxuICogQHBhcmFtIHtFbnRpdHl9IGVudGl0eSBFbnRpdHkgdGhhdCB0aGUgU3VyZmFjZSBpcyBhIGNvbXBvbmVudCBvZlxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgaW5zdGFudGlhdGlvbiBvcHRpb25zXG4gKi9cbmZ1bmN0aW9uIFN1cmZhY2UoZW50aXR5LCBvcHRpb25zKSB7XG4gICAgVGFyZ2V0LmNhbGwodGhpcywgZW50aXR5LCB7XG4gICAgICAgIHZlcnRpY2llczogW25ldyBGbG9hdDMyQXJyYXkoWzAsIDAsIDAsIDFdKSxcbiAgICAgICAgICAgICAgICAgICAgbmV3IEZsb2F0MzJBcnJheShbMCwgMCwgMCwgMV0pLFxuICAgICAgICAgICAgICAgICAgICBuZXcgRmxvYXQzMkFycmF5KFswLCAwLCAwLCAxXSksXG4gICAgICAgICAgICAgICAgICAgIG5ldyBGbG9hdDMyQXJyYXkoWzAsIDAsIDAsIDFdKV1cbiAgICB9KTtcblxuICAgIEVudGl0eVJlZ2lzdHJ5LnJlZ2lzdGVyKGVudGl0eSwgJ1N1cmZhY2VzJyk7XG4gICAgRW50aXR5UmVnaXN0cnkucmVnaXN0ZXIoZW50aXR5LCAnUmVuZGVyYWJsZXMnKTtcbiAgICBcbiAgICB0aGlzLl9lbnRpdHkgPSBlbnRpdHk7XG4gICAgdGhpcy5fc2l6ZSAgID0gbmV3IEZsb2F0MzJBcnJheShbMCwwXSk7XG5cbiAgICB0aGlzLmludmFsaWRhdGlvbnMgPSAxMjc7XG4gICAgdGhpcy5fZXZlbnRPdXRwdXQgID0gbmV3IEV2ZW50SGFuZGxlcigpO1xuICAgIHRoaXMuX2V2ZW50T3V0cHV0LmJpbmRUaGlzKHRoaXMpO1xuICAgIHRoaXMuX2V2ZW50Rm9yd2FyZGVyID0gZnVuY3Rpb24gX2V2ZW50Rm9yd2FyZGVyKGV2ZW50KSB7XG4gICAgICAgIHRoaXMuX2V2ZW50T3V0cHV0LmVtaXQoZXZlbnQudHlwZSwgZXZlbnQpO1xuICAgIH0uYmluZCh0aGlzKTtcblxuICAgIHRoaXMuc3BlYyA9IHtcbiAgICAgICAgX2lkICAgICAgICAgICAgOiBlbnRpdHkuX2lkLFxuICAgICAgICBjbGFzc2VzICAgICAgICA6IFtdLFxuICAgICAgICBhdHRyaWJ1dGVzICAgICA6IHt9LFxuICAgICAgICBwcm9wZXJ0aWVzICAgICA6IHt9LFxuICAgICAgICBjb250ZW50ICAgICAgICA6IG51bGwsXG4gICAgICAgIGludmFsaWRhdGlvbnMgIDogKDEgPDwgT2JqZWN0LmtleXMoU3VyZmFjZS5pbnZhbGlkYXRpb25zKS5sZW5ndGgpIC0gMSxcbiAgICAgICAgb3JpZ2luICAgICAgICAgOiBuZXcgRmxvYXQzMkFycmF5KFswLjUsIDAuNV0pLFxuICAgICAgICBldmVudHMgICAgICAgICA6IFtdLFxuICAgICAgICBldmVudEZvcndhcmRlciA6IHRoaXMuX2V2ZW50Rm9yd2FyZGVyXG4gICAgfTtcblxuICAgIGVudGl0eS5nZXRDb21wb25lbnQoVFJBTlNGT1JNKS5vbignaW52YWxpZGF0ZWQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuaW52YWxpZGF0aW9ucyB8PSBTdXJmYWNlLmludmFsaWRhdGlvbnMudHJhbnNmb3JtO1xuICAgIH0uYmluZCh0aGlzKSk7XG5cbiAgICB0aGlzLnNldE9wdGlvbnMob3B0aW9ucyk7XG5cbiAgICB0aGlzLl9oYXNPcmlnaW4gPSB0cnVlO1xufVxuXG5TdXJmYWNlLnByb3RvdHlwZSAgICAgICAgICAgICA9IE9iamVjdC5jcmVhdGUoVGFyZ2V0LnByb3RvdHlwZSk7XG5TdXJmYWNlLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFN1cmZhY2U7XG5cbi8vIEludmFsaWRhdGlvbiBTY2hlbWVcblN1cmZhY2UuaW52YWxpZGF0aW9ucyA9IHtcbiAgICBjbGFzc2VzICAgIDogMSxcbiAgICBwcm9wZXJ0aWVzIDogMixcbiAgICBhdHRyaWJ1dGVzIDogNCxcbiAgICBjb250ZW50ICAgIDogOCxcbiAgICB0cmFuc2Zvcm0gIDogMTYsXG4gICAgc2l6ZSAgICAgICA6IDMyLFxuICAgIG9wYWNpdHkgICAgOiA2NCxcbiAgICBvcmlnaW4gICAgIDogMTI4LFxuICAgIGV2ZW50cyAgICAgOiAyNTZcbn07XG5cblN1cmZhY2UudG9TdHJpbmcgPSBmdW5jdGlvbiB0b1N0cmluZygpIHtyZXR1cm4gU1VSRkFDRTt9O1xuXG4vKipcbiAqIEdldCB0aGUgRW50aXR5IHRoZSBTdXJmYWNlIGlzIGEgY29tcG9uZW50IG9mLlxuICpcbiAqIEBtZXRob2QgZ2V0RW50aXR5XG4gKlxuICogQHJldHVybiB7RW50aXR5fSB0aGUgRW50aXR5IHRoZSBTdXJmYWNlIGlzIGEgY29tcG9uZW50IG9mXG4gKi9cblN1cmZhY2UucHJvdG90eXBlLmdldEVudGl0eSA9IGZ1bmN0aW9uIGdldEVudGl0eSgpIHtcbiAgICByZXR1cm4gdGhpcy5fZW50aXR5O1xufTtcblxuLyoqXG4gKiBTZXQgdGhlIG9wdGlvbnMgb2YgdGhlIFN1cmZhY2UuXG4gKlxuICogQG1ldGhvZCBzZXRPcHRpb25zXG4gKiBcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIG9iamVjdCBvZiBvcHRpb25zXG4gKi9cblN1cmZhY2UucHJvdG90eXBlLnNldE9wdGlvbnMgPSBmdW5jdGlvbiBzZXRPcHRpb25zKG9wdGlvbnMpIHtcbiAgICBpZiAob3B0aW9ucy5wcm9wZXJ0aWVzKSAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNldFByb3BlcnRpZXMob3B0aW9ucy5wcm9wZXJ0aWVzKTtcbiAgICBpZiAob3B0aW9ucy5jbGFzc2VzKSAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNldENsYXNzZXMob3B0aW9ucy5jbGFzc2VzKTtcbiAgICBpZiAob3B0aW9ucy5hdHRyaWJ1dGVzKSAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNldEF0dHJpYnV0ZXMob3B0aW9ucy5hdHRyaWJ1dGVzKTtcbiAgICBpZiAob3B0aW9ucy5jb250ZW50IHx8IG9wdGlvbnMuY29udGVudCA9PT0gJycpICB0aGlzLnNldENvbnRlbnQob3B0aW9ucy5jb250ZW50KTtcbiAgICBpZiAob3B0aW9ucy5zaXplKSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNldFNpemUob3B0aW9ucy5zaXplKTtcbn07XG5cbi8qKlxuICogU2V0IHRoZSBDU1MgY2xhc3NlcyB0byBiZSBhIG5ldyBBcnJheSBvZiBzdHJpbmdzLlxuICpcbiAqIEBtZXRob2Qgc2V0Q2xhc3Nlc1xuICogXG4gKiBAcGFyYW0ge0FycmF5fSBhcnJheSBvZiBDU1MgY2xhc3Nlc1xuICovXG5TdXJmYWNlLnByb3RvdHlwZS5zZXRDbGFzc2VzID0gZnVuY3Rpb24gc2V0Q2xhc3NlcyhjbGFzc0xpc3QpIHtcbiAgICBpZiAoIUFycmF5LmlzQXJyYXkoY2xhc3NMaXN0KSkgdGhyb3cgbmV3IEVycm9yKFwiU3VyZmFjZTogZXhwZWN0cyBhbiBBcnJheSB0byBiZSBwYXNzZWQgdG8gc2V0Q2xhc3Nlc1wiKTtcblxuICAgIHZhciBpID0gMDtcbiAgICB2YXIgcmVtb3ZhbCA9IFtdO1xuXG4gICAgZm9yIChpID0gMDsgaSA8IHRoaXMuc3BlYy5jbGFzc2VzLmxlbmd0aDsgaSsrKVxuICAgICAgICBpZiAoY2xhc3NMaXN0LmluZGV4T2YodGhpcy5zcGVjLmNsYXNzZXNbaV0pIDwgMClcbiAgICAgICAgICAgIHJlbW92YWwucHVzaCh0aGlzLnNwZWMuY2xhc3Nlc1tpXSk7XG5cbiAgICBmb3IgKGkgPSAwOyBpIDwgcmVtb3ZhbC5sZW5ndGg7IGkrKykgICB0aGlzLnJlbW92ZUNsYXNzKHJlbW92YWxbaV0pO1xuICAgIGZvciAoaSA9IDA7IGkgPCBjbGFzc0xpc3QubGVuZ3RoOyBpKyspIHRoaXMuYWRkQ2xhc3MoY2xhc3NMaXN0W2ldKTtcblxuICAgIHRoaXMuaW52YWxpZGF0aW9ucyB8PSBTdXJmYWNlLmludmFsaWRhdGlvbnMuc2l6ZTtcbn07XG5cbi8qKlxuICogUmV0dXJuIGFsbCBvZiB0aGUgY2xhc3NlcyBhc3NvY2lhdGVkIHdpdGggdGhpcyBTdXJmYWNlXG4gKlxuICogQG1ldGhvZCBnZXRDbGFzc2VzXG4gKiBcbiAqIEByZXR1cm4ge0FycmF5fSBhcnJheSBvZiBDU1MgY2xhc3Nlc1xuICovXG5TdXJmYWNlLnByb3RvdHlwZS5nZXRDbGFzc2VzID0gZnVuY3Rpb24gZ2V0Q2xhc3NlcygpIHtcbiAgICByZXR1cm4gdGhpcy5zcGVjLmNsYXNzZXM7XG59O1xuXG4vKipcbiAqIEFkZCBhIHNpbmdsZSBjbGFzcyB0byB0aGUgU3VyZmFjZSdzIGxpc3Qgb2YgY2xhc3Nlcy5cbiAqICAgSW52YWxpZGF0ZXMgdGhlIFN1cmZhY2UncyBjbGFzc2VzLlxuICpcbiAqIEBtZXRob2QgYWRkQ2xhc3NcbiAqIFxuICogQHBhcmFtIHtTdHJpbmd9IGNsYXNzTmFtZSBuYW1lIG9mIHRoZSBjbGFzc1xuICovXG5TdXJmYWNlLnByb3RvdHlwZS5hZGRDbGFzcyA9IGZ1bmN0aW9uIGFkZENsYXNzKGNsYXNzTmFtZSkge1xuICAgIGlmICh0eXBlb2YgY2xhc3NOYW1lICE9PSAnc3RyaW5nJykgdGhyb3cgbmV3IEVycm9yKCdhZGRDbGFzcyBvbmx5IHRha2VzIFN0cmluZ3MgYXMgcGFyYW1ldGVycycpO1xuICAgIGlmICh0aGlzLnNwZWMuY2xhc3Nlcy5pbmRleE9mKGNsYXNzTmFtZSkgPCAwKSB7XG4gICAgICAgIHRoaXMuc3BlYy5jbGFzc2VzLnB1c2goY2xhc3NOYW1lKTtcbiAgICAgICAgdGhpcy5pbnZhbGlkYXRpb25zIHw9IFN1cmZhY2UuaW52YWxpZGF0aW9ucy5jbGFzc2VzO1xuICAgIH1cblxuICAgIHRoaXMuaW52YWxpZGF0aW9ucyB8PSBTdXJmYWNlLmludmFsaWRhdGlvbnMuc2l6ZTtcbn07XG5cbi8qKlxuICogUmVtb3ZlIGEgc2luZ2xlIGNsYXNzIGZyb20gdGhlIFN1cmZhY2UncyBsaXN0IG9mIGNsYXNzZXMuXG4gKiAgIEludmFsaWRhdGVzIHRoZSBTdXJmYWNlJ3MgY2xhc3Nlcy5cbiAqIFxuICogQG1ldGhvZCByZW1vdmVDbGFzc1xuICogXG4gKiBAcGFyYW0gIHtTdHJpbmd9IGNsYXNzTmFtZSBjbGFzcyB0byByZW1vdmVcbiAqL1xuU3VyZmFjZS5wcm90b3R5cGUucmVtb3ZlQ2xhc3MgPSBmdW5jdGlvbiByZW1vdmVDbGFzcyhjbGFzc05hbWUpIHtcbiAgICBpZiAodHlwZW9mIGNsYXNzTmFtZSAhPT0gJ3N0cmluZycpIHRocm93IG5ldyBFcnJvcignYWRkQ2xhc3Mgb25seSB0YWtlcyBTdHJpbmdzIGFzIHBhcmFtZXRlcnMnKTtcbiAgICB2YXIgaSA9IHRoaXMuc3BlYy5jbGFzc2VzLmluZGV4T2YoY2xhc3NOYW1lKTtcbiAgICBpZiAoaSA+PSAwKSB7XG4gICAgICAgIHRoaXMuc3BlYy5jbGFzc2VzLnNwbGljZShpLCAxKTtcbiAgICAgICAgdGhpcy5pbnZhbGlkYXRpb25zIHw9IFN1cmZhY2UuaW52YWxpZGF0aW9ucy5jbGFzc2VzO1xuICAgIH1cblxuICAgIHRoaXMuaW52YWxpZGF0aW9ucyB8PSBTdXJmYWNlLmludmFsaWRhdGlvbnMuc2l6ZTtcbn07XG5cbi8qKlxuICogU2V0IHRoZSBDU1MgcHJvcGVydGllcyBhc3NvY2lhdGVkIHdpdGggdGhlIFN1cmZhY2UuXG4gKiAgIEludmFsaWRhdGVzIHRoZSBTdXJmYWNlJ3MgcHJvcGVydGllcy5cbiAqXG4gKiBAbWV0aG9kIHNldFByb3BlcnRpZXNcbiAqL1xuU3VyZmFjZS5wcm90b3R5cGUuc2V0UHJvcGVydGllcyA9IGZ1bmN0aW9uIHNldFByb3BlcnRpZXMocHJvcGVydGllcykge1xuICAgIGZvciAodmFyIG4gaW4gcHJvcGVydGllcykgdGhpcy5zcGVjLnByb3BlcnRpZXNbbl0gPSBwcm9wZXJ0aWVzW25dO1xuICAgIHRoaXMuaW52YWxpZGF0aW9ucyB8PSBTdXJmYWNlLmludmFsaWRhdGlvbnMuc2l6ZTtcbiAgICB0aGlzLmludmFsaWRhdGlvbnMgfD0gU3VyZmFjZS5pbnZhbGlkYXRpb25zLnByb3BlcnRpZXM7XG59O1xuXG4vKipcbiAqIFJldHVybiB0aGUgQ1NTIHByb3BlcnRpZXMgYXNzb2NpYXRlZCB3aXRoIHRoZSBTdXJmYWNlLlxuICpcbiAqIEBtZXRob2QgZ2V0UHJvcGVydGllc1xuICogXG4gKiBAcmV0dXJuIHtPYmplY3R9IENTUyBwcm9wZXJ0aWVzIGFzc29jaWF0ZWQgd2l0aCB0aGUgU3VyZmFjZVxuICovXG5TdXJmYWNlLnByb3RvdHlwZS5nZXRQcm9wZXJ0aWVzID0gZnVuY3Rpb24gZ2V0UHJvcGVydGllcygpIHtcbiAgICByZXR1cm4gdGhpcy5zcGVjLnByb3BlcnRpZXM7XG59O1xuXG4vKipcbiAqIFNldCB0aGUgSFRNTCBhdHRyaWJ1dGVzIGFzc29jaWF0ZWQgd2l0aCB0aGUgU3VyZmFjZS5cbiAqICAgSW52YWxpZGF0ZXMgdGhlIFN1cmZhY2UncyBhdHRyaWJ1dGVzLlxuICpcbiAqIEBtZXRob2Qgc2V0QXR0cmlidXRlc1xuICovXG5TdXJmYWNlLnByb3RvdHlwZS5zZXRBdHRyaWJ1dGVzID0gZnVuY3Rpb24gc2V0QXR0cmlidXRlcyhhdHRyaWJ1dGVzKSB7XG4gICAgZm9yICh2YXIgbiBpbiBhdHRyaWJ1dGVzKSB0aGlzLnNwZWMuYXR0cmlidXRlc1tuXSA9IGF0dHJpYnV0ZXNbbl07XG4gICAgdGhpcy5pbnZhbGlkYXRpb25zIHw9IFN1cmZhY2UuaW52YWxpZGF0aW9ucy5hdHRyaWJ1dGVzO1xufTtcblxuLyoqXG4gKiBSZXR1cm4gdGhlIEhUTUwgYXR0cmlidXRlcyBhc3NvY2lhdGVkIHdpdGggdGhlIFN1cmZhY2UuXG4gKlxuICogQG1ldGhvZCBnZXRBdHRyaWJ1dGVzXG4gKiBcbiAqIEByZXR1cm4ge09iamVjdH0gSFRNTCBhdHRyaWJ1dGVzIGFzc29jaWF0ZWQgd2l0aCB0aGUgU3VyZmFjZVxuICovXG5TdXJmYWNlLnByb3RvdHlwZS5nZXRBdHRyaWJ1dGVzID0gZnVuY3Rpb24gZ2V0QXR0cmlidXRlcygpIHtcbiAgICByZXR1cm4gdGhpcy5zcGVjLmF0dHJpYnV0ZXM7XG59O1xuXG4vKipcbiAqIFNldCB0aGUgaW5uZXJIVE1MIGFzc29jaWF0ZWQgd2l0aCB0aGUgU3VyZmFjZS5cbiAqICAgSW52YWxpZGF0ZXMgdGhlIFN1cmZhY2UncyBjb250ZW50LlxuICpcbiAqIEBtZXRob2Qgc2V0Q29udGVudFxuICovXG5TdXJmYWNlLnByb3RvdHlwZS5zZXRDb250ZW50ID0gZnVuY3Rpb24gc2V0Q29udGVudChjb250ZW50KSB7XG4gICAgaWYgKGNvbnRlbnQgIT09IHRoaXMuc3BlYy5jb250ZW50KSB7XG4gICAgICAgIHRoaXMuc3BlYy5jb250ZW50ICAgPSBjb250ZW50O1xuICAgICAgICB0aGlzLmludmFsaWRhdGlvbnMgfD0gU3VyZmFjZS5pbnZhbGlkYXRpb25zLmNvbnRlbnQ7XG4gICAgfVxufTtcblxuLyoqXG4gKiBSZXR1cm4gdGhlIGlubmVySFRNTCBhc3NvY2lhdGVkIHdpdGggdGhlIFN1cmZhY2UuXG4gKlxuICogQG1ldGhvZCBnZXRDb250ZW50XG4gKiBcbiAqIEByZXR1cm4ge1N0cmluZ30gaW5uZXJIVE1MIGFzc29jaWF0ZWQgd2l0aCB0aGUgU3VyZmFjZVxuICovXG5TdXJmYWNlLnByb3RvdHlwZS5nZXRDb250ZW50ID0gZnVuY3Rpb24gZ2V0Q29udGVudCgpIHtcbiAgICByZXR1cm4gdGhpcy5zcGVjLmNvbnRlbnQ7XG59O1xuXG4vKipcbiAqIFNldCB0aGUgc2l6ZSBvZiB0aGUgU3VyZmFjZS5cbiAqXG4gKiBAbWV0aG9kIHNldFNpemVcbiAqXG4gKiBAcmV0dXJuIHtBcnJheX0gMi1kaW1lbnNpb25hbCBhcnJheSByZXByZXNlbnRpbmcgdGhlIHNpemUgb2YgdGhlIFN1cmZhY2UgaW4gcGl4ZWxzLlxuICovXG5TdXJmYWNlLnByb3RvdHlwZS5zZXRTaXplID0gZnVuY3Rpb24gc2V0U2l6ZShzaXplKSB7XG4gICAgdmFyIHByb3BlcnRpZXMgPSB7fTtcbiAgICBpZiAoc2l6ZVswXSAhPSBudWxsKSBwcm9wZXJ0aWVzLndpZHRoID0gc2l6ZVswXSArICdweCc7XG4gICAgaWYgKHNpemVbMV0gIT0gbnVsbCkgcHJvcGVydGllcy5oZWlnaHQgPSBzaXplWzFdICsgJ3B4JztcbiAgICB0aGlzLnNldFByb3BlcnRpZXMocHJvcGVydGllcyk7XG59O1xuXG4vKipcbiAqIEdldCB0aGUgc2l6ZSBvZiB0aGUgU3VyZmFjZS5cbiAqXG4gKiBAbWV0aG9kIGdldFNpemVcbiAqXG4gKiBAcmV0dXJuIHtBcnJheX0gMi1kaW1lbnNpb25hbCBhcnJheSByZXByZXNlbnRpbmcgdGhlIHNpemUgb2YgdGhlIFN1cmZhY2UgaW4gcGl4ZWxzLlxuICovXG5TdXJmYWNlLnByb3RvdHlwZS5nZXRTaXplID0gZnVuY3Rpb24gZ2V0U2l6ZSgpIHtcbiAgICByZXR1cm4gdGhpcy5fc2l6ZTtcbn07XG5cbi8qKlxuICogU2V0cyB0aGUgb3JpZ2luIG9mIHRoZSBTdXJmYWNlLlxuICpcbiAqIEBtZXRob2Qgc2V0T3JpZ2luXG4gKiBAY2hhaW5hYmxlXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IHggb3JpZ2luIG9uIHRoZSB4LWF4aXMgYXMgYSBwZXJjZW50XG4gKiBAcGFyYW0ge051bWJlcn0geSBvcmlnaW4gb24gdGhlIHktYXhpcyBhcyBhIHBlcmNlbnRcbiAqL1xuU3VyZmFjZS5wcm90b3R5cGUuc2V0T3JpZ2luICA9IGZ1bmN0aW9uIHNldE9yaWdpbih4LCB5KSB7XG4gICAgaWYgKCh4ICE9IG51bGwgJiYgKHggPCAwIHx8IHggPiAxKSkgfHwgKHkgIT0gbnVsbCAmJiAoeSA8IDAgfHwgeSA+IDEpKSlcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdPcmlnaW4gbXVzdCBoYXZlIGFuIHggYW5kIHkgdmFsdWUgYmV0d2VlbiAwIGFuZCAxJyk7XG5cbiAgICB0aGlzLnNwZWMub3JpZ2luWzBdID0geCAhPSBudWxsID8geCA6IHRoaXMuc3BlYy5vcmlnaW5bMF07XG4gICAgdGhpcy5zcGVjLm9yaWdpblsxXSA9IHkgIT0gbnVsbCA/IHkgOiB0aGlzLnNwZWMub3JpZ2luWzFdO1xuICAgIHRoaXMuaW52YWxpZGF0aW9ucyB8PSBTdXJmYWNlLmludmFsaWRhdGlvbnMub3JpZ2luO1xuXG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEdldHMgdGhlIG9yaWdpbiBvZiB0aGUgU3VyZmFjZS5cbiAqXG4gKiBAbWV0aG9kIGdldE9yaWdpblxuICpcbiAqIEByZXR1cm4ge0FycmF5fSAyLWRpbWVuc2lvbmFsIGFycmF5IHJlcHJlc2VudGluZyB0aGUgU3VyZmFjZSdzIG9yaWdpblxuICovXG5TdXJmYWNlLnByb3RvdHlwZS5nZXRPcmlnaW4gPSBmdW5jdGlvbiBnZXRPcmlnaW4oKSB7XG4gICAgcmV0dXJuIHRoaXMuc3BlYy5vcmlnaW47XG59O1xuXG4vKipcbiAqIFJlc2V0cyB0aGUgaW52YWxpZGF0aW9ucyBvZiB0aGUgU3VyZmFjZVxuICpcbiAqIEBtZXRob2QgcmVzZXRJbnZhbGlkYXRpb25zXG4gKiBAY2hhaW5hYmxlXG4gKlxuICogQHJldHVybiB7U3VyZmFjZX0gdGhpc1xuICovXG5TdXJmYWNlLnByb3RvdHlwZS5yZXNldEludmFsaWRhdGlvbnMgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmludmFsaWRhdGlvbnMgPSAwO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBNYXJrIGFsbCBwcm9wZXJ0aWVzIGFzIGludmFsaWRhdGVkLlxuICpcbiAqIEBtZXRob2QgaW52YWxpZGF0ZUFsbFxuICogQGNoYWluYWJsZVxuICpcbiAqIEByZXR1cm4ge1N1cmZhY2V9IHRoaXNcbiAqL1xuU3VyZmFjZS5wcm90b3R5cGUuaW52YWxpZGF0ZUFsbCA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuaW52YWxpZGF0aW9ucyA9IDUxMTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cblxuLyoqXG4gKiBCaW5kIGEgY2FsbGJhY2sgZnVuY3Rpb24gdG8gYW4gZXZlbnQgdHlwZSBoYW5kbGVkIGJ5IHRoaXMgU3VyZmFjZSdzXG4gKiAgRXZlbnRIYW5kbGVyLlxuICpcbiAqIEBtZXRob2Qgb25cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gdHlwZSBldmVudCB0eXBlIGtleSAoZm9yIGV4YW1wbGUsICdjbGljaycpXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKHN0cmluZywgT2JqZWN0KX0gaGFuZGxlciBjYWxsYmFja1xuICovXG5TdXJmYWNlLnByb3RvdHlwZS5vbiA9IGZ1bmN0aW9uIG9uKGV2ZW50LCBjYikge1xuICAgIGlmICh0eXBlb2YgZXZlbnQgPT09ICdzdHJpbmcnICYmIGNiIGluc3RhbmNlb2YgRnVuY3Rpb24pIHtcbiAgICAgICAgdGhpcy5fZXZlbnRPdXRwdXQub24oZXZlbnQsIGNiKTtcbiAgICAgICAgaWYgKHRoaXMuc3BlYy5ldmVudHMuaW5kZXhPZihldmVudCkgPCAwKSB7XG4gICAgICAgICAgICB0aGlzLnNwZWMuZXZlbnRzLnB1c2goZXZlbnQpO1xuICAgICAgICAgICAgdGhpcy5pbnZhbGlkYXRpb25zIHw9IFN1cmZhY2UuaW52YWxpZGF0aW9ucy5ldmVudHM7XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG4vKipcbiAqIFJlbW92ZSBhIGZ1bmN0aW9uIHRvIGEgcGFydGljdWxhciBldmVudCBvY2N1cmluZy5cbiAqXG4gKiBAbWV0aG9kICBvZmZcbiAqIFxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50IG5hbWUgb2YgdGhlIGV2ZW50IHRvIGNhbGwgdGhlIGZ1bmN0aW9uIHdoZW4gb2NjdXJpbmdcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNiIGNhbGxiYWNrIGZ1bmN0aW9uIHRvIGJlIGNhbGxlZCB3aGVuIHRoZSBldmVudCBpcyByZWNpZXZlZC5cbiAqL1xuU3VyZmFjZS5wcm90b3R5cGUub2ZmID0gZnVuY3Rpb24gb2ZmKGV2ZW50LCBjYikge1xuICAgIGlmICh0eXBlb2YgZXZlbnQgPT09ICdzdHJpbmcnICYmIGNiIGluc3RhbmNlb2YgRnVuY3Rpb24pIHtcbiAgICAgICAgdmFyIGluZGV4ID0gdGhpcy5zcGVjLmV2ZW50cy5pbmRleE9mKGV2ZW50KTtcbiAgICAgICAgaWYgKGluZGV4ID4gMCkge1xuICAgICAgICAgICAgdGhpcy5fZXZlbnRPdXRwdXQucmVtb3ZlTGlzdGVuZXIoZXZlbnQsIGNiKTtcbiAgICAgICAgICAgIHRoaXMuc3BlYy5ldmVudHMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgIHRoaXMuaW52YWxpZGF0aW9ucyB8PSBTdXJmYWNlLmludmFsaWRhdGlvbnMuZXZlbnRzO1xuICAgICAgICB9XG4gICAgfVxufTtcblxuLyoqXG4gKiBBZGQgZXZlbnQgaGFuZGxlciBvYmplY3QgdG8gdGhlIEV2ZW50SGFuZGxlcidzIGRvd25zdHJlYW0gaGFuZGxlcnMuXG4gKlxuICogQG1ldGhvZCBwaXBlXG4gKlxuICogQHBhcmFtIHtFdmVudEhhbmRsZXJ9IHRhcmdldCBldmVudCBoYW5kbGVyIHRhcmdldCBvYmplY3RcbiAqIEByZXR1cm4ge0V2ZW50SGFuZGxlcn0gcGFzc2VkIGV2ZW50IGhhbmRsZXJcbiAqL1xuU3VyZmFjZS5wcm90b3R5cGUucGlwZSA9IGZ1bmN0aW9uIHBpcGUodGFyZ2V0KSB7XG4gICAgcmV0dXJuIHRoaXMuX2V2ZW50T3V0cHV0LnBpcGUodGFyZ2V0KTtcbn07XG5cbi8qKlxuICogUmVtb3ZlIGhhbmRsZXIgb2JqZWN0IGZyb20gdGhlIEV2ZW50SGFuZGxlcidzIGRvd25zdHJlYW0gaGFuZGxlcnMuXG4gKiAgIFVuZG9lcyB3b3JrIG9mIFwicGlwZVwiLlxuICpcbiAqIEBtZXRob2QgdW5waXBlXG4gKlxuICogQHBhcmFtIHtFdmVudEhhbmRsZXJ9IHRhcmdldCB0YXJnZXQgaGFuZGxlciBvYmplY3RcbiAqIEByZXR1cm4ge0V2ZW50SGFuZGxlcn0gcHJvdmlkZWQgdGFyZ2V0XG4gKi9cblN1cmZhY2UucHJvdG90eXBlLnVucGlwZSA9IGZ1bmN0aW9uIHVucGlwZSh0YXJnZXQpIHtcbiAgICByZXR1cm4gdGhpcy5fZXZlbnRPdXRwdXQudW5waXBlKHRhcmdldCk7XG59O1xuXG4vKipcbiAqIEdldCB0aGUgcmVuZGVyIHNwZWNpZmljYXRpb24gb2YgdGhlIFN1cmZhY2UuXG4gKlxuICogQG1ldGhvZCAgcmVuZGVyXG4gKiBcbiAqIEByZXR1cm4ge09iamVjdH0gcmVuZGVyIHNwZWNpZmljYXRpb25cbiAqL1xuU3VyZmFjZS5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5zcGVjLmludmFsaWRhdGlvbnMgPSB0aGlzLmludmFsaWRhdGlvbnM7XG4gICAgcmV0dXJuIHRoaXMuc3BlYztcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gU3VyZmFjZTtcbiIsIi8qIFRoaXMgU291cmNlIENvZGUgRm9ybSBpcyBzdWJqZWN0IHRvIHRoZSB0ZXJtcyBvZiB0aGUgTW96aWxsYSBQdWJsaWNcbiAqIExpY2Vuc2UsIHYuIDIuMC4gSWYgYSBjb3B5IG9mIHRoZSBNUEwgd2FzIG5vdCBkaXN0cmlidXRlZCB3aXRoIHRoaXNcbiAqIGZpbGUsIFlvdSBjYW4gb2J0YWluIG9uZSBhdCBodHRwOi8vbW96aWxsYS5vcmcvTVBMLzIuMC8uXG4gKlxuICogT3duZXJzOiBkYW5AZmFtby51c1xuICpcbiAqIEBsaWNlbnNlIE1QTCAyLjBcbiAqIEBjb3B5cmlnaHQgRmFtb3VzIEluZHVzdHJpZXMsIEluYy4gMjAxNFxuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIE1hdHJpeE1hdGggPSByZXF1aXJlKCcuLi8uLi9tYXRoLzR4NG1hdHJpeCcpO1xuXG4vKipcbiAqIFRhcmdldCBpcyB0aGUgYmFzZSBjbGFzcyBmb3IgYWxsIHJlbmRlcmFibGVzLiAgSXQgaG9sZHMgdGhlIHN0YXRlIG9mXG4gKiAgIGl0cyB2ZXJ0aWNpZXMsIHRoZSBDb250YWluZXJzIGl0IGlzIGRlcGxveWVkIGluLCB0aGUgQ29udGV4dCBpdCBiZWxvbmdzXG4gKiAgIHRvLCBhbmQgd2hldGhlciBvciBub3Qgb3JpZ2luIGFsaWdubWVudCBuZWVkcyB0byBiZSBhcHBsaWVkLlxuICpcbiAqIEBjb21wb25lbnQgVGFyZ2V0XG4gKiBAY29uc3RydWN0b3JcbiAqXG4gKiBAcGFyYW0ge0VudGl0eX0gZW50aXR5ICBFbnRpdHkgdGhhdCB0aGUgVGFyZ2V0IGlzIGEgY29tcG9uZW50IG9mXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyBvcHRpb25zXG4gKi9cbmZ1bmN0aW9uIFRhcmdldChlbnRpdHksIG9wdGlvbnMpIHtcbiAgICB0aGlzLnZlcnRpY2llcyAgPSBvcHRpb25zLnZlcnRpY2llcyB8fCBbXTtcbiAgICB0aGlzLmNvbnRhaW5lcnMgPSB7fTtcbiAgICAvLyB0aGlzLmNvbnRleHQgICAgPSBlbnRpdHkuZ2V0Q29udGV4dCgpLl9pZDtcbiAgICB0aGlzLl9oYXNPcmlnaW4gPSBmYWxzZTtcbn1cblxuLyoqXG4gKiBHZXQgdGhlIHZlcnRpY2llcyBvZiB0aGUgVGFyZ2V0LlxuICpcbiAqIEBtZXRob2QgZ2V0VmVydGljaWVzXG4gKlxuICogQHJldHVybiB7QXJyYXl9IGFycmF5IG9mIHRoZSB2ZXJ0aWNpZXMgcmVwcmVzZW50ZWQgYXMgdGhyZWUgZWxlbWVudCBhcnJheXMgW3gsIHksIHpdXG4gKi9cblRhcmdldC5wcm90b3R5cGUuZ2V0VmVydGljaWVzID0gZnVuY3Rpb24gZ2V0VmVydGljaWVzKCl7XG4gICAgcmV0dXJuIHRoaXMudmVydGljaWVzO1xufTtcblxuLyoqXG4gKiBEZXRlcm1pbmVzIHdoZXRoZXIgYSBUYXJnZXQgd2FzIGRlcGxveWVkIHRvIGEgcGFydGljdWxhciBjb250YWluZXJcbiAqXG4gKiBAbWV0aG9kIF9pc1dpdGhpblxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSB0aGUgaWQgb2YgdGhlIENvbnRhaW5lcidzIEVudGl0eVxuICogQHJldHVybiB7Qm9vbGVhbn0gd2hldGhlciBvciBub3cgdGhlIFRhcmdldCB3YXMgZGVwbG95ZWQgdG8gdGhpcyBwYXJ0aWN1bGFyIENvbnRhaW5lclxuICovXG5UYXJnZXQucHJvdG90eXBlLl9pc1dpdGhpbiA9IGZ1bmN0aW9uIF9pc1dpdGhpbihjb250YWluZXIpIHtcbiAgICByZXR1cm4gdGhpcy5jb250YWluZXJzW2NvbnRhaW5lci5faWRdO1xufTtcblxuLyoqXG4gKiBNYXJrIGEgQ29udGFpbmVyIGFzIGhhdmluZyBhIGRlcGxveWVkIGluc3RhbmNlIG9mIHRoZSBUYXJnZXRcbiAqXG4gKiBAbWV0aG9kIF9hZGRUb0NvbnRhaW5lclxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSB0aGUgaWQgb2YgdGhlIENvbnRhaW5lcidzIEVudGl0eVxuICogQHJldHVybiB7Qm9vbGVhbn0gc3RhdXMgb2YgdGhlIGFkZGl0aW9uXG4gKi9cblRhcmdldC5wcm90b3R5cGUuX2FkZFRvQ29udGFpbmVyID0gZnVuY3Rpb24gX2FkZFRvQ29udGFpbmVyKGNvbnRhaW5lcikge1xuICAgIHRoaXMuY29udGFpbmVyc1tjb250YWluZXIuX2lkXSA9IHRydWU7XG4gICAgcmV0dXJuIHRydWU7XG59O1xuXG4vKipcbiAqIFVubWFyayBhIENvbnRhaW5lciBhcyBoYXZpbmcgYSBkZXBsb3llZCBpbnN0YW5jZSBvZiB0aGUgVGFyZ2V0XG4gKlxuICogQG1ldGhvZCBfcmVtb3ZlRnJvbUNvbnRhaW5lclxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSB0aGUgaWQgb2YgdGhlIENvbnRhaW5lcidzIEVudGl0eVxuICogQHJldHVybiB7Qm9vbGVhbn0gc3RhdXMgb2YgdGhlIHJlbW92YWxcbiAqL1xuVGFyZ2V0LnByb3RvdHlwZS5fcmVtb3ZlRnJvbUNvbnRhaW5lciA9IGZ1bmN0aW9uIF9yZW1vdmVGcm9tQ29udGFpbmVyKGNvbnRhaW5lcikge1xuICAgIHRoaXMuY29udGFpbmVyc1tjb250YWluZXIuX2lkXSA9IGZhbHNlO1xuICAgIHJldHVybiB0cnVlO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBUYXJnZXQ7XG4iLCIvKiBUaGlzIFNvdXJjZSBDb2RlIEZvcm0gaXMgc3ViamVjdCB0byB0aGUgdGVybXMgb2YgdGhlIE1vemlsbGEgUHVibGljXG4gKiBMaWNlbnNlLCB2LiAyLjAuIElmIGEgY29weSBvZiB0aGUgTVBMIHdhcyBub3QgZGlzdHJpYnV0ZWQgd2l0aCB0aGlzXG4gKiBmaWxlLCBZb3UgY2FuIG9idGFpbiBvbmUgYXQgaHR0cDovL21vemlsbGEub3JnL01QTC8yLjAvLlxuICpcbiAqIE93bmVyczogZGFuQGZhbW8udXNcbiAqICAgICAgICAgZmVsaXhAZmFtby51c1xuICogICAgICAgICBtaWtlQGZhbW8udXNcbiAqIEBsaWNlbnNlIE1QTCAyLjBcbiAqIEBjb3B5cmlnaHQgRmFtb3VzIEluZHVzdHJpZXMsIEluYy4gMjAxNFxuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIEV2ZW50RW1pdHRlciA9IHJlcXVpcmUoJy4uLy4uL2V2ZW50cy9FdmVudEVtaXR0ZXInKTtcblxuLy8gQ09OU1RTXG52YXIgSURFTlRJVFkgPSBuZXcgRmxvYXQzMkFycmF5KFsxLCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxXSk7XG5cbi8vIEZ1bmN0aW9ucyB0byBiZSBydW4gd2hlbiBhbiBpbmRleCBpcyBtYXJrZWQgYXMgaW52YWxpZGF0ZWRcbnZhciBWQUxJREFUT1JTID0gW1xuICAgIGZ1bmN0aW9uIHZhbGlkYXRlMChwYXJlbnQsIHZlY3RvcnMsIG1lbW9yeSkge1xuICAgICAgICByZXR1cm4gcGFyZW50WzBdICogKG1lbW9yeVsyXSAqIG1lbW9yeVs0XSkgKiB2ZWN0b3JzLnNjYWxlWzBdICsgcGFyZW50WzRdICogKG1lbW9yeVswXSAqIG1lbW9yeVs1XSArIG1lbW9yeVsxXSAqIG1lbW9yeVszXSAqIG1lbW9yeVs0XSkgKiB2ZWN0b3JzLnNjYWxlWzBdICsgcGFyZW50WzhdICogKG1lbW9yeVsxXSAqIG1lbW9yeVs1XSAtIG1lbW9yeVswXSAqIG1lbW9yeVszXSAqIG1lbW9yeVs0XSkgKiB2ZWN0b3JzLnNjYWxlWzBdO1xuICAgIH0sXG4gICAgZnVuY3Rpb24gdmFsaWRhdGUxKHBhcmVudCwgdmVjdG9ycywgbWVtb3J5KSB7XG4gICAgICAgIHJldHVybiBwYXJlbnRbMV0gKiAobWVtb3J5WzJdICogbWVtb3J5WzRdKSAqIHZlY3RvcnMuc2NhbGVbMF0gKyBwYXJlbnRbNV0gKiAobWVtb3J5WzBdICogbWVtb3J5WzVdICsgbWVtb3J5WzFdICogbWVtb3J5WzNdICogbWVtb3J5WzRdKSAqIHZlY3RvcnMuc2NhbGVbMF0gKyBwYXJlbnRbOV0gKiAobWVtb3J5WzFdICogbWVtb3J5WzVdIC0gbWVtb3J5WzBdICogbWVtb3J5WzNdICogbWVtb3J5WzRdKSAqIHZlY3RvcnMuc2NhbGVbMF07XG4gICAgfSxcbiAgICBmdW5jdGlvbiB2YWxpZGF0ZTIocGFyZW50LCB2ZWN0b3JzLCBtZW1vcnkpIHtcbiAgICAgICAgcmV0dXJuIHBhcmVudFsyXSAqIChtZW1vcnlbMl0gKiBtZW1vcnlbNF0pICogdmVjdG9ycy5zY2FsZVswXSArIHBhcmVudFs2XSAqIChtZW1vcnlbMF0gKiBtZW1vcnlbNV0gKyBtZW1vcnlbMV0gKiBtZW1vcnlbM10gKiBtZW1vcnlbNF0pICogdmVjdG9ycy5zY2FsZVswXSArIHBhcmVudFsxMF0gKiAobWVtb3J5WzFdICogbWVtb3J5WzVdIC0gbWVtb3J5WzBdICogbWVtb3J5WzNdICogbWVtb3J5WzRdKSAqIHZlY3RvcnMuc2NhbGVbMF07XG4gICAgfSxcbiAgICBmdW5jdGlvbiB2YWxpZGF0ZTMocGFyZW50LCB2ZWN0b3JzLCBtZW1vcnkpIHtcbiAgICAgICAgcmV0dXJuIHBhcmVudFszXSAqIChtZW1vcnlbMl0gKiBtZW1vcnlbNF0pICogdmVjdG9ycy5zY2FsZVswXSArIHBhcmVudFs3XSAqIChtZW1vcnlbMF0gKiBtZW1vcnlbNV0gKyBtZW1vcnlbMV0gKiBtZW1vcnlbM10gKiBtZW1vcnlbNF0pICogdmVjdG9ycy5zY2FsZVswXSArIHBhcmVudFsxMV0gKiAobWVtb3J5WzFdICogbWVtb3J5WzVdIC0gbWVtb3J5WzBdICogbWVtb3J5WzNdICogbWVtb3J5WzRdKSAqIHZlY3RvcnMuc2NhbGVbMF07XG4gICAgfSxcbiAgICBmdW5jdGlvbiB2YWxpZGF0ZTQocGFyZW50LCB2ZWN0b3JzLCBtZW1vcnkpIHtcbiAgICAgICAgcmV0dXJuIHBhcmVudFswXSAqICgtbWVtb3J5WzJdICogbWVtb3J5WzVdKSAqIHZlY3RvcnMuc2NhbGVbMV0gKyBwYXJlbnRbNF0gKiAobWVtb3J5WzBdICogbWVtb3J5WzRdIC0gbWVtb3J5WzFdICogbWVtb3J5WzNdICogbWVtb3J5WzVdKSAqIHZlY3RvcnMuc2NhbGVbMV0gKyBwYXJlbnRbOF0gKiAobWVtb3J5WzFdICogbWVtb3J5WzRdICsgbWVtb3J5WzBdICogbWVtb3J5WzNdICogbWVtb3J5WzVdKSAqIHZlY3RvcnMuc2NhbGVbMV07XG4gICAgfSxcbiAgICBmdW5jdGlvbiB2YWxpZGF0ZTUocGFyZW50LCB2ZWN0b3JzLCBtZW1vcnkpIHtcbiAgICAgICAgcmV0dXJuIHBhcmVudFsxXSAqICgtbWVtb3J5WzJdICogbWVtb3J5WzVdKSAqIHZlY3RvcnMuc2NhbGVbMV0gKyBwYXJlbnRbNV0gKiAobWVtb3J5WzBdICogbWVtb3J5WzRdIC0gbWVtb3J5WzFdICogbWVtb3J5WzNdICogbWVtb3J5WzVdKSAqIHZlY3RvcnMuc2NhbGVbMV0gKyBwYXJlbnRbOV0gKiAobWVtb3J5WzFdICogbWVtb3J5WzRdICsgbWVtb3J5WzBdICogbWVtb3J5WzNdICogbWVtb3J5WzVdKSAqIHZlY3RvcnMuc2NhbGVbMV07XG4gICAgfSxcbiAgICBmdW5jdGlvbiB2YWxpZGF0ZTYocGFyZW50LCB2ZWN0b3JzLCBtZW1vcnkpIHtcbiAgICAgICAgcmV0dXJuIHBhcmVudFsyXSAqICgtbWVtb3J5WzJdICogbWVtb3J5WzVdKSAqIHZlY3RvcnMuc2NhbGVbMV0gKyBwYXJlbnRbNl0gKiAobWVtb3J5WzBdICogbWVtb3J5WzRdIC0gbWVtb3J5WzFdICogbWVtb3J5WzNdICogbWVtb3J5WzVdKSAqIHZlY3RvcnMuc2NhbGVbMV0gKyBwYXJlbnRbMTBdICogKG1lbW9yeVsxXSAqIG1lbW9yeVs0XSArIG1lbW9yeVswXSAqIG1lbW9yeVszXSAqIG1lbW9yeVs1XSkgKiB2ZWN0b3JzLnNjYWxlWzFdO1xuICAgIH0sXG4gICAgZnVuY3Rpb24gdmFsaWRhdGU3KHBhcmVudCwgdmVjdG9ycywgbWVtb3J5KSB7XG4gICAgICAgIHJldHVybiBwYXJlbnRbM10gKiAoLW1lbW9yeVsyXSAqIG1lbW9yeVs1XSkgKiB2ZWN0b3JzLnNjYWxlWzFdICsgcGFyZW50WzddICogKG1lbW9yeVswXSAqIG1lbW9yeVs0XSAtIG1lbW9yeVsxXSAqIG1lbW9yeVszXSAqIG1lbW9yeVs1XSkgKiB2ZWN0b3JzLnNjYWxlWzFdICsgcGFyZW50WzExXSAqIChtZW1vcnlbMV0gKiBtZW1vcnlbNF0gKyBtZW1vcnlbMF0gKiBtZW1vcnlbM10gKiBtZW1vcnlbNV0pICogdmVjdG9ycy5zY2FsZVsxXTtcbiAgICB9LFxuICAgIGZ1bmN0aW9uIHZhbGlkYXRlOChwYXJlbnQsIHZlY3RvcnMsIG1lbW9yeSkge1xuICAgICAgICByZXR1cm4gcGFyZW50WzBdICogKG1lbW9yeVszXSkgKiB2ZWN0b3JzLnNjYWxlWzJdICsgcGFyZW50WzRdICogKC1tZW1vcnlbMV0gKiBtZW1vcnlbMl0pICogdmVjdG9ycy5zY2FsZVsyXSArIHBhcmVudFs4XSAqIChtZW1vcnlbMF0gKiBtZW1vcnlbMl0pICogdmVjdG9ycy5zY2FsZVsyXTtcbiAgICB9LFxuICAgIGZ1bmN0aW9uIHZhbGlkYXRlOShwYXJlbnQsIHZlY3RvcnMsIG1lbW9yeSkge1xuICAgICAgICByZXR1cm4gcGFyZW50WzFdICogKG1lbW9yeVszXSkgKiB2ZWN0b3JzLnNjYWxlWzJdICsgcGFyZW50WzVdICogKC1tZW1vcnlbMV0gKiBtZW1vcnlbMl0pICogdmVjdG9ycy5zY2FsZVsyXSArIHBhcmVudFs5XSAqIChtZW1vcnlbMF0gKiBtZW1vcnlbMl0pICogdmVjdG9ycy5zY2FsZVsyXTtcbiAgICB9LFxuICAgIGZ1bmN0aW9uIHZhbGlkYXRlMTAocGFyZW50LCB2ZWN0b3JzLCBtZW1vcnkpIHtcbiAgICAgICAgcmV0dXJuIHBhcmVudFsyXSAqIChtZW1vcnlbM10pICogdmVjdG9ycy5zY2FsZVsyXSArIHBhcmVudFs2XSAqICgtbWVtb3J5WzFdICogbWVtb3J5WzJdKSAqIHZlY3RvcnMuc2NhbGVbMl0gKyBwYXJlbnRbMTBdICogKG1lbW9yeVswXSAqIG1lbW9yeVsyXSkgKiB2ZWN0b3JzLnNjYWxlWzJdO1xuICAgIH0sXG4gICAgZnVuY3Rpb24gdmFsaWRhdGUxMShwYXJlbnQsIHZlY3RvcnMsIG1lbW9yeSkge1xuICAgICAgICByZXR1cm4gcGFyZW50WzNdICogKG1lbW9yeVszXSkgKiB2ZWN0b3JzLnNjYWxlWzJdICsgcGFyZW50WzddICogKC1tZW1vcnlbMV0gKiBtZW1vcnlbMl0pICogdmVjdG9ycy5zY2FsZVsyXSArIHBhcmVudFsxMV0gKiAobWVtb3J5WzBdICogbWVtb3J5WzJdKSAqIHZlY3RvcnMuc2NhbGVbMl07XG4gICAgfSxcbiAgICBmdW5jdGlvbiB2YWxpZGF0ZTEyKHBhcmVudCwgdmVjdG9ycywgbWVtb3J5KSB7XG4gICAgICAgIHJldHVybiBwYXJlbnRbMF0gKiB2ZWN0b3JzLnRyYW5zbGF0aW9uWzBdICsgcGFyZW50WzRdICogdmVjdG9ycy50cmFuc2xhdGlvblsxXSArIHBhcmVudFs4XSAqIHZlY3RvcnMudHJhbnNsYXRpb25bMl0gKyBwYXJlbnRbMTJdO1xuICAgIH0sXG4gICAgZnVuY3Rpb24gdmFsaWRhdGUxMyhwYXJlbnQsIHZlY3RvcnMsIG1lbW9yeSkge1xuICAgICAgICByZXR1cm4gcGFyZW50WzFdICogdmVjdG9ycy50cmFuc2xhdGlvblswXSArIHBhcmVudFs1XSAqIHZlY3RvcnMudHJhbnNsYXRpb25bMV0gKyBwYXJlbnRbOV0gKiB2ZWN0b3JzLnRyYW5zbGF0aW9uWzJdICsgcGFyZW50WzEzXTtcbiAgICB9LFxuICAgIGZ1bmN0aW9uIHZhbGlkYXRlMTQocGFyZW50LCB2ZWN0b3JzLCBtZW1vcnkpIHtcbiAgICAgICAgcmV0dXJuIHBhcmVudFsyXSAqIHZlY3RvcnMudHJhbnNsYXRpb25bMF0gKyBwYXJlbnRbNl0gKiB2ZWN0b3JzLnRyYW5zbGF0aW9uWzFdICsgcGFyZW50WzEwXSAqIHZlY3RvcnMudHJhbnNsYXRpb25bMl0gKyBwYXJlbnRbMTRdO1xuICAgIH0sXG4gICAgZnVuY3Rpb24gdmFsaWRhdGUxNShwYXJlbnQsIHZlY3RvcnMsIG1lbW9yeSkge1xuICAgICAgICByZXR1cm4gcGFyZW50WzNdICogdmVjdG9ycy50cmFuc2xhdGlvblswXSArIHBhcmVudFs3XSAqIHZlY3RvcnMudHJhbnNsYXRpb25bMV0gKyBwYXJlbnRbMTFdICogdmVjdG9ycy50cmFuc2xhdGlvblsyXSArIHBhcmVudFsxNV07XG4gICAgfVxuXTtcblxuLy8gTWFwIG9mIGludmFsaWRhdGlvbiBudW1iZXJzXG52YXIgREVQRU5ERU5UUyA9IHtcbiAgICBnbG9iYWwgOiBbNDM2OSw4NzM4LDE3NDc2LDM0OTUyLDQzNjksODczOCwxNzQ3NiwzNDk1Miw0MzY5LDg3MzgsMTc0NzYsMzQ5NTIsNDA5Niw4MTkyLDE2Mzg0LDMyNzY4XSxcbiAgICBsb2NhbCAgOiB7XG4gICAgICAgIHRyYW5zbGF0aW9uIDogWzYxNDQwLDYxNDQwLDYxNDQwXSxcbiAgICAgICAgcm90YXRpb24gICAgOiBbNDA5NSw0MDk1LDI1NV0sXG4gICAgICAgIHNjYWxlICAgICAgIDogWzQwOTUsNDA5NSw0MDk1XSxcbiAgICB9XG59O1xuXG4vKipcbiAqIFRyYW5zZm9ybSBpcyBhIGNvbXBvbmVudCB0aGF0IGlzIHBhcnQgb2YgZXZlcnkgRW50aXR5LiAgSXQgaXNcbiAqICAgcmVzcG9uc2libGUgZm9yIHVwZGF0aW5nIGl0J3Mgb3duIG5vdGlvbiBvZiBwb3NpdGlvbiBpbiBzcGFjZSBhbmRcbiAqICAgaW5jb3Jwb3JhdGluZyB0aGF0IHdpdGggcGFyZW50IGluZm9ybWF0aW9uLlxuICpcbiAqIEBjbGFzcyBUcmFuc2Zvcm1cbiAqIEBjb21wb25lbnRcbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBUcmFuc2Zvcm0oKSB7XG4gICAgdGhpcy5fbWF0cml4ICAgPSBuZXcgRmxvYXQzMkFycmF5KFsxLCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxXSk7XG4gICAgdGhpcy5fbWVtb3J5ICAgPSBuZXcgRmxvYXQzMkFycmF5KFsxLCAwLCAxLCAwLCAxLCAwXSk7XG4gICAgdGhpcy5fdmVjdG9ycyAgPSB7XG4gICAgICAgIHRyYW5zbGF0aW9uIDogbmV3IEZsb2F0MzJBcnJheShbMCwgMCwgMF0pLFxuICAgICAgICByb3RhdGlvbiAgICA6IG5ldyBGbG9hdDMyQXJyYXkoWzAsIDAsIDBdKSxcbiAgICAgICAgc2NhbGUgICAgICAgOiBuZXcgRmxvYXQzMkFycmF5KFsxLCAxLCAxXSlcbiAgICB9O1xuICAgIHRoaXMuX0lPICAgICAgID0gbmV3IEV2ZW50RW1pdHRlcigpO1xuICAgIHRoaXMuX3VwZGF0ZUZOID0gbnVsbDtcbiAgICB0aGlzLl9tdXRhdG9yICA9IHtcbiAgICAgICAgdHJhbnNsYXRlICAgICAgOiB0aGlzLnRyYW5zbGF0ZS5iaW5kKHRoaXMpLFxuICAgICAgICByb3RhdGUgICAgICAgICA6IHRoaXMucm90YXRlLmJpbmQodGhpcyksXG4gICAgICAgIHNjYWxlICAgICAgICAgIDogdGhpcy5zY2FsZS5iaW5kKHRoaXMpLFxuICAgICAgICBzZXRUcmFuc2xhdGlvbiA6IHRoaXMuc2V0VHJhbnNsYXRpb24uYmluZCh0aGlzKSxcbiAgICAgICAgc2V0Um90YXRpb24gICAgOiB0aGlzLnNldFJvdGF0aW9uLmJpbmQodGhpcyksXG4gICAgICAgIHNldFNjYWxlICAgICAgIDogdGhpcy5zZXRTY2FsZS5iaW5kKHRoaXMpXG4gICAgfTtcbiAgICB0aGlzLl9pbnZhbGlkYXRlZCA9IDA7XG59XG5cbi8qKlxuICogUmV0dXJuIHRoZSB0cmFuc2Zvcm0gbWF0cml4IHRoYXQgcmVwcmVzZW50cyB0aGlzIFRyYW5zZm9ybSdzIHZhbHVlcyBcbiAqICAgYmVpbmcgYXBwbGllZCB0byBpdCdzIHBhcmVudCdzIGdsb2JhbCB0cmFuc2Zvcm0uXG4gKlxuICogQG1ldGhvZCBnZXRHbG9iYWxNYXRyaXhcbiAqIFxuICogQHJldHVybiB7RmxvYXQzMiBBcnJheX0gcmVwcmVzZW50YXRpb24gb2YgdGhpcyBUcmFuc2Zvcm0gYmVpbmcgYXBwbGllZCB0byBpdCdzIHBhcmVudFxuICovXG5UcmFuc2Zvcm0ucHJvdG90eXBlLmdldEdsb2JhbE1hdHJpeCA9IGZ1bmN0aW9uIGdldEdsb2JhbE1hdHJpeCgpIHtcbiAgICByZXR1cm4gdGhpcy5fbWF0cml4O1xufTtcblxuLyoqXG4gKiBSZXR1cm4gdGhlIHZlY3Rvcml6ZWQgaW5mb3JtYXRpb24gZm9yIHRoaXMgVHJhbnNmb3JtJ3MgbG9jYWxcbiAqICAgdHJhbnNmb3JtLlxuICpcbiAqIEBtZXRob2QgZ2V0TG9jYWxWZWN0b3JzXG4gKiBcbiAqIEByZXR1cm4ge09iamVjdH0gb2JqZWN0IHdpdGggdHJhbnNsYXRlLCByb3RhdGUsIGFuZCBzY2FsZSBrZXlzXG4gKi9cblRyYW5zZm9ybS5wcm90b3R5cGUuZ2V0TG9jYWxWZWN0b3JzID0gZnVuY3Rpb24gZ2V0VmVjdG9ycygpIHtcbiAgICByZXR1cm4gdGhpcy5fdmVjdG9ycztcbn07XG5cbi8qKlxuICogRGVmaW5lIHRoZSBwcm92aWRlciBvZiBzdGF0ZSBmb3IgdGhlIFRyYW5zZm9ybS5cbiAqXG4gKiBAbWV0aG9kIHVwZGF0ZUZyb21cbiAqIEBjaGFpbmFibGVcbiAqIFxuICogQHBhcmFtICB7RnVuY3Rpb259IHByb3ZpZGVyIHNvdXJjZSBvZiBzdGF0ZSBmb3IgdGhlIFRyYW5zZm9ybVxuICovXG5UcmFuc2Zvcm0ucHJvdG90eXBlLnVwZGF0ZUZyb20gPSBmdW5jdGlvbiB1cGRhdGVGcm9tKHByb3ZpZGVyKSB7XG4gICAgaWYgKHByb3ZpZGVyIGluc3RhbmNlb2YgRnVuY3Rpb24gfHwgIXByb3ZpZGVyKSB0aGlzLl91cGRhdGVGTiA9IHByb3ZpZGVyO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBVcGRhdGVzIHRoZSBsb2NhbCBpbnZhbGlkYXRpb24gc2NoZW1lIGJhc2VkIG9uIHBhcmVudCBpbmZvcm1hdGlvblxuICpcbiAqIEBtZXRob2QgX2ludmFsaWRhdGVGcm9tUGFyZW50XG4gKiBAcHJpdmF0ZVxuICogXG4gKiBAcGFyYW0gIHtOdW1iZXJ9IHBhcmVudFJlcG9ydCBwYXJlbnQncyBpbnZhbGlkYXRpb25cbiAqL1xuZnVuY3Rpb24gX2ludmFsaWRhdGVGcm9tUGFyZW50KHBhcmVudFJlcG9ydCkge1xuICAgIHZhciBjb3VudGVyID0gMDtcbiAgICB3aGlsZSAocGFyZW50UmVwb3J0KSB7XG4gICAgICAgIGlmIChwYXJlbnRSZXBvcnQgJiAxKSB0aGlzLl9pbnZhbGlkYXRlZCB8PSBERVBFTkRFTlRTLmdsb2JhbFtjb3VudGVyXTtcbiAgICAgICAgY291bnRlcisrO1xuICAgICAgICBwYXJlbnRSZXBvcnQgPj4+PSAxO1xuICAgIH1cbn1cblxuLyoqXG4gKiBVcGRhdGUgdGhlIGdsb2JhbCBtYXRyaXggYmFzZWQgb24gbG9jYWwgYW5kIHBhcmVudCBpbnZhbGlkYXRpb25zLlxuICpcbiAqIEBtZXRob2QgIF91cGRhdGVcbiAqIEBwcml2YXRlXG4gKiBcbiAqIEBwYXJhbSAge051bWJlcn0gcGFyZW50UmVwb3J0IGludmFsaWRhdGlvbnMgYXNzb2NpYXRlZCB3aXRoIHRoZSBwYXJlbnQgbWF0cml4XG4gKiBAcGFyYW0gIHtBcnJheX0gcGFyZW50TWF0cml4IHBhcmVudCB0cmFuc2Zvcm0gbWF0cml4IGFzIGFuIEFycmF5XG4gKiBAcmV0dXJuIHtOdW1iZXJ9IGludmFsaWRhdGlvbiBzY2hlbWVcbiAqL1xuVHJhbnNmb3JtLnByb3RvdHlwZS5fdXBkYXRlID0gZnVuY3Rpb24gX3VwZGF0ZShwYXJlbnRSZXBvcnQsIHBhcmVudE1hdHJpeCkge1xuICAgIGlmIChwYXJlbnRSZXBvcnQpICBfaW52YWxpZGF0ZUZyb21QYXJlbnQuY2FsbCh0aGlzLCBwYXJlbnRSZXBvcnQpO1xuICAgIGlmICghcGFyZW50TWF0cml4KSBwYXJlbnRNYXRyaXggPSBJREVOVElUWTtcbiAgICBpZiAodGhpcy5fdXBkYXRlRk4pIHRoaXMuX3VwZGF0ZUZOKHRoaXMuX211dGF0b3IpO1xuICAgIHZhciB1cGRhdGU7XG4gICAgdmFyIGNvdW50ZXIgICAgID0gMDtcbiAgICB2YXIgaW52YWxpZGF0ZWQgPSB0aGlzLl9pbnZhbGlkYXRlZDtcblxuICAgIC8vIEJhc2VkIG9uIGludmFsaWRhdGlvbnMgdXBkYXRlIG9ubHkgdGhlIG5lZWRlZCBpbmRpY2llc1xuICAgIHdoaWxlICh0aGlzLl9pbnZhbGlkYXRlZCkge1xuICAgICAgICBpZiAodGhpcy5faW52YWxpZGF0ZWQgJiAxKSB7XG4gICAgICAgICAgICB1cGRhdGUgPSBWQUxJREFUT1JTW2NvdW50ZXJdKHBhcmVudE1hdHJpeCwgdGhpcy5fdmVjdG9ycywgdGhpcy5fbWVtb3J5KTtcbiAgICAgICAgICAgIGlmICh1cGRhdGUgIT09IHRoaXMuX21hdHJpeFtjb3VudGVyXSlcbiAgICAgICAgICAgICAgICB0aGlzLl9tYXRyaXhbY291bnRlcl0gPSB1cGRhdGU7XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgaW52YWxpZGF0ZWQgJj0gKCgxIDw8IDE2KSAtIDEpIF4gKDEgPDwgY291bnRlcik7XG4gICAgICAgIH1cblxuICAgICAgICBjb3VudGVyKys7XG4gICAgICAgIHRoaXMuX2ludmFsaWRhdGVkID4+Pj0gMTtcbiAgICB9XG5cbiAgICBpZiAoaW52YWxpZGF0ZWQpIHRoaXMuX0lPLmVtaXQoJ2ludmFsaWRhdGVkJywgaW52YWxpZGF0ZWQpO1xuICAgIHJldHVybiBpbnZhbGlkYXRlZDtcbn07XG5cbi8qKlxuICogQWRkIGV4dHJhIHRyYW5zbGF0aW9uIHRvIHRoZSBjdXJyZW50IHZhbHVlcy4gIEludmFsaWRhdGVzXG4gKiAgIHRyYW5zbGF0aW9uIGFzIG5lZWRlZC5cbiAqXG4gKiBAbWV0aG9kIHRyYW5zbGF0ZVxuICogICBcbiAqIEBwYXJhbSAge051bWJlcn0geCB0cmFuc2xhdGlvbiBhbG9uZyB0aGUgeC1heGlzIGluIHBpeGVsc1xuICogQHBhcmFtICB7TnVtYmVyfSB5IHRyYW5zbGF0aW9uIGFsb25nIHRoZSB5LWF4aXMgaW4gcGl4ZWxzXG4gKiBAcGFyYW0gIHtOdW1iZXJ9IHogdHJhbnNsYXRpb24gYWxvbmcgdGhlIHotYXhpcyBpbiBwaXhlbHNcbiAqL1xuVHJhbnNmb3JtLnByb3RvdHlwZS50cmFuc2xhdGUgPSBmdW5jdGlvbiB0cmFuc2xhdGUoeCwgeSwgeikge1xuICAgIHZhciB0cmFuc2xhdGlvbiA9IHRoaXMuX3ZlY3RvcnMudHJhbnNsYXRpb247XG4gICAgdmFyIGRpcnR5ICAgICAgID0gZmFsc2U7XG4gICAgdmFyIHNpemU7XG5cbiAgICBpZiAoeCkge1xuICAgICAgICB0cmFuc2xhdGlvblswXSArPSB4O1xuICAgICAgICBkaXJ0eSAgICAgICAgICAgPSB0cnVlO1xuICAgIH1cblxuICAgIGlmICh5KSB7XG4gICAgICAgIHRyYW5zbGF0aW9uWzFdICs9IHk7XG4gICAgICAgIGRpcnR5ICAgICAgICAgICA9IHRydWU7XG4gICAgfVxuXG4gICAgaWYgKHopIHtcbiAgICAgICAgdHJhbnNsYXRpb25bMl0gKz0gejtcbiAgICAgICAgLy8gZGlydHkgICAgICAgICAgID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAoZGlydHkpIHRoaXMuX2ludmFsaWRhdGVkIHw9IDYxNDQwO1xufTtcblxuLyoqXG4gKiBBZGQgZXh0cmEgcm90YXRpb24gdG8gdGhlIGN1cnJlbnQgdmFsdWVzLiAgSW52YWxpZGF0ZXNcbiAqICAgcm90YXRpb24gYXMgbmVlZGVkLlxuICpcbiAqIEBtZXRob2Qgcm90YXRlXG4gKiAgIFxuICogQHBhcmFtICB7TnVtYmVyfSB4IHJvdGF0aW9uIGFib3V0IHRoZSB4LWF4aXMgaW4gcmFkaWFuc1xuICogQHBhcmFtICB7TnVtYmVyfSB5IHJvdGF0aW9uIGFib3V0IHRoZSB5LWF4aXMgaW4gcmFkaWFuc1xuICogQHBhcmFtICB7TnVtYmVyfSB6IHJvdGF0aW9uIGFib3V0IHRoZSB6LWF4aXMgaW4gcmFkaWFuc1xuICovXG5UcmFuc2Zvcm0ucHJvdG90eXBlLnJvdGF0ZSA9IGZ1bmN0aW9uIHJvdGF0ZSh4LCB5LCB6KSB7XG4gICAgdmFyIHJvdGF0aW9uID0gdGhpcy5fdmVjdG9ycy5yb3RhdGlvbjtcbiAgICB0aGlzLnNldFJvdGF0aW9uKCh4ID8geCA6IDApICsgcm90YXRpb25bMF0sICh5ID8geSA6IDApICsgcm90YXRpb25bMV0sICh6ID8geiA6IDApICsgcm90YXRpb25bMl0pO1xufTtcblxuLyoqXG4gKiBBZGQgZXh0cmEgc2NhbGUgdG8gdGhlIGN1cnJlbnQgdmFsdWVzLiAgSW52YWxpZGF0ZXNcbiAqICAgc2NhbGUgYXMgbmVlZGVkLlxuICpcbiAqIEBtZXRob2Qgc2NhbGVcbiAqICAgXG4gKiBAcGFyYW0gIHtOdW1iZXJ9IHggc2NhbGUgYWxvbmcgdGhlIHgtYXhpcyBhcyBhIHBlcmNlbnRcbiAqIEBwYXJhbSAge051bWJlcn0geSBzY2FsZSBhbG9uZyB0aGUgeS1heGlzIGFzIGEgcGVyY2VudFxuICogQHBhcmFtICB7TnVtYmVyfSB6IHNjYWxlIGFsb25nIHRoZSB6LWF4aXMgYXMgYSBwZXJjZW50XG4gKi9cblRyYW5zZm9ybS5wcm90b3R5cGUuc2NhbGUgPSBmdW5jdGlvbiBzY2FsZSh4LCB5LCB6KSB7XG4gICAgdmFyIHNjYWxlVmVjdG9yID0gdGhpcy5fdmVjdG9ycy5zY2FsZTtcbiAgICB2YXIgZGlydHkgICAgICAgPSBmYWxzZTtcblxuICAgIGlmICh4KSB7XG4gICAgICAgIHNjYWxlVmVjdG9yWzBdICs9IHg7XG4gICAgICAgIGRpcnR5ICAgICA9IGRpcnR5IHx8IHRydWU7XG4gICAgfVxuXG4gICAgaWYgKHkpIHtcbiAgICAgICAgc2NhbGVWZWN0b3JbMV0gKz0geTtcbiAgICAgICAgZGlydHkgICAgID0gZGlydHkgfHwgdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAoeikge1xuICAgICAgICBzY2FsZVZlY3RvclsyXSArPSB6O1xuICAgICAgICBkaXJ0eSAgICAgPSBkaXJ0eSB8fCB0cnVlO1xuICAgIH1cblxuICAgIGlmIChkaXJ0eSkgdGhpcy5faW52YWxpZGF0ZWQgfD0gNDA5NTtcbn07XG5cbi8qKlxuICogQWJzb2x1dGUgc2V0IG9mIHRoZSBUcmFuc2Zvcm0ncyB0cmFuc2xhdGlvbi4gIEludmFsaWRhdGVzXG4gKiAgIHRyYW5zbGF0aW9uIGFzIG5lZWRlZC5cbiAqXG4gKiBAbWV0aG9kIHNldFRyYW5zbGF0aW9uXG4gKiBcbiAqIEBwYXJhbSAge051bWJlcn0geCB0cmFuc2xhdGlvbiBhbG9uZyB0aGUgeC1heGlzIGluIHBpeGVsc1xuICogQHBhcmFtICB7TnVtYmVyfSB5IHRyYW5zbGF0aW9uIGFsb25nIHRoZSB5LWF4aXMgaW4gcGl4ZWxzXG4gKiBAcGFyYW0gIHtOdW1iZXJ9IHogdHJhbnNsYXRpb24gYWxvbmcgdGhlIHotYXhpcyBpbiBwaXhlbHNcbiAqL1xuVHJhbnNmb3JtLnByb3RvdHlwZS5zZXRUcmFuc2xhdGlvbiA9IGZ1bmN0aW9uIHNldFRyYW5zbGF0aW9uKHgsIHksIHopIHtcbiAgICB2YXIgdHJhbnNsYXRpb24gPSB0aGlzLl92ZWN0b3JzLnRyYW5zbGF0aW9uO1xuICAgIHZhciBkaXJ0eSAgICAgICA9IGZhbHNlO1xuICAgIHZhciBzaXplO1xuXG4gICAgaWYgKHggIT09IHRyYW5zbGF0aW9uWzBdICYmIHggIT0gbnVsbCkge1xuICAgICAgICB0cmFuc2xhdGlvblswXSA9IHg7XG4gICAgICAgIGRpcnR5ICAgICAgICAgID0gZGlydHkgfHwgdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAoeSAhPT0gdHJhbnNsYXRpb25bMV0gJiYgeSAhPSBudWxsKSB7XG4gICAgICAgIHRyYW5zbGF0aW9uWzFdID0geTtcbiAgICAgICAgZGlydHkgICAgICAgICAgPSBkaXJ0eSB8fCB0cnVlO1xuICAgIH1cblxuICAgIGlmICh6ICE9PSB0cmFuc2xhdGlvblsyXSAmJiB6ICE9IG51bGwpIHtcbiAgICAgICAgdHJhbnNsYXRpb25bMl0gPSB6O1xuICAgICAgICBkaXJ0eSAgICAgICAgICA9IGRpcnR5IHx8IHRydWU7XG4gICAgfVxuXG4gICAgaWYgKGRpcnR5KSB0aGlzLl9pbnZhbGlkYXRlZCB8PSA2MTQ0MDtcbn07XG5cbi8qKlxuICogQWJzb2x1dGUgc2V0IG9mIHRoZSBUcmFuc2Zvcm0ncyByb3RhdGlvbi4gIEludmFsaWRhdGVzXG4gKiAgIHJvdGF0aW9uIGFzIG5lZWRlZC5cbiAqXG4gKiBAbWV0aG9kIHNldFJvdGF0ZVxuICogICBcbiAqIEBwYXJhbSAge051bWJlcn0geCByb3RhdGlvbiBhYm91dCB0aGUgeC1heGlzIGluIHJhZGlhbnNcbiAqIEBwYXJhbSAge051bWJlcn0geSByb3RhdGlvbiBhYm91dCB0aGUgeS1heGlzIGluIHJhZGlhbnNcbiAqIEBwYXJhbSAge051bWJlcn0geiByb3RhdGlvbiBhYm91dCB0aGUgei1heGlzIGluIHJhZGlhbnNcbiAqL1xuVHJhbnNmb3JtLnByb3RvdHlwZS5zZXRSb3RhdGlvbiA9IGZ1bmN0aW9uIHNldFJvdGF0aW9uKHgsIHksIHopIHtcbiAgICB2YXIgcm90YXRpb24gPSB0aGlzLl92ZWN0b3JzLnJvdGF0aW9uO1xuICAgIHZhciBkaXJ0eSAgICA9IGZhbHNlO1xuXG4gICAgaWYgKHggIT09IHJvdGF0aW9uWzBdICYmIHggIT0gbnVsbCkge1xuICAgICAgICByb3RhdGlvblswXSAgICAgPSB4O1xuICAgICAgICB0aGlzLl9tZW1vcnlbMF0gPSBNYXRoLmNvcyh4KTtcbiAgICAgICAgdGhpcy5fbWVtb3J5WzFdID0gTWF0aC5zaW4oeCk7XG4gICAgICAgIGRpcnR5ICAgICAgICAgICA9IGRpcnR5IHx8IHRydWU7XG4gICAgfVxuXG4gICAgaWYgKHkgIT09IHJvdGF0aW9uWzFdICYmIHkgIT0gbnVsbCkge1xuICAgICAgICByb3RhdGlvblsxXSAgICAgPSB5O1xuICAgICAgICB0aGlzLl9tZW1vcnlbMl0gPSBNYXRoLmNvcyh5KTtcbiAgICAgICAgdGhpcy5fbWVtb3J5WzNdID0gTWF0aC5zaW4oeSk7XG4gICAgICAgIGRpcnR5ICAgICAgICAgICA9IGRpcnR5IHx8IHRydWU7XG4gICAgfVxuXG4gICAgaWYgKHogIT09IHJvdGF0aW9uWzJdICYmIHogIT0gbnVsbCkge1xuICAgICAgICByb3RhdGlvblsyXSAgICAgICAgPSB6O1xuICAgICAgICB0aGlzLl9tZW1vcnlbNF0gICAgPSBNYXRoLmNvcyh6KTtcbiAgICAgICAgdGhpcy5fbWVtb3J5WzVdICAgID0gTWF0aC5zaW4oeik7XG4gICAgICAgIHRoaXMuX2ludmFsaWRhdGVkIHw9IDI1NTtcbiAgICB9XG5cbiAgICBpZiAoZGlydHkpIHRoaXMuX2ludmFsaWRhdGVkIHw9IDQwOTU7XG59O1xuXG4vKipcbiAqIEFic29sdXRlIHNldCBvZiB0aGUgVHJhbnNmb3JtJ3Mgc2NhbGUuICBJbnZhbGlkYXRlc1xuICogICBzY2FsZSBhcyBuZWVkZWQuXG4gKlxuICogQG1ldGhvZCBzZXRTY2FsZVxuICogICBcbiAqIEBwYXJhbSAge051bWJlcn0geCBzY2FsZSBhbG9uZyB0aGUgeC1heGlzIGFzIGEgcGVyY2VudFxuICogQHBhcmFtICB7TnVtYmVyfSB5IHNjYWxlIGFsb25nIHRoZSB5LWF4aXMgYXMgYSBwZXJjZW50XG4gKiBAcGFyYW0gIHtOdW1iZXJ9IHogc2NhbGUgYWxvbmcgdGhlIHotYXhpcyBhcyBhIHBlcmNlbnRcbiAqL1xuVHJhbnNmb3JtLnByb3RvdHlwZS5zZXRTY2FsZSA9IGZ1bmN0aW9uIHNldFNjYWxlKHgsIHksIHopIHtcbiAgICB2YXIgc2NhbGUgPSB0aGlzLl92ZWN0b3JzLnNjYWxlO1xuICAgIHZhciBkaXJ0eSA9IGZhbHNlO1xuXG4gICAgaWYgKHggIT09IHNjYWxlWzBdKSB7XG4gICAgICAgIHNjYWxlWzBdID0geDtcbiAgICAgICAgZGlydHkgICAgPSBkaXJ0eSB8fCB0cnVlO1xuICAgIH1cblxuICAgIGlmICh5ICE9PSBzY2FsZVsxXSkge1xuICAgICAgICBzY2FsZVsxXSA9IHk7XG4gICAgICAgIGRpcnR5ICAgID0gZGlydHkgfHwgdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAoeiAhPT0gc2NhbGVbMl0pIHtcbiAgICAgICAgc2NhbGVbMl0gPSB6O1xuICAgICAgICBkaXJ0eSAgICA9IGRpcnR5IHx8IHRydWU7XG4gICAgfVxuXG4gICAgaWYgKGRpcnR5KSB0aGlzLl9pbnZhbGlkYXRlZCB8PSA0MDk1O1xufTtcblxuLyoqXG4gKiBSZWdpc3RlciBmdW5jdGlvbnMgdG8gYmUgY2FsbGVkIG9uIHRoZSBUcmFuc2Zvcm0ncyBldmVudHMuXG4gKlxuICogQG1ldGhvZCBvblxuICogQGNoYWluYWJsZVxuICpcbiAqL1xuVHJhbnNmb3JtLnByb3RvdHlwZS5vbiA9IGZ1bmN0aW9uIG9uKCkge1xuICAgIHRoaXMuX0lPLm9uLmFwcGx5KHRoaXMuX0lPLCBhcmd1bWVudHMpO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBUcmFuc2Zvcm07XG4iLCIvKiBUaGlzIFNvdXJjZSBDb2RlIEZvcm0gaXMgc3ViamVjdCB0byB0aGUgdGVybXMgb2YgdGhlIE1vemlsbGEgUHVibGljXG4gKiBMaWNlbnNlLCB2LiAyLjAuIElmIGEgY29weSBvZiB0aGUgTVBMIHdhcyBub3QgZGlzdHJpYnV0ZWQgd2l0aCB0aGlzXG4gKiBmaWxlLCBZb3UgY2FuIG9idGFpbiBvbmUgYXQgaHR0cDovL21vemlsbGEub3JnL01QTC8yLjAvLlxuICpcbiAqIE93bmVyczogZGFuQGZhbW8udXNcbiAqICAgICAgICAgZmVsaXhAZmFtby51c1xuICogICAgICAgICBtaWtlQGZhbW8udXNcbiAqXG4gKiBAbGljZW5zZSBNUEwgMi4wXG4gKiBAY29weXJpZ2h0IEZhbW91cyBJbmR1c3RyaWVzLCBJbmMuIDIwMTRcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBFbnRpdHkgICAgICAgICA9IHJlcXVpcmUoJy4vRW50aXR5Jyk7XG52YXIgRW50aXR5UmVnaXN0cnkgPSByZXF1aXJlKCcuL0VudGl0eVJlZ2lzdHJ5Jyk7XG52YXIgQ29udGFpbmVyICAgICAgPSByZXF1aXJlKCcuL0NvbXBvbmVudHMvQ29udGFpbmVyJyk7XG52YXIgQ2FtZXJhICAgICAgICAgPSByZXF1aXJlKCcuL0NvbXBvbmVudHMvQ2FtZXJhJyk7XG5cbi8qKlxuICogQ29udGV4dCBpcyB0aGUgZGVmaW5pdGlvbiBvZiB3b3JsZCBzcGFjZSBmb3IgdGhhdCBwYXJ0IG9mIHRoZSBzY2VuZSBncmFwaC5cbiAqICAgQSBjb250ZXh0IGNhbiBlaXRoZXIgaGF2ZSBhIENvbnRhaW5lciBvciBub3QuICBIYXZpbmcgYSBjb250YWluZXIgbWVhbnNcbiAqICAgdGhhdCBwYXJ0cyBvZiB0aGUgc2NlbmUgZ3JhcGggY2FuIGJlIGRyYXduIGluc2lkZSBvZiBpdC4gIElmIGl0IGRvZXMgbm90XG4gKiAgIGhhdmUgYSBDb250YWluZXIgdGhlbiB0aGUgQ29udGV4dCBpcyBvbmx5IHJlc3BvbnNpYmxlIGZvciBkZWZpbmluZyB3b3JsZFxuICogICBzcGFjZS4gIFRoZSBDb3JlU3lzdGVtIHdpbGwgc3RhcnQgYXQgZWFjaCBDb250ZXh0IGFuZCByZWN1cnNpdmUgZG93blxuICogICB0aHJvdWdoIHRoZWlyIGNoaWxkcmVuIHRvIHVwZGF0ZSBlYWNoIGVudGl0aXkncyBUcmFuc2Zvcm0sIFNpemUsXG4gKiAgIGFuZCBPcGFjaXR5LlxuICpcbiAqIEBjbGFzcyBDb250ZXh0XG4gKiBAZW50aXR5XG4gKiBAY29uc3RydWN0b3JcbiAqICAgXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyB0aGUgc3RhcnRpbmcgb3B0aW9ucyBmb3IgdGhlIENvbnRleHRcbiAqIEBwYXJhbSB7QXJyYXl9IG9wdGlvbnMudHJhbnNmb3JtIHRoZSBzdGFydGluZyB0cmFuc2Zvcm0gbWF0cml4XG4gKiBAcGFyYW0ge0FycmF5fSBvcHRpb25zLnNpemUgdGhlIHN0YXJ0aW5nIHNpemVcbiAqIEBwYXJhbSB7Qm9vbGVhbn0gb3B0aW9ucy5oYXNDb250YWluZXIgd2hldGhlciBvciBub3QgdGhlIENvbnRleHQgaGFzIGEgQ29udGFpbmVyXG4gKiBAcGFyYW0ge0Jvb2xlYW59IG9wdGlvbnMuaGFzQ2FtZXJhIHdoZXRoZXIgb3Igbm90IHRoZSBDb250ZXh0IGhhcyBhIENhbWVyYVxuICovXG5mdW5jdGlvbiBDb250ZXh0KG9wdGlvbnMpIHtcbiAgICBpZiAoIW9wdGlvbnMgfHwgdHlwZW9mIG9wdGlvbnMgIT09ICdvYmplY3QnIHx8ICghb3B0aW9ucy5zaXplICYmICFvcHRpb25zLnBhcmVudEVsICYmICFvcHRpb25zLmNvbnRhaW5lcikpIHRocm93IG5ldyBFcnJvcignQ29udGV4dCwgbXVzdCBiZSBjYWxsZWQgd2l0aCBhbiBvcHRpb24gaGFzaCB0aGF0IGF0IGxlYXN0IGhhcyBhIHNpemUgb3IgYSBwYXJlbnRFbCBvciBhIGNvbnRhaW5lciBwcm9wZXJ0eScpO1xuICAgIEVudGl0eS5jYWxsKHRoaXMpO1xuICAgIEVudGl0eVJlZ2lzdHJ5LnJlZ2lzdGVyKHRoaXMsICdDb250ZXh0cycpO1xuICAgIHRoaXMuX3BhcmVudEVsID0gb3B0aW9ucy5wYXJlbnRFbDtcbiAgICB0aGlzLl9zaXplICAgICA9IF9nZXRTaXplKG9wdGlvbnMpO1xuICAgIHRoaXMuX2NvbXBvbmVudHMudHJhbnNmb3JtLl91cGRhdGUoKDEgPDwgMTYpIC0gMSwgb3B0aW9ucy50cmFuc2Zvcm0pO1xuICAgIGlmIChvcHRpb25zLmhhc0NvbnRhaW5lciAhPT0gZmFsc2UpIHRoaXMuX2NvbXBvbmVudHMuY29udGFpbmVyID0gbmV3IENvbnRhaW5lcih0aGlzLCBvcHRpb25zKTtcbiAgICBpZiAob3B0aW9ucy5oYXNDYW1lcmEgICAgIT09IGZhbHNlKSB0aGlzLl9jb21wb25lbnRzLmNhbWVyYSAgICA9IG5ldyBDYW1lcmEodGhpcywgb3B0aW9ucyk7XG59XG5cbi8qKlxuICogQSBtZXRob2QgZm9yIGRldGVybWluaW5nIHdoYXQgdGhlIHNpemUgb2YgdGhlIENvbnRleHQgaXMuXG4gKiAgV2lsbCBiZSB0aGUgdXNlciBkZWZpbmVkIHNpemUgaWYgb25lIHdhcyBwcm92aWRlZCBvdGhlcndpc2UgaXRcbiAqICB3aWxsIGRlZmF1bHQgdG8gdGhlIERPTSByZXByZXNlbnRhdGlvbi4gIFxuICpcbiAqIEBtZXRob2QgX2dldFNpemVcbiAqIEBwcml2YXRlXG4gKiBcbiAqIEBwYXJhbSAge09iamVjdH0gb3B0aW9ucyBzdGFydGluZyBvcHRpb25zIGZvciB0aGUgc2l6ZXNcbiAqIEByZXR1cm4ge0FycmF5fSBzaXplIG9mIHRoZSBDb250ZXh0XG4gKi9cbmZ1bmN0aW9uIF9nZXRTaXplKG9wdGlvbnMpIHtcbiAgICBpZiAob3B0aW9ucy5zaXplKSAgICAgIHJldHVybiBvcHRpb25zLnNpemU7XG4gICAgaWYgKG9wdGlvbnMuY29udGFpbmVyKSByZXR1cm4gW29wdGlvbnMuY29udGFpbmVyLm9mZnNldFdpZHRoLCBvcHRpb25zLmNvbnRhaW5lci5vZmZzZXRIZWlnaHQsIDBdO1xuICAgIHJldHVybiBbb3B0aW9ucy5wYXJlbnRFbC5vZmZzZXRXaWR0aCwgb3B0aW9ucy5wYXJlbnRFbC5vZmZzZXRIZWlnaHQsIDBdO1xufVxuXG5Db250ZXh0LnByb3RvdHlwZSAgICAgICAgICAgICAgICAgICAgID0gT2JqZWN0LmNyZWF0ZShFbnRpdHkucHJvdG90eXBlKTtcbkNvbnRleHQucHJvdG90eXBlLmNvbnN0cnVjdG9yICAgICAgICAgPSBDb250ZXh0O1xuQ29udGV4dC5wcm90b3R5cGUudXBkYXRlICAgICAgICAgICAgICA9IG51bGw7XG5Db250ZXh0LnByb3RvdHlwZS5yZWdpc3RlckNvbXBvbmVudCAgID0gbnVsbDtcbkNvbnRleHQucHJvdG90eXBlLmRlcmVnaXN0ZXJDb21wb25lbnQgPSBudWxsO1xuQ29udGV4dC5wcm90b3R5cGUuYWRkQ29tcG9uZW50ICAgICAgICA9IG51bGw7XG5Db250ZXh0LnByb3RvdHlwZS5yZW1vdmVDb21wb25lbnQgICAgID0gbnVsbDtcblxubW9kdWxlLmV4cG9ydHMgPSBDb250ZXh0O1xuIiwiLyogVGhpcyBTb3VyY2UgQ29kZSBGb3JtIGlzIHN1YmplY3QgdG8gdGhlIHRlcm1zIG9mIHRoZSBNb3ppbGxhIFB1YmxpY1xuICogTGljZW5zZSwgdi4gMi4wLiBJZiBhIGNvcHkgb2YgdGhlIE1QTCB3YXMgbm90IGRpc3RyaWJ1dGVkIHdpdGggdGhpc1xuICogZmlsZSwgWW91IGNhbiBvYnRhaW4gb25lIGF0IGh0dHA6Ly9tb3ppbGxhLm9yZy9NUEwvMi4wLy5cbiAqXG4gKiBPd25lcnM6IGRhbkBmYW1vLnVzXG4gKiAgICAgICAgIGZlbGl4QGZhbW8udXNcbiAqICAgICAgICAgbWlrZUBmYW1vLnVzXG4gKiAgICAgICAgIFxuICogQGxpY2Vuc2UgTVBMIDIuMFxuICogQGNvcHlyaWdodCBGYW1vdXMgSW5kdXN0cmllcywgSW5jLiAyMDE0XG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgQ29yZVN5c3RlbSAgICAgPSByZXF1aXJlKCcuL1N5c3RlbXMvQ29yZVN5c3RlbScpLFxuICAgIE9wdGlvbnNNYW5hZ2VyID0gcmVxdWlyZSgnLi9PcHRpb25zTWFuYWdlcicpLFxuICAgIERPTXJlbmRlcmVyICAgID0gcmVxdWlyZSgnLi9SZW5kZXJlcnMvRE9NcmVuZGVyZXInKSxcbiAgICBHTHJlbmRlcmVyICAgICA9IHJlcXVpcmUoJy4vUmVuZGVyZXJzL1dlYkdMUmVuZGVyZXInKSxcbiAgICBSZW5kZXJTeXN0ZW0gICA9IHJlcXVpcmUoJy4vU3lzdGVtcy9SZW5kZXJTeXN0ZW0nKSxcbiAgICBCZWhhdmlvclN5c3RlbSA9IHJlcXVpcmUoJy4vU3lzdGVtcy9CZWhhdmlvclN5c3RlbScpLFxuICAgIFRpbWVTeXN0ZW0gICAgID0gcmVxdWlyZSgnLi9TeXN0ZW1zL1RpbWVTeXN0ZW0nKSxcbiAgICBMaWZ0U3lzdGVtICAgICA9IHJlcXVpcmUoJy4uL3RyYW5zaXRpb25zL0xpZnRTeXN0ZW0nKSxcbiAgICBDb250ZXh0ICAgICAgICA9IHJlcXVpcmUoJy4vQ29udGV4dCcpO1xuXG5yZXF1aXJlKCcuL1N0eWxlc2hlZXQvZmFtb3VzLmNzcycpO1xuXG52YXIgb3B0aW9ucyA9IHtcbiAgICBsb29wICAgICAgOiB0cnVlLFxuICAgIGRpcmVjdGlvbiA6IDEsXG4gICAgc3BlZWQgICAgIDogMSxcbiAgICByZW5kZXJpbmcgOiB7XG4gICAgICAgIHJlbmRlcmVyczoge1xuICAgICAgICAgICAgRE9NOiBET01yZW5kZXJlcixcbiAgICAgICAgICAgIEdMOiBHTHJlbmRlcmVyXG4gICAgICAgIH1cbiAgICB9XG59O1xuXG4vLyBUT0RPOiB3aGF0IGlzIHRoaXMgZG9pbmcgaGVyZT9cbmRvY3VtZW50Lm9udG91Y2htb3ZlID0gZnVuY3Rpb24oZXZlbnQpe1xuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG59O1xuXG4vLyBTdGF0ZVxudmFyIExPT1AgICAgICAgICAgICAgICAgID0gJ2xvb3AnLFxuICAgIFJFTkRFUklORyAgICAgICAgICAgID0gJ3JlbmRlcmluZycsXG4gICAgb3B0aW9uc01hbmFnZXIgICAgICAgPSBuZXcgT3B0aW9uc01hbmFnZXIob3B0aW9ucyksXG4gICAgc3lzdGVtcyAgICAgICAgICAgICAgPSBbUmVuZGVyU3lzdGVtLCBCZWhhdmlvclN5c3RlbSwgTGlmdFN5c3RlbSwgQ29yZVN5c3RlbSwgVGltZVN5c3RlbV0sIC8vIFdlJ3JlIGdvaW5nIGJhY2t3YXJkc1xuICAgIGN1cnJlbnRSZWxhdGl2ZUZyYW1lID0gMCxcbiAgICBjdXJyZW50QWJzb2x1dGVGcmFtZSA9IDA7XG5cbmZ1bmN0aW9uIHNldFJlbmRlcmVycyhyZW5kZXJlcnMpIHtcbiAgICBmb3IgKHZhciBrZXkgaW4gcmVuZGVyZXJzKSB7XG4gICAgICAgIFJlbmRlclN5c3RlbS5yZWdpc3RlcihrZXksIHJlbmRlcmVyc1trZXldKTtcbiAgICB9XG59XG5cbnNldFJlbmRlcmVycyhvcHRpb25zLnJlbmRlcmluZy5yZW5kZXJlcnMpO1xuXG5vcHRpb25zTWFuYWdlci5vbignY2hhbmdlJywgZnVuY3Rpb24oZGF0YSkge1xuICAgIGlmIChkYXRhLmlkID09PSBMT09QKSB7XG4gICAgICAgIGlmIChkYXRhLnZhbHVlKSB7XG4gICAgICAgICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoRW5naW5lLmxvb3ApO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmIChkYXRhLmlkID09PSBSRU5ERVJJTkcpIHtcbiAgICAgICAgc2V0UmVuZGVyZXJzKGRhdGEudmFsdWUucmVuZGVyZXJzKTtcbiAgICB9XG59KTtcblxuLyoqXG4gKiBUaGUgc2luZ2xldG9uIG9iamVjdCBpbml0aWF0ZWQgdXBvbiBwcm9jZXNzXG4gKiAgIHN0YXJ0dXAgd2hpY2ggbWFuYWdlcyBhbGwgYWN0aXZlIFN5c3RlbXMgYW5kIGFjdHMgYXMgYVxuICogICBmYWN0b3J5IGZvciBuZXcgQ29udGV4dHMvXG4gKlxuICogICBPbiBzdGF0aWMgaW5pdGlhbGl6YXRpb24sIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgaXMgY2FsbGVkIHdpdGhcbiAqICAgICB0aGUgZXZlbnQgbG9vcCBmdW5jdGlvbi5cbiAqICAgICBcbiAqIEBjbGFzcyBFbmdpbmVcbiAqIEBzaW5nbGV0b25cbiAqL1xudmFyIEVuZ2luZSA9IHt9O1xuXG4vKipcbiAqIENhbGxzIHVwZGF0ZSBvbiBlYWNoIG9mIHRoZSBjdXJyZW50bHkgcmVnaXN0ZXJlZCBzeXN0ZW1zLlxuICogXG4gKiBAbWV0aG9kIHN0ZXBcbiAqL1xuRW5naW5lLnN0ZXAgPSBmdW5jdGlvbiBzdGVwKCkge1xuICAgIGN1cnJlbnRSZWxhdGl2ZUZyYW1lICs9IG9wdGlvbnMuZGlyZWN0aW9uICogb3B0aW9ucy5zcGVlZDtcbiAgICBjdXJyZW50QWJzb2x1dGVGcmFtZSsrO1xuICAgIHZhciBpID0gc3lzdGVtcy5sZW5ndGg7XG4gICAgd2hpbGUgKGktLSkgc3lzdGVtc1tpXS51cGRhdGUoY3VycmVudFJlbGF0aXZlRnJhbWUsIGN1cnJlbnRBYnNvbHV0ZUZyYW1lKTsvLyBJIHRvbGQgeW91IHNvXG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEEgd3JhcHBlciBhcm91bmQgcmVxdWVzdEFuaW1hdGlvbkZyYW1lIHRoYXQgd2lsbCBzdGVwIFxuICogXG4gKiBAbWV0aG9kIGxvb3BcbiAqL1xuRW5naW5lLmxvb3AgPSBmdW5jdGlvbiBsb29wKCkge1xuICAgIGlmIChvcHRpb25zLmxvb3ApIHtcbiAgICAgICAgRW5naW5lLnN0ZXAoKTtcbiAgICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKEVuZ2luZS5sb29wKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG5mdW5jdGlvbiBfbG9vcEZvcih2YWx1ZSkge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgICAgICBFbmdpbmUuc3RlcCgpO1xuICAgICAgICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKF9sb29wRm9yKHZhbHVlIC0gMSkpO1xuICAgICAgICB9XG4gICAgfTtcbn1cblxuRW5naW5lLmxvb3BGb3IgPSBmdW5jdGlvbiBsb29wRm9yKHZhbHVlKSB7XG4gICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKF9sb29wRm9yKHZhbHVlKSk7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEEgd3JhcHBlciBmb3IgdGhlIFwiRE9NQ29udGVudExvYWRlZFwiIGV2ZW50LiAgV2lsbCBleGVjdXRlXG4gKiAgIGEgZ2l2ZW4gZnVuY3Rpb24gb25jZSB0aGUgRE9NIGhhdmUgYmVlbiBsb2FkZWQuXG4gKlxuICogQG1ldGhvZCByZWFkeVxuICogXG4gKiBAcGFyYW0gIHtGdW5jdGlvbn0gZm4gRnVuY3Rpb24gdG8gYmUgY2FsbGVkIGFmdGVyIERPTSBsb2FkaW5nXG4gKi9cbkVuZ2luZS5yZWFkeSA9IGZ1bmN0aW9uIHJlYWR5KGZuKSB7XG4gICAgdmFyIGxpc3RlbmVyID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCBsaXN0ZW5lcik7XG4gICAgICAgIGZuKCk7XG4gICAgfTtcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgbGlzdGVuZXIpO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBXaWxsIGNyZWF0ZSBhIGJyYW5kIG5ldyBDb250ZXh0LiAgSUYgYSBwYXJlbnQgZWxlbWVudCBpcyBub3QgcHJvdmlkZWQsXG4gKiAgIGl0IGlzIGFzc3VtZWQgdG8gYmUgdGhlIGJvZHkgb2YgdGhlIGRvY3VtZW50LlxuICpcbiAqIEBtZXRob2QgY3JlYXRlQ29udGV4dFxuICogXG4gKiBAcGFyYW0gIHtPYmplY3R9IG9wdGlvbnMgT3B0aW9ucyBmb3IgdGhlIENvbnRleHRcbiAqIEByZXR1cm4ge0NvbnRleHR9IG5ldyBDb250ZXh0IGluc3RhbmNlXG4gKi9cbkVuZ2luZS5jcmVhdGVDb250ZXh0ID0gZnVuY3Rpb24gY3JlYXRlQ29udGV4dChvcHRpb25zKSB7XG4gICAgaWYgKHR5cGVvZiBvcHRpb25zID09PSAnc3RyaW5nJykge1xuICAgICAgICB2YXIgZWxlbSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3Iob3B0aW9ucyk7XG4gICAgICAgIGlmICghKGVsZW0gaW5zdGFuY2VvZiBIVE1MRWxlbWVudCkpIHRocm93IG5ldyBFcnJvcigndGhlIHBhc3NlZCBpbiBzdHJpbmcgc2hvdWxkIGJlIGEgcXVlcnkgc2VsZWN0b3Igd2hpY2ggcmV0dXJucyBhbiBlbGVtZW50IGZyb20gdGhlIGRvbScpO1xuICAgICAgICBlbHNlICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IENvbnRleHQoe3BhcmVudEVsOiBlbGVtfSk7XG4gICAgfVxuXG4gICAgaWYgKG9wdGlvbnMgaW5zdGFuY2VvZiBIVE1MRWxlbWVudClcbiAgICAgICAgcmV0dXJuIG5ldyBDb250ZXh0KHtwYXJlbnRFbDogb3B0aW9uc30pO1xuXG4gICAgaWYgKCFvcHRpb25zKVxuICAgICAgICByZXR1cm4gbmV3IENvbnRleHQoe3BhcmVudEVsOiBkb2N1bWVudC5ib2R5fSk7IC8vIFRPRE8gaXQgc2hvdWxkIGJlIHBvc3NpYmxlIHRvIGRlbGF5IGFzc2lnbmluZyBkb2N1bWVudC5ib2R5IHVudGlsIHRoaXMgaGl0cyB0aGUgcmVuZGVyIHN0YWdlLiBUaGlzIHdvdWxkIHJlbW92ZSB0aGUgbmVlZCBmb3IgRW5naW5lLnJlYWR5XG5cbiAgICBpZiAoIW9wdGlvbnMucGFyZW50RWwgJiYgIW9wdGlvbnMuY29udGFpbmVyKVxuICAgICAgICBvcHRpb25zLnBhcmVudEVsID0gZG9jdW1lbnQuYm9keTtcblxuICAgIHJldHVybiBuZXcgQ29udGV4dChvcHRpb25zKTtcbn07XG5cbi8qKlxuICogQWRkcyBhIHN5c3RlbSB0byB0aGUgbGlzdCBvZiBzeXN0ZW1zIHRvIHVwZGF0ZSBvbiBhIHBlciBmcmFtZSBiYXNpc1xuICpcbiAqIEBtZXRob2QgYWRkU3lzdGVtXG4gKiBcbiAqIEBwYXJhbSB7U3lzdGVtfSBzeXN0ZW0gU3lzdGVtIHRvIGdldCBydW4gZXZlcnkgZnJhbWVcbiAqL1xuRW5naW5lLmFkZFN5c3RlbSA9IGZ1bmN0aW9uIGFkZFN5c3RlbShzeXN0ZW0pIHtcbiAgICBpZiAoc3lzdGVtIGluc3RhbmNlb2YgT2JqZWN0ICYmIHN5c3RlbS51cGRhdGUgaW5zdGFuY2VvZiBGdW5jdGlvbilcbiAgICAgICAgcmV0dXJuIHN5c3RlbXMuc3BsaWNlKHN5c3RlbXMuaW5kZXhPZihSZW5kZXJTeXN0ZW0pICsgMSwgMCwgc3lzdGVtKTtcbiAgICBlbHNlIHRocm93IG5ldyBFcnJvcignc3lzdGVtcyBtdXN0IGJlIGFuIG9iamVjdCB3aXRoIGFuIHVwZGF0ZSBtZXRob2QnKTtcbn07XG5cbi8qKlxuICogUmVtb3ZlcyBhIHN5c3RlbSBmcm9tIHRoZSBsaXN0IG9mIHN5c3RlbXMgdG8gdXBkYXRlIG9uIGEgcGVyIGZyYW1lIGJhc2lzXG4gKlxuICogQG1ldGhvZCByZW1vdmVTeXN0ZW1cbiAqIFxuICogQHBhcmFtIHtTeXN0ZW19IHN5c3RlbSBTeXN0ZW0gdG8gZ2V0IHJ1biBldmVyeSBmcmFtZVxuICovXG5FbmdpbmUucmVtb3ZlU3lzdGVtID0gZnVuY3Rpb24gcmVtb3ZlU3lzdGVtKHN5c3RlbSkge1xuICAgIGlmIChzeXN0ZW0gaW5zdGFuY2VvZiBPYmplY3QgJiYgc3lzdGVtLnVwZGF0ZSBpbnN0YW5jZW9mIEZ1bmN0aW9uKSB7XG4gICAgICAgIHZhciBpbmRleCA9IHN5c3RlbXMuaW5kZXhPZihzeXN0ZW0pO1xuICAgICAgICBpZiAoaW5kZXggPT09IC0xKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIHN5c3RlbXMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBlbHNlIHRocm93IG5ldyBFcnJvcignc3lzdGVtcyBtdXN0IGJlIGFuIG9iamVjdCB3aXRoIGFuIHVwZGF0ZSBtZXRob2QnKTtcbn07XG5cbi8qKlxuICogRGVsZWdhdGUgdG8gdGhlIG9wdGlvbnNNYW5hZ2VyLlxuICpcbiAqIEBtZXRob2Qgc2V0T3B0aW9uc1xuICogXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyBPcHRpb25zIHRvIHBhdGNoXG4gKi9cbkVuZ2luZS5zZXRPcHRpb25zID0gb3B0aW9uc01hbmFnZXIuc2V0T3B0aW9ucy5iaW5kKG9wdGlvbnNNYW5hZ2VyKTtcblxuLyoqXG4gKiBTZXQgdGhlIGRpcmVjdGlvbiBvZiB0aGUgZmxvdyBvZiB0aW1lLlxuICpcbiAqIEBtZXRob2Qgc2V0RGlyZWN0aW9uXG4gKiBcbiAqIEBwYXJhbSB7TnVtYmVyfSB2YWwgZGlyZWN0aW9uIGFzIC0xIG9yIDFcbiAqL1xuRW5naW5lLnNldERpcmVjdGlvbiA9IGZ1bmN0aW9uIHNldERpcmVjdGlvbih2YWwpIHtcbiAgICBpZiAodmFsICE9PSAxICYmIHZhbCAhPT0gLTEpIHRocm93IG5ldyBFcnJvcignZGlyZWN0aW9uIG11c3QgYmUgZWl0aGVyIDEgZm9yIGZvcndhcmQgb3IgLTEgZm9yIHJldmVyc2UnKTtcbiAgICBvcHRpb25zTWFuYWdlci5zZXQoJ2RpcmVjdGlvbicsIHZhbCk7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEdldCB0aGUgZGlyZWN0aW9uIG9mIHRoZSBmbG93IG9mIHRpbWUuXG4gKlxuICogQG1ldGhvZCBnZXREaXJlY3Rpb25cbiAqIFxuICogQHJldHVybiB7TnVtYmVyfSBkaXJlY3Rpb24gYXMgLTEgb3IgMVxuICovXG5FbmdpbmUuZ2V0RGlyZWN0aW9uID0gZnVuY3Rpb24gZ2V0RGlyZWN0aW9uKCkge1xuICAgIHJldHVybiBvcHRpb25zLmRpcmVjdGlvbjtcbn07XG5cbi8qKlxuICogU2V0IHRoZSBzcGVlZCBvZiB0aW1lLlxuICpcbiAqIEBtZXRob2Qgc2V0U3BlZWRcbiAqIFxuICogQHBhcmFtIHtOdW1iZXJ9IHZhbCByYXRpbyB0byBodW1hbiB0aW1lXG4gKi9cbkVuZ2luZS5zZXRTcGVlZCA9IGZ1bmN0aW9uIHNldFNwZWVkKHZhbCkge1xuICAgIGlmICh0eXBlb2YgdmFsICE9PSAnbnVtYmVyJykgdGhyb3cgbmV3IEVycm9yKCdzcGVlZCBtdXN0IGJlIGEgbnVtYmVyLCB1c2VkIGFzIGEgc2NhbGUgZmFjdG9yIGZvciB0aGUgbW92ZW1lbnQgb2YgdGltZScpO1xuICAgIG9wdGlvbnNNYW5hZ2VyLnNldCgnc3BlZWQnLCB2YWwpO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBHZXQgdGhlIHNwZWVkIG9mIHRpbWUuXG4gKlxuICogQG1ldGhvZCBnZXRTcGVlZFxuICogXG4gKiBAcmV0dXJuIHtOdW1iZXJ9IHZhbCByYXRpbyB0byBodW1hbiB0aW1lXG4gKi9cbkVuZ2luZS5nZXRTcGVlZCA9IGZ1bmN0aW9uIGdldFNwZWVkKCkge1xuICAgIHJldHVybiBvcHRpb25zLnNwZWVkO1xufTtcblxuLyoqXG4gKiBHZXQgdGhlIGN1cnJlbnQgZnJhbWVcbiAqXG4gKiBAbWV0aG9kIGdldEFic29sdXRlRnJhbWVcbiAqXG4gKiBAcmV0dXJuIHtOdW1iZXJ9IHRoZSBjdXJyZW50IGZyYW1lIG51bWJlclxuICovXG5FbmdpbmUuZ2V0QWJzb2x1dGVGcmFtZSA9IGZ1bmN0aW9uIGdldEFic29sdXRlRnJhbWUoKSB7XG4gICAgcmV0dXJuIGN1cnJlbnRBYnNvbHV0ZUZyYW1lO1xufTtcblxuLyoqXG4gKiBHZXQgdGhlIGN1cnJlbnQgZnJhbWUgdGFraW5nIGludG8gYWNjb3VudCBlbmdpbmUgc3BlZWQgYW5kIGRpcmVjdGlvblxuICpcbiAqIEBtZXRob2QgZ2V0UmVsYXRpdmVGcmFtZVxuICpcbiAqIEByZXR1cm4ge051bWJlcn0gdGhlIGN1cnJlbnQgZnJhbWUgbnVtYmVyIHRha2luZyBpbnRvIGFjY291bnQgRW5naW5lIHNwZWVkIGFuZCBkaXJlY3Rpb25cbiAqL1xuRW5naW5lLmdldFJlbGF0aXZlRnJhbWUgPSBmdW5jdGlvbiBnZXRSZWxhdGl2ZUZyYW1lKCkge1xuICAgIHJldHVybiBjdXJyZW50UmVsYXRpdmVGcmFtZTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRW5naW5lO1xuXG4vL1N0YXJ0IHRoZSBsb29wXG5FbmdpbmUucmVhZHkoRW5naW5lLmxvb3ApO1xuIiwiLyogVGhpcyBTb3VyY2UgQ29kZSBGb3JtIGlzIHN1YmplY3QgdG8gdGhlIHRlcm1zIG9mIHRoZSBNb3ppbGxhIFB1YmxpY1xuICogTGljZW5zZSwgdi4gMi4wLiBJZiBhIGNvcHkgb2YgdGhlIE1QTCB3YXMgbm90IGRpc3RyaWJ1dGVkIHdpdGggdGhpc1xuICogZmlsZSwgWW91IGNhbiBvYnRhaW4gb25lIGF0IGh0dHA6Ly9tb3ppbGxhLm9yZy9NUEwvMi4wLy5cbiAqXG4gKiBPd25lcnM6IGRhbkBmYW1vLnVzXG4gKiAgICAgICAgIGZlbGl4QGZhbW8udXNcbiAqICAgICAgICAgbWlrZUBmYW1vLnVzXG4gKiAgICAgICAgIFxuICogQGxpY2Vuc2UgTVBMIDIuMFxuICogQGNvcHlyaWdodCBGYW1vdXMgSW5kdXN0cmllcywgSW5jLiAyMDE0XG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgRW50aXR5UmVnaXN0cnkgPSByZXF1aXJlKCcuL0VudGl0eVJlZ2lzdHJ5JyksXG4gICAgVHJhbnNmb3JtICAgICAgPSByZXF1aXJlKCcuL0NvbXBvbmVudHMvVHJhbnNmb3JtJyk7XG5cbi8qKlxuICogRW50aXR5IGlzIHRoZSBjb3JlIG9mIHRoZSBGYW1vLnVzIHNjZW5lIGdyYXBoLiAgVGhlIHNjZW5lIGdyYXBoXG4gKiAgIGlzIGNvbnN0cnVjdGVkIGJ5IGFkZGluZyBFbnRpdHlzIHRvIG90aGVyIEVudGl0aWVzIHRvIGRlZmluZSBoZWlyYXJjaHkuXG4gKiAgIEVhY2ggRW50aXR5IGNvbWVzIHdpdGggYSBUcmFuc2Zvcm0gY29tcG9uZW50IHdpdGggdGhlXG4gKiAgIGFiaWxpdHkgdG8gYWRkIGluZmluaXRlIG90aGVyIGNvbXBvbmVudHMuICBJdCBhbHNvIGFjdHMgYXMgYSBmYWN0b3J5IGJ5IGNyZWF0aW5nXG4gKiAgIG5ldyBFbnRpdGllcyB0aGF0IHdpbGwgYWxyZWFkeSBiZSBjb25zaWRlcmVkIGl0J3MgY2hpbGRyZW4uXG4gKlxuICogQGNsYXNzIEVudGl0eVxuICogQGVudGl0eVxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIEVudGl0eSgpIHtcbiAgICB2YXIgaWQgPSBFbnRpdHlSZWdpc3RyeS5yZWdpc3Rlcih0aGlzLCAnQ29yZVN5c3RlbScpO1xuXG4gICAgdGhpcy5fY29tcG9uZW50cyA9IHsgdHJhbnNmb3JtIDogbmV3IFRyYW5zZm9ybSh0aGlzKSB9O1xuICAgIHRoaXMuX2JlaGF2aW9ycyA9IFtdO1xuXG4gICAgdGhpcy5fcGFyZW50ICAgPSBudWxsO1xuICAgIHRoaXMuX2NoaWxkcmVuID0gW107XG59XG5cbi8qKlxuICogQWRkcyBhIG5ldyBpbnN0YW5jZSBvZiBhIGNvbXBvbmVudCB0byB0aGUgRW50aXR5LlxuICpcbiAqIEBtZXRob2QgIHJlZ2lzdGVyQ29tcG9uZW50XG4gKiBcbiAqIEBwYXJhbSAge0Z1bmN0aW9ufSBDb25zdHJ1Y3RvciBjb25zdHJ1Y3RvciBmdW5jdGlvbiBmb3IgYSBjb21wb25lbnRcbiAqIEBwYXJhbSAge09iamVjdH0gb3B0aW9ucyBvcHRpb25zIHRvIGJlIHBhc3NlZCBpbnRvIHRoZSBjb25zdHJ1Y3RvclxuICogQHJldHVybiB7T2JqZWN0fSBpbnN0YW5jZSBvZiB0aGUgaW5zdGFudGl0YXRlZCBjb21wb25lbnRcbiAqL1xuXG5FbnRpdHkucHJvdG90eXBlLnJlZ2lzdGVyQ29tcG9uZW50ID0gZnVuY3Rpb24gcmVnaXN0ZXJDb21wb25lbnQoQ29uc3RydWN0b3IsIG9wdGlvbnMpIHtcbiAgICBpZiAoIUNvbnN0cnVjdG9yIHx8ICEoQ29uc3RydWN0b3IgaW5zdGFuY2VvZiBGdW5jdGlvbikpIHRocm93IG5ldyBFcnJvcignVGhlIGZpcnN0IGFyZ3VtZW50IHRvIC5yZWdpc3RlckNvbXBvbmVudCBtdXN0IGJlIGEgY29tcG9uZW50IENvbnN0cnVjdG9yIGZ1bmN0aW9uJyk7XG4gICAgaWYgKCFDb25zdHJ1Y3Rvci50b1N0cmluZykgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoZSBwYXNzZWQtaW4gY29tcG9uZW50IENvbnN0cnVjdG9yIG11c3QgaGF2ZSBhIFwidG9TdHJpbmdcIiBtZXRob2QuJyk7XG5cbiAgICB2YXIgY29tcG9uZW50ID0gbmV3IENvbnN0cnVjdG9yKHRoaXMsIG9wdGlvbnMpO1xuICAgIGlmIChjb21wb25lbnQudXBkYXRlKSB0aGlzLl9iZWhhdmlvcnMucHVzaChDb25zdHJ1Y3Rvci50b1N0cmluZygpKTtcbiAgICB0aGlzLl9jb21wb25lbnRzW0NvbnN0cnVjdG9yLnRvU3RyaW5nKCldID0gY29tcG9uZW50O1xuICAgIHJldHVybiBjb21wb25lbnQ7XG59O1xuXG4vKipcbiAqIEFsaWFzIGZvciByZWdpc3RlckNvbXBvbmVudFxuICogXG4gKiBAbWV0aG9kIGFkZENvbXBvbmVudFxuICovXG5FbnRpdHkucHJvdG90eXBlLmFkZENvbXBvbmVudCA9IEVudGl0eS5wcm90b3R5cGUucmVnaXN0ZXJDb21wb25lbnQ7XG5cbi8qKlxuICogUmVtb3ZlcyBhIGNvbXBvbmVudCBmcm9tIHRoZSBFbnRpdHkuXG4gKlxuICogQG1ldGhvZCBkZXJlZ2lzdGVyQ29tcG9uZW50XG4gKiBcbiAqIEBwYXJhbSAge1N0cmluZ30gdHlwZSBpZCBvZiB0aGUgY29tcG9uZW50XG4gKiBAcmV0dXJuIHtCb29sZWFufSBzdGF0dXMgb2YgdGhlIHJlbW92YWxcbiAqL1xuRW50aXR5LnByb3RvdHlwZS5kZXJlZ2lzdGVyQ29tcG9uZW50ID0gZnVuY3Rpb24gZGVyZWdpc3RlckNvbXBvbmVudCh0eXBlKSB7XG4gICAgaWYgKHR5cGVvZiB0eXBlICE9PSAnc3RyaW5nJykgdGhyb3cgbmV3IEVycm9yKCdFbnRpdHkuZGVyZWdpc3RlckNvbXBvbmVudCBtdXN0IGJlIHBhc3NlZCBhIFN0cmluZyBhcyB0aGUgZmlyc3QgcGFyYW1ldGVyJyk7XG4gICAgaWYgKHRoaXMuX2NvbXBvbmVudHNbdHlwZV0gPT09IHVuZGVmaW5lZCB8fCB0aGlzLl9jb21wb25lbnRzW3R5cGVdID09PSBudWxsKSB0aHJvdyBuZXcgRXJyb3IoJ25vIGNvbXBvbmVudCBvZiB0aGF0IHR5cGUnKTtcblxuICAgIHRoaXMuX2NvbXBvbmVudHNbdHlwZV0uY2xlYW51cCAmJiB0aGlzLl9jb21wb25lbnRzW3R5cGVdLmNsZWFudXAoKTtcbiAgICB0aGlzLl9jb21wb25lbnRzW3R5cGVdID0gbnVsbDtcblxuICAgIHZhciBiZWhhdmlvckluZGV4ID0gdGhpcy5fYmVoYXZpb3JzLmluZGV4T2YodHlwZSk7XG4gICAgaWYgKGJlaGF2aW9ySW5kZXggPiAtMSlcbiAgICAgICAgdGhpcy5fYmVoYXZpb3JzLnNwbGljZShiZWhhdmlvckluZGV4LCAxKTtcblxuICAgIHJldHVybiB0cnVlO1xufTtcblxuLyoqXG4gKiBBbGlhcyBmb3IgZGVyZWdpc3RlckNvbXBvbmVudFxuICogXG4gKiBAbWV0aG9kIHJlbW92ZUNvbXBvbmVudFxuICovXG5FbnRpdHkucHJvdG90eXBlLnJlbW92ZUNvbXBvbmVudCA9IEVudGl0eS5wcm90b3R5cGUuZGVyZWdpc3RlckNvbXBvbmVudDtcblxuLyoqXG4gKiBGaW5kIG91dCBpZiB0aGUgRW50aXR5IGhhcyBhIGNvbXBvbmVudCBvZiBhIGNlcnRhaW4gbmFtZS5cbiAqXG4gKiBAbWV0aG9kIGhhc0NvbXBvbmVudFxuICogXG4gKiBAcGFyYW0gIHtTdHJpbmd9IHR5cGUgbmFtZSBvZiB0aGUgY29tcG9uZW50XG4gKiBAcmV0dXJuIHtCb29sZWFufSBleGlzdGFuY2Ugb2YgYSBjb21wb25lbnQgYnkgdGhhdCBuYW1lXG4gKi9cbkVudGl0eS5wcm90b3R5cGUuaGFzQ29tcG9uZW50ID0gZnVuY3Rpb24gaGFzQ29tcG9uZW50KHR5cGUpIHtcbiAgICByZXR1cm4gdGhpcy5fY29tcG9uZW50c1t0eXBlXSAhPSBudWxsO1xufTtcblxuLyoqXG4gKiBHZXQgYSBjb21wb25lbnQgYnkgbmFtZVxuICpcbiAqIEBtZXRob2QgZ2V0Q29tcG9uZW50XG4gKiBcbiAqIEBwYXJhbSAge1N0cmluZ30gdHlwZSBuYW1lIG9mIHRoZSBjb21wb25lbnRcbiAqIEByZXR1cm4ge09iamVjdH0gY29tcG9uZW50IGluc3RhbmNlXG4gKi9cbkVudGl0eS5wcm90b3R5cGUuZ2V0Q29tcG9uZW50ID0gZnVuY3Rpb24gZ2V0Q29tcG9uZW50KHR5cGUpIHtcbiAgICByZXR1cm4gdGhpcy5fY29tcG9uZW50c1t0eXBlXTtcbn07XG5cbi8qKlxuICogR2V0IGFsbCBvZiB0aGUgRW50aXR5J3MgY29tcG9uZW50c1xuICpcbiAqIEBtZXRob2QgZ2V0QWxsQ29tcG9uZW50c1xuICogXG4gKiBAcmV0dXJuIHtPYmplY3R9IEhhc2ggb2YgYWxsIG9mIHRoZSBjb21wb25lbnRzIGluZGV4ZWQgYnkgbmFtZSBcbiAqL1xuRW50aXR5LnByb3RvdHlwZS5nZXRBbGxDb21wb25lbnRzID0gZnVuY3Rpb24gZ2V0QWxsQ29tcG9uZW50cygpIHtcbiAgICByZXR1cm4gdGhpcy5fY29tcG9uZW50cztcbn07XG5cbi8qKlxuICogR2V0IGFsbCBvZiB0aGUgY2hpbGQgbm9kZXMgaW4gdGhlIHNjZW5lIGdyYXBoXG4gKlxuICogQG1ldGhvZCAgZ2V0Q2hpbGRyZW5cbiAqIFxuICogQHJldHVybiB7QXJyYXl9IGNoaWxkIGVudGl0aWVzXG4gKi9cbkVudGl0eS5wcm90b3R5cGUuZ2V0Q2hpbGRyZW4gPSBmdW5jdGlvbiBnZXRDaGlsZHJlbigpIHtcbiAgICByZXR1cm4gdGhpcy5fY2hpbGRyZW47XG59O1xuXG4vKipcbiAqIEdldCB0aGUgY29udGV4dCBvZiB0aGUgbm9kZS5cbiAqXG4gKiBAbWV0aG9kIGdldENvbnRleHRcbiAqXG4gKiBAcmV0dXJuIENvbnRleHQgTm9kZVxuICovXG5FbnRpdHkucHJvdG90eXBlLmdldENvbnRleHQgPSBmdW5jdGlvbiBnZXRDb250ZXh0KCkge1xuICAgIHZhciBub2RlID0gdGhpcztcbiAgICB3aGlsZSAobm9kZS5fcGFyZW50KSBub2RlID0gbm9kZS5fcGFyZW50O1xuICAgIGlmICghbm9kZS5fc2l6ZSkgcmV0dXJuIG51bGw7XG4gICAgZWxzZSAgICAgICAgICAgICByZXR1cm4gbm9kZTtcbn07XG5cbi8qKlxuICogQWRkIGEgbmV3IEVudGl0eSBhcyBhIGNoaWxkIGFuZCByZXR1cm4gaXQuXG4gKlxuICogQG1ldGhvZCBhZGRDaGlsZFxuICpcbiAqIEByZXR1cm4ge0VudGl0eX0gY2hpbGQgRW50aXR5XG4gKi9cbkVudGl0eS5wcm90b3R5cGUuYWRkQ2hpbGQgPSBmdW5jdGlvbiBhZGRDaGlsZChlbnRpdHkpIHtcbiAgICBpZiAoZW50aXR5ICE9IG51bGwgJiYgIShlbnRpdHkgaW5zdGFuY2VvZiBFbnRpdHkpKSB0aHJvdyBuZXcgRXJyb3IoJ09ubHkgRW50aXRpZXMgY2FuIGJlIGFkZGVkIGFzIGNoaWxkcmVuIG9mIG90aGVyIGVudGl0aWVzJyk7XG4gICAgaWYgKGVudGl0eSkge1xuICAgICAgICBpZiAodGhpcy5fY2hpbGRyZW4uaW5kZXhPZihlbnRpdHkpID4gLTEpIHJldHVybiB2b2lkIDA7XG4gICAgICAgIGlmIChlbnRpdHkuX3BhcmVudCAhPSBudWxsKSBlbnRpdHkuX3BhcmVudC5kZXRhdGNoQ2hpbGQoZW50aXR5KTtcbiAgICAgICAgZW50aXR5Ll9wYXJlbnQgPSB0aGlzO1xuICAgICAgICB0aGlzLl9jaGlsZHJlbi5wdXNoKGVudGl0eSk7XG4gICAgICAgIHJldHVybiBlbnRpdHk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIG5vZGUgICAgID0gbmV3IEVudGl0eSgpO1xuICAgICAgICBub2RlLl9wYXJlbnQgPSB0aGlzO1xuICAgICAgICB0aGlzLl9jaGlsZHJlbi5wdXNoKG5vZGUpO1xuICAgICAgICByZXR1cm4gbm9kZTtcbiAgICB9XG59O1xuXG4vKipcbiAqIFJlbW92ZSBhIEVudGl0eSdzIGNoaWxkLlxuICpcbiAqIEBtZXRob2QgZGV0YXRjaENoaWxkXG4gKlxuICogQHJldHVybiB7RW50aXR5fHZvaWQgMH0gY2hpbGQgRW50aXR5IG9yIHZvaWQgMCBpZiBpdCBpcyBub3QgYSBjaGlsZFxuICovXG5FbnRpdHkucHJvdG90eXBlLmRldGF0Y2hDaGlsZCA9IGZ1bmN0aW9uIGRldGF0Y2hDaGlsZChub2RlKSB7XG4gICAgaWYgKCEobm9kZSBpbnN0YW5jZW9mIEVudGl0eSkpIHRocm93IG5ldyBFcnJvcignRW50aXR5LmRldGF0Y2hDaGlsZCBvbmx5IHRha2VzIGluIEVudGl0aWVzIGFzIHRoZSBwYXJhbWV0ZXInKTtcbiAgICB2YXIgaW5kZXggPSB0aGlzLl9jaGlsZHJlbi5pbmRleE9mKG5vZGUpO1xuICAgIGlmIChpbmRleCA+PSAwKSB7XG4gICAgICAgIHZhciBjaGlsZCAgICAgPSB0aGlzLl9jaGlsZHJlbi5zcGxpY2UoaW5kZXgsIDEpWzBdO1xuICAgICAgICBjaGlsZC5fcGFyZW50ID0gbnVsbDtcbiAgICAgICAgcmV0dXJuIGNoaWxkO1xuICAgIH0gZWxzZSByZXR1cm4gdm9pZCAwO1xufTtcblxuLyoqXG4gKiBSZW1vdmUgdGhpcyBFbnRpdHkgZnJvbSB0aGUgRW50aXR5UmVnaXN0cnlcbiAqXG4gKiBAbWV0aG9kIGNsZWFudXBcbiAqL1xuRW50aXR5LnByb3RvdHlwZS5jbGVhbnVwID0gZnVuY3Rpb24gY2xlYW51cCgpIHtcbiAgICBFbnRpdHlSZWdpc3RyeS5jbGVhbnVwKHRoaXMpO1xufTtcblxuLyoqXG4gKiBVcGRhdGUgYWxsIG9mIHRoZSBjdXN0b20gY29tcG9uZW50cyBvbiB0aGUgRW50aXR5XG4gKiBcbiAqIEBtZXRob2QgdXBkYXRlXG4gKi9cbkVudGl0eS5wcm90b3R5cGUudXBkYXRlID0gZnVuY3Rpb24gdXBkYXRlKCkge1xuICAgIHZhciBpID0gdGhpcy5fYmVoYXZpb3JzLmxlbmd0aDtcblxuICAgIHdoaWxlIChpLS0pXG4gICAgICAgIHRoaXMuX2NvbXBvbmVudHNbdGhpcy5fYmVoYXZpb3JzW2ldXS51cGRhdGUodGhpcyk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEVudGl0eTtcbiIsIi8qIFRoaXMgU291cmNlIENvZGUgRm9ybSBpcyBzdWJqZWN0IHRvIHRoZSB0ZXJtcyBvZiB0aGUgTW96aWxsYSBQdWJsaWNcbiAqIExpY2Vuc2UsIHYuIDIuMC4gSWYgYSBjb3B5IG9mIHRoZSBNUEwgd2FzIG5vdCBkaXN0cmlidXRlZCB3aXRoIHRoaXNcbiAqIGZpbGUsIFlvdSBjYW4gb2J0YWluIG9uZSBhdCBodHRwOi8vbW96aWxsYS5vcmcvTVBMLzIuMC8uXG4gKlxuICogT3duZXJzOiBkYW5AZmFtby51c1xuICogICAgICAgICBmZWxpeEBmYW1vLnVzXG4gKiAgICAgICAgIG1pa2VAZmFtby51c1xuICpcbiAqIEBsaWNlbnNlIE1QTCAyLjBcbiAqIEBjb3B5cmlnaHQgRmFtb3VzIEluZHVzdHJpZXMsIEluYy4gMjAxNFxuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIExheWVyID0gcmVxdWlyZSgnLi9MYXllcicpO1xuXG4vLyBNYXAgb2YgYW4gRW50aXR5J3MgcG9zaXRpb24gaW4gYSBsYXllclxudmFyIGVudGl0aWVzID0gW107XG5cbi8vIFN0b3JhZ2Ugb2YgRW50aXR5IGFycmF5c1xudmFyIGxheWVycyA9IHtcbiAgICBldmVyeXRoaW5nOiBuZXcgTGF5ZXIoKVxufTtcblxuLy8gUG9vbCBvZiBmcmVlIHNwYWNlcyBpbiB0aGUgZW50aXRlcyBhcnJheVxudmFyIGZyZWVkID0gW107XG5cbi8qKlxuICogQSBzaW5nbGV0b24gb2JqZWN0IHRoYXQgbWFuYWdlcyB0aGUgRW50aXR5IHJlZmVyZW5jZSBzeXN0ZW0uXG4gKiAgIEVudGl0aWVzIGNhbiBiZSBwYXJ0IG9mIG1hbnkgbGF5ZXJzIGRlcGVuZGluZyBvbiBpbXBsZW1lbnRhdGlvbi5cbiAqICAgXG4gKiBAY2xhc3MgRW50aXR5UmVnaXN0cnlcbiAqIEBzaW5nbGV0b25cbiAqL1xudmFyIEVudGl0eVJlZ2lzdHJ5ID0ge307XG5cbi8qKlxuICogQWRkcyBhIG5ldyBsYXllciBrZXkgdG8gdGhlIGxheWVycyBvYmplY3QuXG4gKlxuICogQG1ldGhvZCAgYWRkTGF5ZXJcbiAqIFxuICogQHBhcmFtIHtTdHJpbmd9IGxheWVyIG5hbWUgb2YgdGhlIGxheWVyXG4gKiBAcmV0dXJuIHtBcnJheX0gdGhlIGFycmF5IG9mIGVudGl0aWVzIGluIHRoZSBzcGVjaWZpZWQgbGF5ZXJcbiAqL1xuRW50aXR5UmVnaXN0cnkuYWRkTGF5ZXIgPSBmdW5jdGlvbiBhZGRMYXllcihsYXllcikge1xuICAgIGlmICghbGF5ZXIpICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJy5hZGRMYXllciBuZWVkcyB0byBoYXZlIGEgbGF5ZXIgc3BlY2lmaWVkJyk7XG4gICAgaWYgKHR5cGVvZiBsYXllciAhPT0gJ3N0cmluZycpIHRocm93IG5ldyBFcnJvcignLmFkZExheWVyIGNhbiBvbmx5IHRha2UgYSBzdHJpbmcgYXMgYW4gYXJndW1lbnQnKTtcbiAgICBpZiAoIWxheWVyc1tsYXllcl0pIGxheWVyc1tsYXllcl0gPSBuZXcgTGF5ZXIoKTtcbiAgICByZXR1cm4gbGF5ZXJzW2xheWVyXTtcbn07XG5cbi8qKlxuICogR2V0IHRoZSBhcnJheSBvZiBlbnRpdGllcyBpbiBhIHBhcnRpY3VsYXIgbGF5ZXIuXG4gKlxuICogQG1ldGhvZCAgZ2V0TGF5ZXJcbiAqIFxuICogQHBhcmFtIHtTdHJpbmd9IGxheWVyIG5hbWUgb2YgdGhlIGxheWVyXG4gKiBAcmV0dXJuIHtBcnJheX0gdGhlIGFycmF5IG9mIGVudGl0aWVzIGluIHRoZSBzcGVjaWZpZWQgbGF5ZXJcbiAqL1xuRW50aXR5UmVnaXN0cnkuZ2V0TGF5ZXIgPSBmdW5jdGlvbiBnZXRMYXllcihsYXllcikge1xuICAgIHJldHVybiBsYXllcnNbbGF5ZXJdO1xufTtcblxuLyoqXG4gKiBSZW1vdmVzIGEgcGFydGljdWxhciBsYXllciBmcm9tIHRoZSByZWdpc3RyeVxuICpcbiAqIEBtZXRob2QgIHJlbW92ZUxheWVyXG4gKiBcbiAqIEBwYXJhbSB7U3RyaW5nfSBsYXllciBuYW1lIG9mIHRoZSBsYXllciB0byByZW1vdmVcbiAqIEByZXR1cm4ge0FycmF5fSB0aGUgYXJyYXkgb2YgZW50aXRpZXMgaW4gdGhlIHNwZWNpZmllZCBsYXllclxuICovXG5FbnRpdHlSZWdpc3RyeS5yZW1vdmVMYXllciA9IGZ1bmN0aW9uIHJlbW92ZUxheWVyKGxheWVyKSB7XG4gICAgaWYgKCFsYXllcikgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignLnJlbW92ZUxheWVyIG5lZWRzIHRvIGhhdmUgYSBsYXllciBzcGVjaWZpZWQnKTtcbiAgICBpZiAodHlwZW9mIGxheWVyICE9PSAnc3RyaW5nJykgdGhyb3cgbmV3IEVycm9yKCcucmVtb3ZlTGF5ZXIgY2FuIG9ubHkgdGFrZSBhIHN0cmluZyBhcyBhbiBhcmd1bWVudCcpO1xuXG4gICAgdmFyIGN1cnJMYXllciA9IGxheWVyc1tsYXllcl07XG4gICAgaWYgKCFjdXJyTGF5ZXIpIHJldHVybiBmYWxzZTtcblxuICAgIHZhciBpID0gY3VyckxheWVyLmxlbmd0aDtcbiAgICB3aGlsZSAoaS0tKSBkZWxldGUgZW50aXRpZXNbY3VyckxheWVyLmdldChpKS5faWRdW2xheWVyXTtcblxuICAgIGRlbGV0ZSBsYXllcnNbbGF5ZXJdO1xuICAgIHJldHVybiBjdXJyTGF5ZXI7XG59O1xuXG4vKipcbiAqIEFkZHMgYW4gZW50aXR5IHRvIGEgcGFydGljdWxhciBsYXllci5cbiAqXG4gKiBAbWV0aG9kICByZWdpc3RlclxuICogXG4gKiBAcGFyYW0gIHtFbnRpdHl9IGluc3RhbmNlIG9mIGFuIEVudGl0eVxuICogQHBhcmFtICB7U3RyaW5nfSBsYXllciBuYW1lIG9mIHRoZSBsYXllciB0byByZWdpc3RlciB0aGUgZW50aXR5IHRvXG4gKiBAcmV0dXJuIHtOdW1iZXJ9IGlkIG9mIHRoZSBFbnRpdHlcbiAqL1xuRW50aXR5UmVnaXN0cnkucmVnaXN0ZXIgPSBmdW5jdGlvbiByZWdpc3RlcihlbnRpdHksIGxheWVyKSB7XG4gICAgdmFyIGlkTWFwO1xuICAgIGlmIChlbnRpdHkuX2lkID09IG51bGwpIHtcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGVudGl0eSwgJ19pZCcsIHtcbiAgICAgICAgICAgIHZhbHVlICAgICAgICA6IEVudGl0eVJlZ2lzdHJ5LmdldE5ld0lEKCksXG4gICAgICAgICAgICBjb25maWd1cmFibGUgOiBmYWxzZVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICB2YXIgaWQgPSBlbnRpdHkuX2lkO1xuICAgIGlmIChlbnRpdGllc1tpZF0pIHtcbiAgICAgICAgaWRNYXAgPSBlbnRpdGllc1tpZF07XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBpZE1hcCA9IHtldmVyeXRoaW5nOiBsYXllcnMuZXZlcnl0aGluZy5sZW5ndGh9O1xuICAgICAgICBsYXllcnMuZXZlcnl0aGluZy5wdXNoKGVudGl0eSk7XG4gICAgfVxuXG4gICAgaWYgKGxheWVyKSB7XG4gICAgICAgIGlmICghbGF5ZXJzW2xheWVyXSkgRW50aXR5UmVnaXN0cnkuYWRkTGF5ZXIobGF5ZXIpO1xuICAgICAgICBpZE1hcFtsYXllcl0gPSBsYXllcnNbbGF5ZXJdLmxlbmd0aDtcbiAgICAgICAgbGF5ZXJzW2xheWVyXS5wdXNoKGVudGl0eSk7XG4gICAgfVxuXG4gICAgaWYgKCFlbnRpdGllc1tpZF0pIGVudGl0aWVzW2lkXSA9IGlkTWFwO1xuICAgIHJldHVybiBpZDsgLy9UT0RPOiBETyBXRSBORUVEIFRPIFJFVFVSTiBBTllNT1JFP1xufTtcblxuLyoqXG4gKiBSZW1vdmVzIGFuIGVudGl0eSBmcm9tIGEgbGF5ZXJcbiAqXG4gKiBAbWV0aG9kICBkZXJlZ2lzdGVyXG4gKiBcbiAqIEBwYXJhbSAge0VudGl0eX0gZW50aXR5IGluc3RhbmNlIG9mIGFuIEVudGl0eVxuICogQHBhcmFtICB7U3RyaW5nfSBsYXllciBuYW1lIG9mIGxheWVyIHRvIHJlbW92ZSB0aGUgRW50aXR5IGZyb21cbiAqIEByZXR1cm4ge0Jvb2xlYW19IHN0YXR1cyBvZiB0aGUgcmVtb3ZhbFxuICovXG5FbnRpdHlSZWdpc3RyeS5kZXJlZ2lzdGVyID0gZnVuY3Rpb24gZGVyZWdpc3RlcihlbnRpdHksIGxheWVyKSB7XG4gICAgdmFyIGN1cnJlbnRFbnRpdHk7XG4gICAgdmFyIHBvc2l0aW9uID0gZW50aXRpZXNbZW50aXR5Ll9pZF1bbGF5ZXJdO1xuICAgIGlmIChwb3NpdGlvbiA9PT0gdW5kZWZpbmVkKSByZXR1cm4gZmFsc2U7XG4gICAgZW50aXRpZXNbZW50aXR5Ll9pZF1bbGF5ZXJdID0gbnVsbDtcbiAgICBsYXllcnNbbGF5ZXJdLnJlbW92ZShlbnRpdHkpO1xuXG4gICAgdmFyIGN1cnJlbnRFbnRpdHk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBlbnRpdGllcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjdXJyZW50RW50aXR5ID0gZW50aXRpZXNbaV07XG5cbiAgICAgICAgaWYgKGN1cnJlbnRFbnRpdHkgJiYgY3VycmVudEVudGl0eVtsYXllcl0gPiBwb3NpdGlvbikgY3VycmVudEVudGl0eVtsYXllcl0tLTtcbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcbn07XG5cbi8qKlxuICogR2V0IHRoZSBpZCBtYXAgb2YgdGhlIEVudGl0eS4gIEVhY2ggRW50aXR5IGhhcyBhbiBvYmplY3QgdGhhdFxuICogICBkZWZpbmVkIHRoZSBpbmRpY2llcyBvZiB3aGVyZSBpdCBpcyBpbiBlYWNoIGxheWVyLlxuICpcbiAqIEBtZXRob2QgIGdldFxuICogXG4gKiBAcGFyYW0gIHtOdW1iZXJ9IGlkIElEIG9mIHRoZSBFbnRpdHlcbiAqIEByZXR1cm4ge09iamVjdH0gaWQgbWFwIG9mIHRoZSBFbnRpdHkncyBpbmRleCBpbiBlYWNoIGxheWVyXG4gKi9cbkVudGl0eVJlZ2lzdHJ5LmdldCA9IGZ1bmN0aW9uIGdldChpZCkge1xuICAgIHJldHVybiBlbnRpdGllc1tpZF07XG59O1xuXG4vKipcbiAqIEZpbmQgb3V0IGlmIGEgZ2l2ZW4gZW50aXR5IGV4aXN0cyBhbmQgYSBzcGVjaWZpZWQgbGF5ZXIuXG4gKlxuICogQG1ldGhvZCAgaW5MYXllclxuICogXG4gKiBAcGFyYW0gIHtFbnRpdHl9IGVudGl0eSBFbnRpdHkgaW5zdGFuY2VcbiAqIEBwYXJhbSAge1N0cmluZ30gbGF5ZXIgbmFtZSBvZiB0aGUgbGF5ZXJcbiAqIEByZXR1cm4ge0Jvb2xlYW59IHdoZXRoZXIgb3Igbm90IHRoZSBFbnRpdHkgaXMgaW4gYSBnaXZlbiBsYXllclxuICovXG5FbnRpdHlSZWdpc3RyeS5pbkxheWVyID0gZnVuY3Rpb24gaW5MYXllcihlbnRpdHksIGxheWVyKSB7XG4gICAgcmV0dXJuIGVudGl0aWVzW2VudGl0eS5faWRdW2xheWVyXSAhPT0gdW5kZWZpbmVkO1xufTtcblxuLy9wb3RlbnRpYWxseSBtZW1vcnkgdW5zYWZlIC0gZ2V0dGluZyBhbiBpZCBpc24ndCBuZWNlc3NhcmlseSBjb3VwbGVkIHdpdGggYSByZWdpc3RyYXRpb25cbi8qKlxuICogR2V0IGEgdW5pcXVlIElEIGZvciBhbiBFbnRpdHlcbiAqXG4gKiBAbWV0aG9kICBnZXROZXdJRFxuICogXG4gKiBAcmV0dXJuIHtOdW1iZXJ9IElEIGZvciBhbiBFbnRpdHlcbiAqL1xuRW50aXR5UmVnaXN0cnkuZ2V0TmV3SUQgPSBmdW5jdGlvbiBnZXROZXdJRCgpIHtcbiAgICBpZihmcmVlZC5sZW5ndGgpIHJldHVybiBmcmVlZC5wb3AoKTtcbiAgICBlbHNlIHJldHVybiBlbnRpdGllcy5sZW5ndGg7XG59O1xuXG4vKipcbiAqIFJlbW92ZSBhbiBlbnRpdHkgYW5kIGFsbCByZWZlcmVuY2VzIHRvIGl0LlxuICpcbiAqIEBtZXRob2QgY2xlYW51cFxuICogXG4gKiBAcGFyYW0gIHtFbnRpdHl9IGVudGl0eSBFbnRpdHkgaW5zdGFuY2UgdG8gcmVtb3ZlXG4gKiBAcmV0dXJuIHtOdW1iZXJ9IElEIG9mIHRoZSBFbnRpdHkgdGhhdCB3YXMgcmVtb3ZlZFxuICovXG5FbnRpdHlSZWdpc3RyeS5jbGVhbnVwID0gZnVuY3Rpb24gY2xlYW51cChlbnRpdHkpIHtcbiAgICB2YXIgY3VycmVudEVudGl0eTtcbiAgICB2YXIgaWRNYXAgICAgICAgICAgICA9IGVudGl0aWVzW2VudGl0eS5faWRdO1xuICAgIGVudGl0aWVzW2VudGl0eS5faWRdID0gbnVsbDtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZW50aXRpZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY3VycmVudEVudGl0eSA9IGVudGl0aWVzW2ldO1xuXG4gICAgICAgIGlmIChjdXJyZW50RW50aXR5KVxuICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIGlkTWFwKVxuICAgICAgICAgICAgICAgIGlmIChjdXJyZW50RW50aXR5W2tleV0gJiYgY3VycmVudEVudGl0eVtrZXldID4gaWRNYXBba2V5XSlcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudEVudGl0eVtrZXldLS07XG4gICAgfVxuXG4gICAgZm9yICh2YXIga2V5IGluIGlkTWFwKSB7XG4gICAgICAgIGxheWVyc1trZXldLnNwbGljZShpZE1hcFtrZXldLCAxKTtcbiAgICB9XG5cbiAgICBmcmVlZC5wdXNoKGVudGl0eS5faWQpO1xuICAgIHJldHVybiBlbnRpdHkuX2lkOyAvL1RPRE86IERPIFdFIE5FRUQgVEhJU1xufTtcblxuLyoqXG4gKiBHZXQgYW4gRW50aXR5IGJ5IGlkXG4gKlxuICogQG1ldGhvZCBnZXRFbnRpdHlcbiAqIFxuICogQHBhcmFtICB7TnVtYmVyfSBpZCBpZCBvZiB0aGUgRW50aXR5XG4gKiBAcmV0dXJuIHtFbnRpdHl9IGVudGl0eSB3aXRoIHRoZSBpZCBwcm92aWRlZFxuICovXG5FbnRpdHlSZWdpc3RyeS5nZXRFbnRpdHkgPSBmdW5jdGlvbiBnZXRFbnRpdHkoaWQpIHtcbiAgICBpZiAoIWVudGl0aWVzW2lkXSkgcmV0dXJuIGZhbHNlO1xuICAgIHJldHVybiBsYXllcnMuZXZlcnl0aGluZy5nZXQoZW50aXRpZXNbaWRdLmV2ZXJ5dGhpbmcpO1xufTtcblxuLyoqXG4gKiBSZW1vdmUgYWxsIEVudGl0aWVzIGZyb20gdGhlIGVudGl0eSByZWdpc3RyeVxuICpcbiAqIEBtZXRob2QgY2xlYXJcbiAqL1xuRW50aXR5UmVnaXN0cnkuY2xlYXIgPSBmdW5jdGlvbiBjbGVhcigpIHtcbiAgICB2YXIgZXZlcnl0aGluZyA9IEVudGl0eVJlZ2lzdHJ5LmdldExheWVyKCdldmVyeXRoaW5nJyk7XG4gICAgd2hpbGUgKGV2ZXJ5dGhpbmcubGVuZ3RoKSBFbnRpdHlSZWdpc3RyeS5jbGVhbnVwKGV2ZXJ5dGhpbmcucG9wKCkpO1xufTtcblxuLy8gUmVnc2l0ZXIgdGhlIGRlZmF1bHQgbGF5ZXJzXG5FbnRpdHlSZWdpc3RyeS5hZGRMYXllcignUm9vdHMnKTtcbkVudGl0eVJlZ2lzdHJ5LmFkZExheWVyKCdDb3JlU3lzdGVtJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gRW50aXR5UmVnaXN0cnk7XG4iLCIvKiBUaGlzIFNvdXJjZSBDb2RlIEZvcm0gaXMgc3ViamVjdCB0byB0aGUgdGVybXMgb2YgdGhlIE1vemlsbGEgUHVibGljXG4gKiBMaWNlbnNlLCB2LiAyLjAuIElmIGEgY29weSBvZiB0aGUgTVBMIHdhcyBub3QgZGlzdHJpYnV0ZWQgd2l0aCB0aGlzXG4gKiBmaWxlLCBZb3UgY2FuIG9idGFpbiBvbmUgYXQgaHR0cDovL21vemlsbGEub3JnL01QTC8yLjAvLlxuICpcbiAqIE93bmVyczogZGFuQGZhbW8udXNcbiAqICAgICAgICAgZmVsaXhAZmFtby51c1xuICogICAgICAgICBtaWtlQGZhbW8udXNcbiAqXG4gKiBAbGljZW5zZSBNUEwgMi4wXG4gKiBAY29weXJpZ2h0IEZhbW91cyBJbmR1c3RyaWVzLCBJbmMuIDIwMTRcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBFdmVudEVtaXR0ZXIgPSByZXF1aXJlKCcuLi9ldmVudHMvRXZlbnRFbWl0dGVyJyk7XG5cbi8qKlxuICogTGF5ZXJzIGFyZSBncm91cHMgdGhhdCBob2xkIHJlZmVyZW5jZXMgdG8gRW50aXRpZXMuICBJdFxuICogIGFkZHMgZXZlbnQgZW1pdHRpbmcgYW5kIGNvbnZlbmllbmNlIG1ldGhvZHMgb24gdG9wIG9mXG4gKiAgdGhlIGFycmF5IHN0b3JhZ2UuXG4gKlxuICogQGNsYXNzIExheWVyXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gTGF5ZXIoKSB7XG4gICAgdGhpcy5lbnRpdGllcyA9IFtdO1xuICAgIHRoaXMuSU8gICAgICAgPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsICdsZW5ndGgnLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZW50aXRpZXMubGVuZ3RoO1xuICAgICAgICB9XG4gICAgfSk7XG59XG5cbi8qKlxuICogRGVsZWdhdGVzIHRvIHRoZSBFdmVudEhhbmRsZXJzIFwib25cIlxuICpcbiAqIEBtZXRob2Qgb25cbiAqL1xuTGF5ZXIucHJvdG90eXBlLm9uID0gZnVuY3Rpb24gb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuSU8ub24uYXBwbHkodGhpcy5JTywgYXJndW1lbnRzKTtcbn07XG5cbi8qKlxuICogQWRkcyBhbiBFbnRpdHkgYW5kIGVtaXRzIGEgbWVzc2FnZVxuICpcbiAqIEBtZXRob2QgcHVzaFxuICogXG4gKiBAcmVzdWx0IHtCb29sZWFufSByZXR1cm4gc3RhdHVzIG9mIGFycmF5IHB1c2hcbiAqL1xuTGF5ZXIucHJvdG90eXBlLnB1c2ggPSBmdW5jdGlvbiBwdXNoKGVudGl0eSkge1xuICAgIHRoaXMuSU8uZW1pdCgnZW50aXR5UHVzaGVkJywgZW50aXR5KTtcbiAgICByZXR1cm4gdGhpcy5lbnRpdGllcy5wdXNoKGVudGl0eSk7XG59O1xuXG4vKipcbiAqIEFkZHMgYW4gRW50aXR5IGFuZCBlbWl0cyBhIG1lc3NhZ2VcbiAqXG4gKiBAbWV0aG9kIHBvcFxuICogXG4gKiBAcmVzdWx0IHtFbnRpdHl9IGxhc3QgRW50aXR5IHRoYXQgd2FzIGFkZGVkXG4gKi9cbkxheWVyLnByb3RvdHlwZS5wb3AgPSBmdW5jdGlvbiBwb3AoKSB7XG4gICAgdmFyIHJlc3VsdCA9IHRoaXMuZW50aXRpZXMucG9wKCk7XG4gICAgdGhpcy5JTy5lbWl0KCdlbnRpdHlQb3BwZWQnLCByZXN1bHQpO1xuICAgIHJldHVybiByZXN1bHQ7XG59O1xuXG4vKipcbiAqIEZpbmQgd2hlcmUgYW5kIGlmIGFuIEVudGl0eSBpcyBpbiB0aGUgYXJyYXlcbiAqXG4gKiBAbWV0aG9kIGluZGV4T2ZcbiAqIFxuICogQHJlc3VsdCB7TnVtYmVyfSBpbmRleCBvZiBFbnRpdHkgaW4gdGhlIGFycmF5XG4gKi9cbkxheWVyLnByb3RvdHlwZS5pbmRleE9mID0gZnVuY3Rpb24gaW5kZXhPZigpIHtcbiAgICByZXR1cm4gdGhpcy5lbnRpdGllcy5pbmRleE9mLmFwcGx5KHRoaXMuZW50aXRpZXMsIGFyZ3VtZW50cyk7XG59O1xuXG4vKipcbiAqIFNwbGljZXMgdGhlIGFycmF5IGFuZCBlbWl0cyBhIG1lc3NhZ2VcbiAqXG4gKiBAbWV0aG9kIHNwbGljZVxuICogXG4gKiBAcmVzdWx0IHtBcnJheX0gc3BsaWNlZCBvdXQgRW50aXRpZXNcbiAqL1xuTGF5ZXIucHJvdG90eXBlLnNwbGljZSA9IGZ1bmN0aW9uIHNwbGljZSgpIHtcbiAgICB2YXIgcmVzdWx0ID0gdGhpcy5lbnRpdGllcy5zcGxpY2UuYXBwbHkodGhpcy5lbnRpdGllcywgYXJndW1lbnRzKTtcbiAgICB0aGlzLklPLmVtaXQoJ2VudGl0aWVzU3BsaWNlZCcsIHJlc3VsdCk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbn07XG5cbi8qKlxuICogUmVtb3ZlcyBhbmQgZW50aXR5IGZyb20gdGhlIGFycmF5IGFuZCBlbWl0cyBhIG1lc3NhZ2VcbiAqXG4gKiBAbWV0aG9kIHJlbW92ZVxuICogXG4gKiBAcmVzdWx0IHtFbnRpdHl9IHJlbW92ZWQgRW50aXR5XG4gKi9cbkxheWVyLnByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbiByZW1vdmUoZW50aXR5KSB7XG4gICAgdmFyIGluZGV4ID0gdGhpcy5lbnRpdGllcy5pbmRleE9mKGVudGl0eSk7XG4gICAgdGhpcy5JTy5lbWl0KCdlbnRpdHlSZW1vdmVkJywgZW50aXR5KTtcbiAgICBpZiAoaW5kZXggPCAwKSByZXR1cm4gZmFsc2U7XG4gICAgZWxzZSAgICAgICAgICAgcmV0dXJuIHRoaXMuZW50aXRpZXMuc3BsaWNlKGluZGV4LCAxKVswXTtcbn07XG5cbi8qKlxuICogR2V0IHRoZSBFbnRpdHkgYXJlIGEgcGFydGljdWxhciBpbmRleFxuICpcbiAqIEBtZXRob2QgZ2V0XG4gKiBcbiAqIEByZXN1bHQge0VudGl0eX0gRW50aXR5IGF0IHRoYXQgaW5kZXhcbiAqL1xuTGF5ZXIucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uIGdldChpbmRleCkge1xuICAgIHJldHVybiB0aGlzLmVudGl0aWVzW2luZGV4XTtcbn07XG5cbi8qKlxuICogRmluZCBvZiBpZiB0aGUgTGF5ZXIgaGFzIGFuIEVudGl0eVxuICpcbiAqIEBtZXRob2QgaGFzXG4gKiBcbiAqIEByZXN1bHQge0Jvb2xlYW59IGV4aXN0ZW5jZSBvZiB0aGUgRW50aXR5IGluIHRoZSBMYXllclxuICovXG5MYXllci5wcm90b3R5cGUuaGFzID0gZnVuY3Rpb24gaGFzKGVudGl0eSkge1xuICAgIHJldHVybiB0aGlzLmVudGl0aWVzLmluZGV4T2YoZW50aXR5KSAhPT0gLTE7XG59O1xuXG4vKipcbiAqIEV4ZWN1dGUgYSBmdW5jdGlvbiB0aGF0IGl0ZXJhdGVzIG92ZXIgdGhlIGNvbGxlY3Rpb25cbiAqICBvZiBFbnRpdGllcyBhbmQgY2FsbHMgYSBmdW5jdGlvbiB3aGVyZSB0aGUgcGFyYW1ldGVyc1xuICogIGFyZSwgdGhlIEVudGl0eSwgaW5kZXgsIGFuZCBmdWxsIGNvbGxlY3Rpb24gb2YgRW50aXRpZXMuXG4gKlxuICogQG1ldGhvZCBmb3JFYWNoXG4gKiBcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZ1bmN0aW9uIHRvIGJlIHJ1biBwZXIgRW50aXR5XG4gKi9cbkxheWVyLnByb3RvdHlwZS5mb3JFYWNoID0gZnVuY3Rpb24gZm9yRWFjaChmbikge1xuICAgIHZhciBpICAgICAgPSAtMSxcbiAgICAgICAgbGVuZ3RoID0gdGhpcy5lbnRpdGllcy5sZW5ndGg7XG5cbiAgICBpZiAodHlwZW9mIGZuICE9PSAnZnVuY3Rpb24nKSB0aHJvdyBuZXcgRXJyb3IoJ0xheWVyLmZvckVhY2ggb25seSBhY2NlcHRzIGZ1bmN0aW9ucyBhcyBhIHBhcmFtZXRlcicpO1xuXG4gICAgd2hpbGUgKGxlbmd0aCAtICsraSkgZm4odGhpcy5lbnRpdGllc1tpXSwgaSwgdGhpcy5lbnRpdGllcyk7XG59O1xuXG4vKipcbiAqIEltcGxlbWVudHMgcmVkdWNlIG9uIHRoZSBjb2xsZWN0aW9uIG9mIEVudGl0aWVzXG4gKlxuICogQG1ldGhvZCByZWR1Y2VcbiAqIFxuICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuY3Rpb24gdG8gYmUgcnVuIHBlciBFbnRpdHlcbiAqIEBwYXJhbSB7Kn0gaW5pdGlhbFZhbHVlIGluaXRpYWwgdmFsdWUgb2YgdGhlIHJlZHVjZSBmdW5jdGlvblxuICogXG4gKiBAcmV0dXJuIHsqfSB2YWx1ZSBhZnRlciBlYWNoIEVudGl0eSBoYXMgaGFkIHRoZSBmdW5jdGlvbiBydW5cbiAqL1xuTGF5ZXIucHJvdG90eXBlLnJlZHVjZSA9IGZ1bmN0aW9uIHJlZHVjZShmbiwgaW5pdGlhbFZhbHVlKSB7XG4gICAgdmFyIGkgICAgICA9IC0xLFxuICAgICAgICBsZW5ndGggPSB0aGlzLmVudGl0aWVzLmxlbmd0aCxcbiAgICAgICAgYWNjdW11bGF0b3I7XG5cbiAgICBpZiAodHlwZW9mIGZuICE9PSAnZnVuY3Rpb24nKSB0aHJvdyBuZXcgRXJyb3IoJ0xheWVyLnJlZHVjZSBvbmx5IGFjY2VwdHMgZnVuY3Rpb25zIGFzIGEgcGFyYW1ldGVyJyk7XG5cbiAgICBpZiAoaW5pdGlhbFZhbHVlICE9IG51bGwpIGFjY3VtdWxhdG9yID0gaW5pdGlhbFZhbHVlO1xuICAgIGVsc2UgICAgICAgICAgICAgICAgICAgICAgYWNjdW11bGF0b3IgPSB0aGlzLmVudGl0aWVzWysraV07XG4gICAgd2hpbGUgKGxlbmd0aCAtICsraSkgICAgICBhY2N1bXVsYXRvciA9IGZuKGFjY3VtdWxhdG9yLCB0aGlzLmVudGl0aWVzW2ldLCBpLCB0aGlzLmVudGl0aWVzKTtcblxuICAgIHJldHVybiBhY2N1bXVsYXRvcjtcbn07XG5cbi8qKlxuICogSW1wbGVtZW50cyBtYXAgb24gdGhlIGNvbGxlY3Rpb24gb2YgRW50aXRpZXNcbiAqXG4gKiBAbWV0aG9kIG1hcFxuICogXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmdW5jdGlvbiB0byBiZSBydW4gcGVyIEVudGl0eVxuICpcbiAqIEByZXR1cm4ge0FycmF5fSBhcnJheSBvZiB0aGUgcmV0dXJuIHZhbHVlcyBvZiB0aGUgbWFwcGluZyBmdW5jdGlvblxuICovXG5MYXllci5wcm90b3R5cGUubWFwID0gZnVuY3Rpb24gbWFwKGZuKSB7XG4gICAgdmFyIGkgICAgICA9IC0xLFxuICAgICAgICBsZW5ndGggPSB0aGlzLmVudGl0aWVzLmxlbmd0aCxcbiAgICAgICAgcmVzdWx0ID0gW107XG5cbiAgICBpZiAodHlwZW9mIGZuICE9PSAnZnVuY3Rpb24nKSB0aHJvdyBuZXcgRXJyb3IoJ0xheWVyLm1hcCBvbmx5IGFjY2VwdHMgZnVuY3Rpb25zIGFzIGEgcGFyYW1ldGVyJyk7XG5cbiAgICB3aGlsZSAobGVuZ3RoIC0gKytpKSByZXN1bHQucHVzaChmbih0aGlzLmVudGl0aWVzW2ldLCBpLCB0aGlzLmVudGl0aWVzKSk7XG5cbiAgICByZXR1cm4gcmVzdWx0O1xufTtcblxuLyoqXG4gKiBJbXBsZW1lbnRzIGZpbHRlciBvbiB0aGUgY29sbGVjdGlvbiBvZiBFbnRpdGllc1xuICpcbiAqIEBtZXRob2QgZmlsdGVyXG4gKiBcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZ1bmN0aW9uIHRvIGJlIHJ1biBwZXIgRW50aXR5XG4gKlxuICogQHJldHVybiB7QXJyYXl9IGFycmF5IG9mIHRoZSByZXR1cm4gdmFsdWVzIG9mIHRoZSBmaWx0ZXJpbmcgZnVuY3Rpb25cbiAqL1xuTGF5ZXIucHJvdG90eXBlLmZpbHRlciA9IGZ1bmN0aW9uIGZpbHRlcihmbikge1xuICAgIHZhciBpICAgICAgPSAtMSxcbiAgICAgICAgbGVuZ3RoID0gdGhpcy5lbnRpdGllcy5sZW5ndGgsXG4gICAgICAgIHJlc3VsdCA9IFtdO1xuXG4gICAgaWYgKHR5cGVvZiBmbiAhPT0gJ2Z1bmN0aW9uJykgdGhyb3cgbmV3IEVycm9yKCdMYXllci5maWx0ZXIgb25seSBhY2NlcHRzIGZ1bmN0aW9ucyBhcyBhIHBhcmFtZXRlcicpO1xuXG4gICAgd2hpbGUgKGxlbmd0aCAtICsraSkgaWYgKGZuKHRoaXMuZW50aXRpZXNbaV0sIGksIHRoaXMuZW50aXRpZXMpKSByZXN1bHQucHVzaCh0aGlzLmVudGl0aWVzW2ldKTtcblxuICAgIHJldHVybiByZXN1bHQ7XG59O1xuXG4vKipcbiAqIEltcGxlbWVudHMgcmVqZWN0IG9uIHRoZSBjb2xsZWN0aW9uIG9mIEVudGl0aWVzXG4gKlxuICogQG1ldGhvZCByZWplY3RcbiAqIFxuICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuY3Rpb24gdG8gYmUgcnVuIHBlciBFbnRpdHlcbiAqXG4gKiBAcmV0dXJuIHtBcnJheX0gYXJyYXkgb2YgdGhlIHJldHVybiB2YWx1ZXMgb2YgdGhlIHJlamVjdGluZyBmdW5jdGlvblxuICovXG5MYXllci5wcm90b3R5cGUucmVqZWN0ID0gZnVuY3Rpb24gcmVqZWN0KGZuKSB7XG4gICAgdmFyIGkgICAgICA9IC0xLFxuICAgICAgICBsZW5ndGggPSB0aGlzLmVudGl0aWVzLmxlbmd0aCxcbiAgICAgICAgcmVzdWx0ID0gW107XG5cbiAgICBpZiAodHlwZW9mIGZuICE9PSAnZnVuY3Rpb24nKSB0aHJvdyBuZXcgRXJyb3IoJ0xheWVyLnJlamVjdCBvbmx5IGFjY2VwdHMgZnVuY3Rpb25zIGFzIGEgcGFyYW1ldGVyJyk7XG5cbiAgICB3aGlsZSAobGVuZ3RoIC0gKytpKSBpZiAoIWZuKHRoaXMuZW50aXRpZXNbaV0sIGksIHRoaXMuZW50aXRpZXMpKSByZXN1bHQucHVzaCh0aGlzLmVudGl0aWVzW2ldKTtcblxuICAgIHJldHVybiByZXN1bHQ7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IExheWVyO1xuIiwiLyogVGhpcyBTb3VyY2UgQ29kZSBGb3JtIGlzIHN1YmplY3QgdG8gdGhlIHRlcm1zIG9mIHRoZSBNb3ppbGxhIFB1YmxpY1xuICogTGljZW5zZSwgdi4gMi4wLiBJZiBhIGNvcHkgb2YgdGhlIE1QTCB3YXMgbm90IGRpc3RyaWJ1dGVkIHdpdGggdGhpc1xuICogZmlsZSwgWW91IGNhbiBvYnRhaW4gb25lIGF0IGh0dHA6Ly9tb3ppbGxhLm9yZy9NUEwvMi4wLy5cbiAqXG4gKiBPd25lcjogbWFya0BmYW1vLnVzXG4gKiBAbGljZW5zZSBNUEwgMi4wXG4gKiBAY29weXJpZ2h0IEZhbW91cyBJbmR1c3RyaWVzLCBJbmMuIDIwMTRcbiAqL1xuIFxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgRXZlbnRIYW5kbGVyID0gcmVxdWlyZSgnLi4vZXZlbnRzL0V2ZW50SGFuZGxlcicpO1xuXG4vKipcbiAqICBBIGNvbGxlY3Rpb24gb2YgbWV0aG9kcyBmb3Igc2V0dGluZyBvcHRpb25zIHdoaWNoIGNhbiBiZSBleHRlbmRlZFxuICogIG9udG8gb3RoZXIgY2xhc3Nlcy5cbiAqXG4gKlxuICogQGNsYXNzIE9wdGlvbnNNYW5hZ2VyXG4gKiBAY29uc3RydWN0b3JcbiAqIFxuICogQHBhcmFtIHtPYmplY3R9IHZhbHVlIG9wdGlvbnMgZGljdGlvbmFyeVxuICovXG5mdW5jdGlvbiBPcHRpb25zTWFuYWdlcih2YWx1ZSkge1xuICAgIHRoaXMuX3ZhbHVlID0gdmFsdWU7XG4gICAgdGhpcy5ldmVudE91dHB1dCA9IG51bGw7XG59XG5cbi8qKlxuICogQ3JlYXRlIG9wdGlvbnMgbWFuYWdlciBmcm9tIHNvdXJjZSBkaWN0aW9uYXJ5IHdpdGggYXJndW1lbnRzIG92ZXJyaWRlbiBieSBwYXRjaCBkaWN0aW9uYXJ5LlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZXRob2QgT3B0aW9uc01hbmFnZXIucGF0Y2hcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gc291cmNlIHNvdXJjZSBhcmd1bWVudHNcbiAqIEBwYXJhbSB7Li4uT2JqZWN0fSBkYXRhIGFyZ3VtZW50IGFkZGl0aW9ucyBhbmQgb3ZlcndyaXRlc1xuICogQHJldHVybiB7T2JqZWN0fSBzb3VyY2Ugb2JqZWN0XG4gKi9cbk9wdGlvbnNNYW5hZ2VyLnBhdGNoID0gZnVuY3Rpb24gcGF0Y2hPYmplY3Qoc291cmNlLCBkYXRhKSB7XG4gICAgdmFyIG1hbmFnZXIgPSBuZXcgT3B0aW9uc01hbmFnZXIoc291cmNlKTtcbiAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykgbWFuYWdlci5wYXRjaChhcmd1bWVudHNbaV0pO1xuICAgIHJldHVybiBzb3VyY2U7XG59O1xuXG5mdW5jdGlvbiBfY3JlYXRlRXZlbnRPdXRwdXQoKSB7XG4gICAgdGhpcy5ldmVudE91dHB1dCA9IG5ldyBFdmVudEhhbmRsZXIoKTtcbiAgICB0aGlzLmV2ZW50T3V0cHV0LmJpbmRUaGlzKHRoaXMpO1xuICAgIEV2ZW50SGFuZGxlci5zZXRPdXRwdXRIYW5kbGVyKHRoaXMsIHRoaXMuZXZlbnRPdXRwdXQpO1xufVxuXG4vKipcbiAqIENyZWF0ZSBPcHRpb25zTWFuYWdlciBmcm9tIHNvdXJjZSB3aXRoIGFyZ3VtZW50cyBvdmVycmlkZW4gYnkgcGF0Y2hlcy5cbiAqICAgVHJpZ2dlcnMgJ2NoYW5nZScgZXZlbnQgb24gdGhpcyBvYmplY3QncyBldmVudCBoYW5kbGVyIGlmIHRoZSBzdGF0ZSBvZlxuICogICB0aGUgT3B0aW9uc01hbmFnZXIgY2hhbmdlcyBhcyBhIHJlc3VsdC5cbiAqXG4gKiBAbWV0aG9kIHBhdGNoXG4gKlxuICogQHBhcmFtIHsuLi5PYmplY3R9IGFyZ3VtZW50cyBsaXN0IG9mIHBhdGNoIG9iamVjdHNcbiAqIEByZXR1cm4ge09wdGlvbnNNYW5hZ2VyfSB0aGlzXG4gKi9cbk9wdGlvbnNNYW5hZ2VyLnByb3RvdHlwZS5wYXRjaCA9IGZ1bmN0aW9uIHBhdGNoKCkge1xuICAgIHZhciBteVN0YXRlID0gdGhpcy5fdmFsdWU7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGRhdGEgPSBhcmd1bWVudHNbaV07XG4gICAgICAgIGZvciAodmFyIGsgaW4gZGF0YSkge1xuICAgICAgICAgICAgaWYgKChrIGluIG15U3RhdGUpICYmIChkYXRhW2tdICYmIGRhdGFba10uY29uc3RydWN0b3IgPT09IE9iamVjdCkgJiYgKG15U3RhdGVba10gJiYgbXlTdGF0ZVtrXS5jb25zdHJ1Y3RvciA9PT0gT2JqZWN0KSkge1xuICAgICAgICAgICAgICAgIGlmICghbXlTdGF0ZS5oYXNPd25Qcm9wZXJ0eShrKSkgbXlTdGF0ZVtrXSA9IE9iamVjdC5jcmVhdGUobXlTdGF0ZVtrXSk7XG4gICAgICAgICAgICAgICAgdGhpcy5rZXkoaykucGF0Y2goZGF0YVtrXSk7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuZXZlbnRPdXRwdXQpIHRoaXMuZXZlbnRPdXRwdXQuZW1pdCgnY2hhbmdlJywge2lkOiBrLCB2YWx1ZTogZGF0YVtrXX0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB0aGlzLnNldChrLCBkYXRhW2tdKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQWxpYXMgZm9yIHBhdGNoXG4gKlxuICogQG1ldGhvZCBzZXRPcHRpb25zXG4gKlxuICovXG5PcHRpb25zTWFuYWdlci5wcm90b3R5cGUuc2V0T3B0aW9ucyA9IE9wdGlvbnNNYW5hZ2VyLnByb3RvdHlwZS5wYXRjaDtcblxuLyoqXG4gKiBSZXR1cm4gT3B0aW9uc01hbmFnZXIgYmFzZWQgb24gc3ViLW9iamVjdCByZXRyaWV2ZWQgYnkga2V5XG4gKlxuICogQG1ldGhvZCBrZXlcbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gaWRlbnRpZmllciBrZXlcbiAqIEByZXR1cm4ge09wdGlvbnNNYW5hZ2VyfSBuZXcgb3B0aW9ucyBtYW5hZ2VyIHdpdGggdGhlIHZhbHVlXG4gKi9cbk9wdGlvbnNNYW5hZ2VyLnByb3RvdHlwZS5rZXkgPSBmdW5jdGlvbiBrZXkoaWRlbnRpZmllcikge1xuICAgIHZhciByZXN1bHQgPSBuZXcgT3B0aW9uc01hbmFnZXIodGhpcy5fdmFsdWVbaWRlbnRpZmllcl0pO1xuICAgIGlmICghKHJlc3VsdC5fdmFsdWUgaW5zdGFuY2VvZiBPYmplY3QpIHx8IHJlc3VsdC5fdmFsdWUgaW5zdGFuY2VvZiBBcnJheSkgcmVzdWx0Ll92YWx1ZSA9IHt9O1xuICAgIHJldHVybiByZXN1bHQ7XG59O1xuXG4vKipcbiAqIExvb2sgdXAgdmFsdWUgYnkga2V5XG4gKiBAbWV0aG9kIGdldFxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkga2V5XG4gKiBAcmV0dXJuIHtPYmplY3R9IGFzc29jaWF0ZWQgb2JqZWN0XG4gKi9cbk9wdGlvbnNNYW5hZ2VyLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbiBnZXQoa2V5KSB7XG4gICAgcmV0dXJuIHRoaXMuX3ZhbHVlW2tleV07XG59O1xuXG4vKipcbiAqIEFsaWFzIGZvciBnZXRcbiAqIEBtZXRob2QgZ2V0T3B0aW9uc1xuICovXG5PcHRpb25zTWFuYWdlci5wcm90b3R5cGUuZ2V0T3B0aW9ucyA9IE9wdGlvbnNNYW5hZ2VyLnByb3RvdHlwZS5nZXQ7XG5cbi8qKlxuICogU2V0IGtleSB0byB2YWx1ZS4gIE91dHB1dHMgJ2NoYW5nZScgZXZlbnQgaWYgYSB2YWx1ZSBpcyBvdmVyd3JpdHRlbi5cbiAqXG4gKiBAbWV0aG9kIHNldFxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkga2V5IHN0cmluZ1xuICogQHBhcmFtIHtPYmplY3R9IHZhbHVlIHZhbHVlIG9iamVjdFxuICogQHJldHVybiB7T3B0aW9uc01hbmFnZXJ9IG5ldyBvcHRpb25zIG1hbmFnZXIgYmFzZWQgb24gdGhlIHZhbHVlIG9iamVjdFxuICovXG5PcHRpb25zTWFuYWdlci5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24gc2V0KGtleSwgdmFsdWUpIHtcbiAgICB2YXIgb3JpZ2luYWxWYWx1ZSA9IHRoaXMuZ2V0KGtleSk7XG4gICAgdGhpcy5fdmFsdWVba2V5XSA9IHZhbHVlO1xuXG4gICAgaWYgKHRoaXMuZXZlbnRPdXRwdXQgJiYgdmFsdWUgIT09IG9yaWdpbmFsVmFsdWUpIHRoaXMuZXZlbnRPdXRwdXQuZW1pdCgnY2hhbmdlJywge2lkOiBrZXksIHZhbHVlOiB2YWx1ZX0pO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBSZXR1cm4gZW50aXJlIG9iamVjdCBjb250ZW50cyBvZiB0aGlzIE9wdGlvbnNNYW5hZ2VyLlxuICpcbiAqIEBtZXRob2QgdmFsdWVcbiAqXG4gKiBAcmV0dXJuIHtPYmplY3R9IGN1cnJlbnQgc3RhdGUgb2Ygb3B0aW9uc1xuICovXG5PcHRpb25zTWFuYWdlci5wcm90b3R5cGUudmFsdWUgPSBmdW5jdGlvbiB2YWx1ZSgpIHtcbiAgICByZXR1cm4gdGhpcy5fdmFsdWU7XG59O1xuXG4vKipcbiAqIEJpbmQgYSBjYWxsYmFjayBmdW5jdGlvbiB0byBhbiBldmVudCB0eXBlIGhhbmRsZWQgYnkgdGhpcyBvYmplY3QuXG4gKlxuICogQG1ldGhvZCBcIm9uXCJcbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gdHlwZSBldmVudCB0eXBlIGtleSAoZm9yIGV4YW1wbGUsICdjaGFuZ2UnKVxuICogQHBhcmFtIHtmdW5jdGlvbihzdHJpbmcsIE9iamVjdCl9IGhhbmRsZXIgY2FsbGJhY2tcbiAqIEByZXR1cm4ge0V2ZW50SGFuZGxlcn0gdGhpc1xuICovXG5PcHRpb25zTWFuYWdlci5wcm90b3R5cGUub24gPSBmdW5jdGlvbiBvbigpIHtcbiAgICBfY3JlYXRlRXZlbnRPdXRwdXQuY2FsbCh0aGlzKTtcbiAgICByZXR1cm4gdGhpcy5vbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xufTtcblxuLyoqXG4gKiBVbmJpbmQgYW4gZXZlbnQgYnkgdHlwZSBhbmQgaGFuZGxlci5cbiAqICAgVGhpcyB1bmRvZXMgdGhlIHdvcmsgb2YgXCJvblwiLlxuICpcbiAqIEBtZXRob2QgcmVtb3ZlTGlzdGVuZXJcbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gdHlwZSBldmVudCB0eXBlIGtleSAoZm9yIGV4YW1wbGUsICdjaGFuZ2UnKVxuICogQHBhcmFtIHtmdW5jdGlvbn0gaGFuZGxlciBmdW5jdGlvbiBvYmplY3QgdG8gcmVtb3ZlXG4gKiBAcmV0dXJuIHtFdmVudEhhbmRsZXJ9IGludGVybmFsIGV2ZW50IGhhbmRsZXIgb2JqZWN0IChmb3IgY2hhaW5pbmcpXG4gKi9cbk9wdGlvbnNNYW5hZ2VyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lciA9IGZ1bmN0aW9uIHJlbW92ZUxpc3RlbmVyKCkge1xuICAgIF9jcmVhdGVFdmVudE91dHB1dC5jYWxsKHRoaXMpO1xuICAgIHJldHVybiB0aGlzLnJlbW92ZUxpc3RlbmVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG59O1xuXG4vKipcbiAqIEFkZCBldmVudCBoYW5kbGVyIG9iamVjdCB0byBzZXQgb2YgZG93bnN0cmVhbSBoYW5kbGVycy5cbiAqXG4gKiBAbWV0aG9kIHBpcGVcbiAqXG4gKiBAcGFyYW0ge0V2ZW50SGFuZGxlcn0gdGFyZ2V0IGV2ZW50IGhhbmRsZXIgdGFyZ2V0IG9iamVjdFxuICogQHJldHVybiB7RXZlbnRIYW5kbGVyfSBwYXNzZWQgZXZlbnQgaGFuZGxlclxuICovXG5PcHRpb25zTWFuYWdlci5wcm90b3R5cGUucGlwZSA9IGZ1bmN0aW9uIHBpcGUoKSB7XG4gICAgX2NyZWF0ZUV2ZW50T3V0cHV0LmNhbGwodGhpcyk7XG4gICAgcmV0dXJuIHRoaXMucGlwZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xufTtcblxuLyoqXG4gKiBSZW1vdmUgaGFuZGxlciBvYmplY3QgZnJvbSBzZXQgb2YgZG93bnN0cmVhbSBoYW5kbGVycy5cbiAqIFVuZG9lcyB3b3JrIG9mIFwicGlwZVwiXG4gKlxuICogQG1ldGhvZCB1bnBpcGVcbiAqXG4gKiBAcGFyYW0ge0V2ZW50SGFuZGxlcn0gdGFyZ2V0IHRhcmdldCBoYW5kbGVyIG9iamVjdFxuICogQHJldHVybiB7RXZlbnRIYW5kbGVyfSBwcm92aWRlZCB0YXJnZXRcbiAqL1xuT3B0aW9uc01hbmFnZXIucHJvdG90eXBlLnVucGlwZSA9IGZ1bmN0aW9uIHVucGlwZSgpIHtcbiAgICBfY3JlYXRlRXZlbnRPdXRwdXQuY2FsbCh0aGlzKTtcbiAgICByZXR1cm4gdGhpcy51bnBpcGUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gT3B0aW9uc01hbmFnZXI7IiwiLyogVGhpcyBTb3VyY2UgQ29kZSBGb3JtIGlzIHN1YmplY3QgdG8gdGhlIHRlcm1zIG9mIHRoZSBNb3ppbGxhIFB1YmxpY1xuICogTGljZW5zZSwgdi4gMi4wLiBJZiBhIGNvcHkgb2YgdGhlIE1QTCB3YXMgbm90IGRpc3RyaWJ1dGVkIHdpdGggdGhpc1xuICogZmlsZSwgWW91IGNhbiBvYnRhaW4gb25lIGF0IGh0dHA6Ly9tb3ppbGxhLm9yZy9NUEwvMi4wLy5cbiAqXG4gKiBPd25lcnM6IGRhbkBmYW1vLnVzXG4gKiAgICAgICAgIGZlbGl4QGZhbW8udXNcbiAqICAgICAgICAgbWlrZUBmYW1vLnVzXG4gKlxuICogQGxpY2Vuc2UgTVBMIDIuMFxuICogQGNvcHlyaWdodCBGYW1vdXMgSW5kdXN0cmllcywgSW5jLiAyMDE0XG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgT3B0aW9uc01hbmFnZXIgICA9IHJlcXVpcmUoJy4uL09wdGlvbnNNYW5hZ2VyJyksXG4gICAgU3VyZmFjZSAgICAgICAgICA9IHJlcXVpcmUoJy4uL0NvbXBvbmVudHMvU3VyZmFjZScpLFxuICAgIENvbnRhaW5lciAgICAgICAgPSByZXF1aXJlKCcuLi9Db21wb25lbnRzL0NvbnRhaW5lcicpLFxuICAgIEVsZW1lbnRBbGxvY2F0b3IgPSByZXF1aXJlKCcuL0VsZW1lbnRBbGxvY2F0b3InKSxcbiAgICBFbnRpdHlSZWdpc3RyeSAgID0gcmVxdWlyZSgnLi4vRW50aXR5UmVnaXN0cnknKSxcbiAgICBNYXRyaXhNYXRoICAgICAgID0gcmVxdWlyZSgnLi4vLi4vbWF0aC80eDRtYXRyaXgnKTtcblxuLy8gU3RhdGVcbnZhciBjb250YWluZXJzVG9FbGVtZW50cyA9IHt9LFxuICAgIHN1cmZhY2VzVG9FbGVtZW50cyAgID0ge30sXG4gICAgY29udGFpbmVyc1RvU3VyZmFjZXMgPSB7fSxcbiAgICB0YXJnZXRzICAgICAgICAgICAgICA9IFtTdXJmYWNlLnRvU3RyaW5nKCldO1xuXG52YXIgdXNlUHJlZml4ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jykuc3R5bGUud2Via2l0VHJhbnNmb3JtICE9IG51bGw7XG5cbi8vIENPTlNUU1xudmFyIFpFUk8gICAgICAgICAgICAgICAgPSAwLFxuICAgIE1BVFJJWDNEICAgICAgICAgICAgPSAnbWF0cml4M2QoJyxcbiAgICBDTE9TRV9QQVJFTiAgICAgICAgID0gJyknLFxuICAgIENPTU1BICAgICAgICAgICAgICAgPSAnLCcsXG4gICAgRElWICAgICAgICAgICAgICAgICA9ICdkaXYnLFxuICAgIEZBX0NPTlRBSU5FUiAgICAgICAgPSAnZmEtY29udGFpbmVyJyxcbiAgICBGQV9TVVJGQUNFICAgICAgICAgID0gJ2ZhLXN1cmZhY2UnLFxuICAgIENPTlRBSU5FUiAgICAgICAgICAgPSAnY29udGFpbmVyJyxcbiAgICBQWCAgICAgICAgICAgICAgICAgID0gJ3B4JyxcbiAgICBTVVJGQUNFICAgICAgICAgICAgID0gJ3N1cmZhY2UnLFxuICAgIFRSQU5TRk9STSAgICAgICAgICAgPSAndHJhbnNmb3JtJyxcbiAgICBDU1NUUkFOU0ZPUk0gICAgICAgID0gdXNlUHJlZml4ID8gJ3dlYmtpdFRyYW5zZm9ybScgOiAndHJhbnNmb3JtJyxcbiAgICBDU1NUUkFOU0ZPUk1fT1JJR0lOID0gdXNlUHJlZml4ID8gJ3dlYmtpdFRyYW5zZm9ybU9yaWdpbicgOiAndHJhbnNmb3JtT3JpZ2luJztcblxuLy9zY3JhdGNoIG1lbW9yeSBmb3IgbWF0cml4IGNhbGN1bGF0aW9uc1xudmFyIGRldmljZVBpeGVsUmF0aW8gPSB3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbyB8fCAxLFxuICAgIG1hdHJpeFNjcmF0Y2gxICAgPSBuZXcgRmxvYXQzMkFycmF5KFsxLCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxXSksXG4gICAgbWF0cml4U2NyYXRjaDIgICA9IG5ldyBGbG9hdDMyQXJyYXkoWzEsIDAsIDAsIDAsIDAsIDEsIDAsIDAsIDAsIDAsIDEsIDAsIDAsIDAsIDAsIDFdKSxcbiAgICBtYXRyaXhTY3JhdGNoMyAgID0gbmV3IEZsb2F0MzJBcnJheShbMSwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMV0pLFxuICAgIG1hdHJpeFNjcmF0Y2g0ICAgPSBuZXcgRmxvYXQzMkFycmF5KFsxLCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxXSk7XG5cbi8qKlxuICogRE9NUmVuZGVyZXIgaXMgYSBzaW5nbGV0b24gb2JqZWN0IHdob3NlIHJlc3BvbnNpYmxpdHkgaXQgaXNcbiAqICB0byBkcmF3IERPTSBib3VuZCBTdXJmYWNlcyB0byB0aGVpciByZXNwZWN0aXZlIENvbnRhaW5lcnMuXG4gKlxuICogQGNsYXNzIERPTVJlbmRlcmVyXG4gKiBAc2luZ2xldG9uXG4gKi9cbnZhciBET01SZW5kZXJlciA9IHtcbiAgICBfcXVldWVzOiB7XG4gICAgICAgIGNvbnRhaW5lcnM6IHtcbiAgICAgICAgICAgIHVwZGF0ZTogW10sXG4gICAgICAgICAgICByZWNhbGw6IFtdLFxuICAgICAgICAgICAgZGVwbG95OiBbXVxuICAgICAgICB9LFxuICAgICAgICBzdXJmYWNlczoge31cbiAgICB9LFxuICAgIGFsbG9jYXRvcnM6IHt9XG59O1xuXG4vKipcbiAqIEFkZCBhbiBFbnRpdHkgd2l0aCBhIENvbnRhaW5lciBjb21wb25lbnQgdG8gdGhlIHF1ZXVlIHRvIGJlXG4gKiAgYWRkZWQgaW50byB0aGUgRE9NLlxuICpcbiAqIEBtZXRob2QgZGVwbG95Q29udGFpbmVyXG4gKiBcbiAqIEBwYXJhbSB7RW50aXR5fSBlbnRpdHkgRW50aXR5IHRoYXQgbmVlZHMgdG8gYmUgZGVwbG95ZWRcbiAqL1xuRE9NUmVuZGVyZXIuZGVwbG95Q29udGFpbmVyID0gZnVuY3Rpb24gZGVwbG95Q29udGFpbmVyKGVudGl0eSkge1xuICAgIHRoaXMuX3F1ZXVlcy5jb250YWluZXJzLmRlcGxveS5wdXNoKGVudGl0eSk7XG4gICAgY29udGFpbmVyc1RvU3VyZmFjZXNbZW50aXR5Ll9pZF0gID0ge307XG4gICAgdGhpcy5fcXVldWVzLnN1cmZhY2VzW2VudGl0eS5faWRdID0ge1xuICAgICAgICB1cGRhdGU6IFtdLFxuICAgICAgICByZWNhbGw6IFtdLFxuICAgICAgICBkZXBsb3k6IFtdXG4gICAgfTtcbn07XG5cbi8vIERlcGxveSBhIGdpdmVuIEVudGl0eSdzIENvbnRhaW5lciB0byB0aGUgRE9NLlxuZnVuY3Rpb24gX2RlcGxveUNvbnRhaW5lcihlbnRpdHkpIHtcbiAgICB2YXIgY29udGV4dCA9IGVudGl0eS5nZXRDb250ZXh0KCk7XG5cbiAgICAvLyBJZiB0aGUgQ29udGFpbmVyIGhhcyBub3QgcHJldmlvdXNseSBiZWVuIGRlcGxveSBhbmRcbiAgICAvLyBkb2VzIG5vdCBoYXZlIGFuIGFsbG9jYXRvciwgY3JlYXRlIG9uZS5cbiAgICBpZiAoIURPTVJlbmRlcmVyLmFsbG9jYXRvcnNbY29udGV4dC5faWRdKVxuICAgICAgICBET01SZW5kZXJlci5hbGxvY2F0b3JzW2NvbnRleHQuX2lkXSA9IG5ldyBFbGVtZW50QWxsb2NhdG9yKGNvbnRleHQuX3BhcmVudEVsKTtcblxuICAgIC8vIENyZWF0ZSB0aGUgRE9NIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBDb250YWluZXJcbiAgICB2YXIgZWxlbWVudCA9IERPTVJlbmRlcmVyLmFsbG9jYXRvcnNbY29udGV4dC5faWRdLmFsbG9jYXRlKERJVik7XG4gICAgY29udGFpbmVyc1RvRWxlbWVudHNbZW50aXR5Ll9pZF0gPSBlbGVtZW50O1xuICAgIF91cGRhdGVDb250YWluZXIoZW50aXR5LCBlbGVtZW50KTtcbiAgICBlbGVtZW50LmNsYXNzTGlzdC5hZGQoRkFfQ09OVEFJTkVSKTtcblxuICAgIERPTVJlbmRlcmVyLmFsbG9jYXRvcnNbZW50aXR5Ll9pZF0gPSBuZXcgRWxlbWVudEFsbG9jYXRvcihlbGVtZW50KTtcbn1cblxuLyoqXG4gKiBBZGQgYW4gRW50aXR5IHdpdGggYSBDb250YWluZXIgY29tcG9uZW50IHRvIHRoZSBxdWV1ZSB0byBiZVxuICogIHJlbW92ZWQgZnJvbSB0aGUgRE9NLlxuICpcbiAqIEBtZXRob2QgcmVjYWxsQ29udGFpbmVyXG4gKiBcbiAqIEBwYXJhbSB7RW50aXR5fSBlbnRpdHkgRW50aXR5IHRoYXQgbmVlZHMgdG8gYmUgcmVjYWxsZWRcbiAqL1xuRE9NUmVuZGVyZXIucmVjYWxsQ29udGFpbmVyID0gZnVuY3Rpb24gcmVjYWxsQ29udGFpbmVyKGVudGl0eSkge1xuICAgIHRoaXMuX3F1ZXVlcy5jb250YWluZXJzLnJlY2FsbC5wdXNoKGVudGl0eSk7XG4gICAgZGVsZXRlIHRoaXMuX3F1ZXVlcy5zdXJmYWNlc1tlbnRpdHkuX2lkXTtcbn07XG5cbi8vIFJlY2FsbCB0aGUgRE9NIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBFbnRpdHkncyBDb250YWluZXJcbi8vIGFuZCBjbGVhbiB1cCByZWZlcmVuY2VzLlxuZnVuY3Rpb24gX3JlY2FsbENvbnRhaW5lcihlbnRpdHkpIHtcbiAgICB2YXIgZWxlbWVudCA9IGNvbnRhaW5lcnNUb0VsZW1lbnRzW2VudGl0eS5faWRdO1xuICAgIHZhciBjb250ZXh0ID0gZW50aXR5LmdldENvbnRleHQoKTtcbiAgICBET01SZW5kZXJlci5hbGxvY2F0b3JzW2NvbnRleHQuX2lkXS5kZWFsbG9jYXRlKGVsZW1lbnQpO1xuICAgIGVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZShGQV9DT05UQUlORVIpO1xuICAgIGRlbGV0ZSBET01SZW5kZXJlci5hbGxvY2F0b3JzW2VudGl0eS5faWRdO1xufVxuXG4vKipcbiAqIEFkZCBhbiBFbnRpdHkgd2l0aCBhIENvbnRhaW5lciBjb21wb25lbnQgdG8gdGhlIHF1ZXVlIHRvIGJlXG4gKiAgdXBkYXRlZC5cbiAqXG4gKiBAbWV0aG9kIHVwZGF0ZUNvbnRhaW5lclxuICogXG4gKiBAcGFyYW0ge0VudGl0eX0gZW50aXR5IEVudGl0eSB0aGF0IG5lZWRzIHRvIGJlIHVwZGF0ZWRcbiAqL1xuRE9NUmVuZGVyZXIudXBkYXRlQ29udGFpbmVyID0gZnVuY3Rpb24gdXBkYXRlQ29udGFpbmVyKGVudGl0eSkge1xuICAgIHRoaXMuX3F1ZXVlcy5jb250YWluZXJzLnVwZGF0ZS5wdXNoKGVudGl0eSk7XG59O1xuXG4vLyBVcGRhdGUgdGhlIENvbnRhaW5lcidzIERPTSBwcm9wZXJ0aWVzXG5mdW5jdGlvbiBfdXBkYXRlQ29udGFpbmVyKGVudGl0eSkge1xuICAgIHZhciBjb250YWluZXIgPSBlbnRpdHkuZ2V0Q29tcG9uZW50KENPTlRBSU5FUiksXG4gICAgICAgIGVsZW1lbnQgICA9IGNvbnRhaW5lcnNUb0VsZW1lbnRzW2VudGl0eS5faWRdLFxuICAgICAgICBpICAgICAgICAgPSAwLFxuICAgICAgICBzaXplLFxuICAgICAgICBvcmlnaW4sXG4gICAgICAgIGNvbnRleHRTaXplO1xuXG4gICAgaWYgKGNvbnRhaW5lci5fZXZlbnRzLmRpcnR5KSB7XG4gICAgICAgIGkgPSBjb250YWluZXIuX2V2ZW50cy5vbi5sZW5ndGg7XG4gICAgICAgIHdoaWxlIChjb250YWluZXIuX2V2ZW50cy5vZmYubGVuZ3RoKSBlbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoY29udGFpbmVyLl9ldmVudHMub2ZmLnBvcCgpLCBjb250YWluZXIuX2V2ZW50cy5mb3J3YXJkZXIpO1xuICAgICAgICB3aGlsZSAoaS0tKSBlbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoY29udGFpbmVyLl9ldmVudHMub25baV0sIGNvbnRhaW5lci5fZXZlbnRzLmZvcndhcmRlcik7XG4gICAgICAgIGNvbnRhaW5lci5fZXZlbnRzLmRpcnR5ID0gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKGNvbnRhaW5lci5fc2l6ZURpcnR5IHx8IGNvbnRhaW5lci5fdHJhbnNmb3JtRGlydHkpIHtcbiAgICAgICAgY29udGV4dFNpemUgPSBlbnRpdHkuZ2V0Q29udGV4dCgpLl9zaXplO1xuICAgICAgICBzaXplICAgICAgICA9IGNvbnRhaW5lci5nZXRTaXplKCk7XG4gICAgICAgIG9yaWdpbiAgICAgID0gY29udGFpbmVyLm9yaWdpbjtcbiAgICB9XG5cbiAgICBpZiAoY29udGFpbmVyLl9zaXplRGlydHkpIHtcbiAgICAgICAgZWxlbWVudC5zdHlsZS53aWR0aCAgPSBzaXplWzBdICsgUFg7XG4gICAgICAgIGVsZW1lbnQuc3R5bGUuaGVpZ2h0ID0gc2l6ZVsxXSArIFBYO1xuICAgICAgICBjb250YWluZXIuX3NpemVEaXJ0eSA9IGZhbHNlO1xuICAgIH1cblxuICAgIGlmIChjb250YWluZXIuX3RyYW5zZm9ybURpcnR5KSB7XG4gICAgICAgIHZhciB0cmFuc2Zvcm0gICAgICAgICAgICAgICA9IERPTVJlbmRlcmVyLmNyZWF0ZURPTU1hdHJpeChlbnRpdHkuZ2V0Q29tcG9uZW50KFRSQU5TRk9STSkuX21hdHJpeCwgY29udGV4dFNpemUsIHNpemUsIG9yaWdpbik7XG4gICAgICAgIGVsZW1lbnQuc3R5bGVbQ1NTVFJBTlNGT1JNXSA9IERPTVJlbmRlcmVyLnN0cmluZ2lmeU1hdHJpeCh0cmFuc2Zvcm0pO1xuXG4gICAgICAgIHZhciBrZXlzID0gT2JqZWN0LmtleXMoY29udGFpbmVyc1RvU3VyZmFjZXNbZW50aXR5Ll9pZF0pO1xuICAgICAgICBpICAgICAgICA9IGtleXMubGVuZ3RoO1xuICAgICAgICB3aGlsZSAoaS0tKVxuICAgICAgICAgICAgaWYgKGNvbnRhaW5lcnNUb1N1cmZhY2VzW2VudGl0eS5faWRdW2tleXNbaV1dKVxuICAgICAgICAgICAgICAgIGNvbnRhaW5lcnNUb1N1cmZhY2VzW2VudGl0eS5faWRdW2tleXNbaV1dLmdldENvbXBvbmVudChTVVJGQUNFKS5pbnZhbGlkYXRpb25zIHw9IFN1cmZhY2UuaW52YWxpZGF0aW9ucy50cmFuc2Zvcm07XG4gICAgfVxufVxuXG4vKipcbiAqIEFkZCBhbiBFbnRpdHkgd2l0aCBhIFN1cmZhY2UgdG8gdGhlIHF1ZXVlIHRvIGJlIGRlcGxveWVkXG4gKiAgdG8gYSBwYXJ0aWN1bGFyIENvbnRhaW5lci5cbiAqXG4gKiBAbWV0aG9kIGRlcGxveVxuICogXG4gKiBAcGFyYW0ge0VudGl0eX0gZW50aXR5IEVudGl0eSB0aGF0IG5lZWRzIHRvIGJlIGRlcGxveWVkXG4gKiBAcGFyYW0ge0VudGl0eX0gY29udGFpbmVyIEVudGl0eSB0aGF0IHRoZSBTdXJmYWNlIHdpbGwgYmUgZGVwbG95ZWQgdG9cbiAqL1xuRE9NUmVuZGVyZXIuZGVwbG95ID0gZnVuY3Rpb24gZGVwbG95KGVudGl0eSwgY29udGFpbmVyKSB7XG4gICAgaWYgKCFzdXJmYWNlc1RvRWxlbWVudHNbZW50aXR5Ll9pZF0pIHN1cmZhY2VzVG9FbGVtZW50c1tlbnRpdHkuX2lkXSA9IHt9O1xuICAgIERPTVJlbmRlcmVyLl9xdWV1ZXMuc3VyZmFjZXNbY29udGFpbmVyLl9pZF0uZGVwbG95LnB1c2goZW50aXR5KTtcbiAgICBjb250YWluZXJzVG9TdXJmYWNlc1tjb250YWluZXIuX2lkXVtlbnRpdHkuX2lkXSA9IGVudGl0eTtcbn07XG5cbi8vIERlcGxveXMgdGhlIEVudGl0eSdzIFN1cmZhY2UgdG8gYSBwYXJ0aWN1bGFyIENvbnRhaW5lci5cbmZ1bmN0aW9uIF9kZXBsb3koZW50aXR5LCBjb250YWluZXJJRCkge1xuICAgIHZhciBlbGVtZW50ID0gRE9NUmVuZGVyZXIuYWxsb2NhdG9yc1tjb250YWluZXJJRF0uYWxsb2NhdGUoRElWKTtcbiAgICBlbnRpdHkuZ2V0Q29tcG9uZW50KFNVUkZBQ0UpLmludmFsaWRhdGVBbGwoKTtcbiAgICBzdXJmYWNlc1RvRWxlbWVudHNbZW50aXR5Ll9pZF1bY29udGFpbmVySURdID0gZWxlbWVudDtcbiAgICBlbGVtZW50LmNsYXNzTGlzdC5hZGQoRkFfU1VSRkFDRSk7XG4gICAgX3VwZGF0ZShlbnRpdHksIGNvbnRhaW5lcklEKTtcbn1cblxuLyoqXG4gKiBBZGQgYW4gRW50aXR5IHdpdGggYSBTdXJmYWNlIHRvIHRoZSBxdWV1ZSB0byBiZSByZWNhbGxlZFxuICogIGZyb20gYSBwYXJ0aWN1bGFyIENvbnRhaW5lci5cbiAqXG4gKiBAbWV0aG9kIHJlY2FsbFxuICogXG4gKiBAcGFyYW0ge0VudGl0eX0gZW50aXR5IEVudGl0eSB0aGF0IG5lZWRzIHRvIGJlIHJlY2FsbGVkIGZyb21cbiAqIEBwYXJhbSB7RW50aXR5fSBjb250YWluZXIgRW50aXR5IHRoYXQgdGhlIFN1cmZhY2Ugd2lsbCBiZSByZWNhbGxlZCBmcm9tXG4gKi9cbkRPTVJlbmRlcmVyLnJlY2FsbCA9IGZ1bmN0aW9uIHJlY2FsbChlbnRpdHksIGNvbnRhaW5lcikge1xuICAgIERPTVJlbmRlcmVyLl9xdWV1ZXMuc3VyZmFjZXNbY29udGFpbmVyLl9pZF0ucmVjYWxsLnB1c2goZW50aXR5KTtcbiAgICBjb250YWluZXJzVG9TdXJmYWNlc1tjb250YWluZXIuX2lkXVtlbnRpdHkuX2lkXSA9IGZhbHNlO1xufTtcblxuLy8gUmVjYWxscyB0aGUgRW50aXR5J3MgU3VyZmFjZSBmcm9tIGEgZ2l2ZW4gQ29udGFpbmVyXG5mdW5jdGlvbiBfcmVjYWxsKGVudGl0eSwgY29udGFpbmVySUQpIHtcbiAgICB2YXIgZWxlbWVudCA9IHN1cmZhY2VzVG9FbGVtZW50c1tlbnRpdHkuX2lkXTtcbiAgICB2YXIgc3VyZmFjZSA9IGVudGl0eS5nZXRDb21wb25lbnQoJ3N1cmZhY2UnKTtcbiAgICBET01SZW5kZXJlci5hbGxvY2F0b3JzW2NvbnRhaW5lcklEXS5kZWFsbG9jYXRlKGVsZW1lbnQpO1xuICAgIHZhciBpID0gc3VyZmFjZS5zcGVjLmV2ZW50cy5sZW5ndGg7XG4gICAgd2hpbGUgKGktLSkgZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKHN1cmZhY2Uuc3BlYy5ldmVudHNbaV0sIHN1cmZhY2UuZXZlbnRGb3J3YXJkZXIpO1xufVxuXG4vKipcbiAqIEFkZCBhbiBFbnRpdHkgd2l0aCBhIFN1cmZhY2UgdG8gdGhlIHF1ZXVlIHRvIGJlIHVwZGF0ZWRcbiAqXG4gKiBAbWV0aG9kIHVwZGF0ZVxuICogXG4gKiBAcGFyYW0ge0VudGl0eX0gZW50aXR5IEVudGl0eSB0aGF0IG5lZWRzIHRvIGJlIHVwZGF0ZWRcbiAqIEBwYXJhbSB7RW50aXR5fSBjb250YWluZXIgRW50aXR5IHRoYXQgdGhlIFN1cmZhY2Ugd2lsbCBiZSB1cGRhdGVkIGZvclxuICovXG5ET01SZW5kZXJlci51cGRhdGUgPSBmdW5jdGlvbiB1cGRhdGUoZW50aXR5LCBjb250YWluZXIpIHtcbiAgICBET01SZW5kZXJlci5fcXVldWVzLnN1cmZhY2VzW2NvbnRhaW5lci5faWRdLnVwZGF0ZS5wdXNoKGVudGl0eSk7XG59O1xuXG4vLyBVcGRhdGUgdGhlIFN1cmZhY2UgdGhhdCBpcyB0byBkZXBsb3llZCB0byBhIHBhcnRjdWxhciBDb250YWluZXJcbmZ1bmN0aW9uIF91cGRhdGUoZW50aXR5LCBjb250YWluZXJJRCkge1xuICAgIHZhciBzdXJmYWNlICAgICAgICAgPSBlbnRpdHkuZ2V0Q29tcG9uZW50KFNVUkZBQ0UpLFxuICAgICAgICBzcGVjICAgICAgICAgICAgPSBzdXJmYWNlLnJlbmRlcigpLFxuICAgICAgICBpICAgICAgICAgICAgICAgPSAwLFxuICAgICAgICBjb250ZXh0U2l6ZSAgICAgPSBlbnRpdHkuZ2V0Q29udGV4dCgpLl9zaXplLFxuICAgICAgICBlbGVtZW50ICAgICAgICAgPSBzdXJmYWNlc1RvRWxlbWVudHNbZW50aXR5Ll9pZF1bY29udGFpbmVySURdLFxuICAgICAgICBjb250YWluZXJFbnRpdHkgPSBFbnRpdHlSZWdpc3RyeS5nZXRFbnRpdHkoY29udGFpbmVySUQpLFxuICAgICAgICBjb250YWluZXIgICAgICAgPSBjb250YWluZXJFbnRpdHkuZ2V0Q29tcG9uZW50KENPTlRBSU5FUiksXG4gICAgICAgIGtleTtcblxuICAgIGlmIChTdXJmYWNlLmludmFsaWRhdGlvbnMuY2xhc3NlcyAmIHNwZWMuaW52YWxpZGF0aW9ucykge1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgZWxlbWVudC5jbGFzc0xpc3QubGVuZ3RoOyBpKyspIGVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZShlbGVtZW50LmNsYXNzTGlzdFtpXSk7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBzcGVjLmNsYXNzZXMubGVuZ3RoOyAgIGkrKykgZWxlbWVudC5jbGFzc0xpc3QuYWRkKHNwZWMuY2xhc3Nlc1tpXSk7XG4gICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LmFkZChGQV9TVVJGQUNFKTtcbiAgICB9XG4gICAgXG4gICAgaWYgKFN1cmZhY2UuaW52YWxpZGF0aW9ucy5wcm9wZXJ0aWVzICYgc3BlYy5pbnZhbGlkYXRpb25zKVxuICAgICAgICBmb3IgKGtleSBpbiBzcGVjLnByb3BlcnRpZXMpIGVsZW1lbnQuc3R5bGVba2V5XSA9IHNwZWMucHJvcGVydGllc1trZXldO1xuXG4gICAgaWYgKFN1cmZhY2UuaW52YWxpZGF0aW9ucy5jb250ZW50ICYgc3BlYy5pbnZhbGlkYXRpb25zKVxuICAgICAgICBlbGVtZW50LmlubmVySFRNTCA9IHNwZWMuY29udGVudDtcblxuICAgIGlmIChTdXJmYWNlLmludmFsaWRhdGlvbnMub3BhY2l0eSAmIHNwZWMuaW52YWxpZGF0aW9ucylcbiAgICAgICAgZWxlbWVudC5zdHlsZS5vcGFjaXR5ID0gc3BlYy5vcGFjaXR5O1xuXG4gICAgaWYgKFN1cmZhY2UuaW52YWxpZGF0aW9ucy5vcmlnaW4gJiBzcGVjLmludmFsaWRhdGlvbnMpIHtcbiAgICAgICAgZWxlbWVudC5zdHlsZVtDU1NUUkFOU0ZPUk1fT1JJR0lOXSA9IHNwZWMub3JpZ2luWzBdLnRvRml4ZWQoMikgKiAxMDAgKyAnJSAnICsgc3BlYy5vcmlnaW5bMV0udG9GaXhlZCgyKSAqIDEwMCArICclJztcbiAgICB9XG5cbiAgICBpZiAoU3VyZmFjZS5pbnZhbGlkYXRpb25zLmV2ZW50cyAmIHNwZWMuaW52YWxpZGF0aW9ucykge1xuICAgICAgICBpID0gc3BlYy5ldmVudHMubGVuZ3RoO1xuICAgICAgICB3aGlsZSAoaS0tKSBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoc3BlYy5ldmVudHNbaV0sIHNwZWMuZXZlbnRGb3J3YXJkZXIpO1xuICAgIH1cblxuICAgIGlmIChTdXJmYWNlLmludmFsaWRhdGlvbnMuc2l6ZSAmIHNwZWMuaW52YWxpZGF0aW9ucykge1xuICAgICAgICBzdXJmYWNlLl9zaXplWzBdID0gZWxlbWVudC5vZmZzZXRXaWR0aDtcbiAgICAgICAgc3VyZmFjZS5fc2l6ZVsxXSA9IGVsZW1lbnQub2Zmc2V0SGVpZ2h0O1xuICAgIH1cblxuICAgIGlmIChTdXJmYWNlLmludmFsaWRhdGlvbnMudHJhbnNmb3JtICYgc3BlYy5pbnZhbGlkYXRpb25zKSB7XG4gICAgICAgIHZhciB0cmFuc2Zvcm0gPSBNYXRyaXhNYXRoLm11bHRpcGx5KG1hdHJpeFNjcmF0Y2gzLCBjb250YWluZXIuZ2V0RGlzcGxheU1hdHJpeCgpLCBlbnRpdHkuZ2V0Q29tcG9uZW50KFRSQU5TRk9STSkuX21hdHJpeCk7XG4gICAgICAgIHRyYW5zZm9ybSAgICAgPSBET01SZW5kZXJlci5jcmVhdGVET01NYXRyaXgodHJhbnNmb3JtLCBjb250ZXh0U2l6ZSwgc3VyZmFjZS5nZXRTaXplKCksIHNwZWMub3JpZ2luKTtcbiAgICAgICAgdmFyIGNhbWVyYSAgICA9IGVudGl0eS5nZXRDb250ZXh0KCkuZ2V0Q29tcG9uZW50KCdjYW1lcmEnKTtcbiAgICAgICAgaWYgKGNhbWVyYSkge1xuICAgICAgICAgICAgdmFyIGZvY2FsUG9pbnQgICAgPSBjYW1lcmEuZ2V0T3B0aW9ucygpLnByb2plY3Rpb24ub3B0aW9ucy5mb2NhbFBvaW50O1xuICAgICAgICAgICAgdmFyIGZ4ICAgICAgICAgICAgPSAoZm9jYWxQb2ludFswXSArIDEpICogMC41ICogY29udGV4dFNpemVbMF07XG4gICAgICAgICAgICB2YXIgZnkgICAgICAgICAgICA9ICgxIC0gZm9jYWxQb2ludFsxXSkgKiAwLjUgKiBjb250ZXh0U2l6ZVsxXTtcbiAgICAgICAgICAgIHZhciBzY3JhdGNoTWF0cml4ID0gWzEsIDAsIDAsIDAsIDAsIDEsIDAsICAwLCAwLCAwLCAxLCAwLCBmeCAtIHN1cmZhY2UuZ2V0U2l6ZSgpWzBdICogc3BlYy5vcmlnaW5bMF0sICBmeSAtIHN1cmZhY2UuZ2V0U2l6ZSgpWzFdICogc3BlYy5vcmlnaW5bMV0sIDAsIDFdO1xuICAgICAgICAgICAgTWF0cml4TWF0aC5tdWx0aXBseShzY3JhdGNoTWF0cml4LCBzY3JhdGNoTWF0cml4LCBbMSwgMCwgMCwgMCwgMCwgMSwgMCwgIDAsIDAsIDAsIDEsIGVudGl0eS5nZXRDb250ZXh0KCkuZ2V0Q29tcG9uZW50KCdjYW1lcmEnKS5nZXRQcm9qZWN0aW9uVHJhbnNmb3JtKClbMTFdLCAgMCwgMCwgMCwgMV0pO1xuICAgICAgICAgICAgTWF0cml4TWF0aC5tdWx0aXBseShzY3JhdGNoTWF0cml4LCBzY3JhdGNoTWF0cml4LCBbMSwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSwgMCwgLShmeCAtIHN1cmZhY2UuZ2V0U2l6ZSgpWzBdICogc3BlYy5vcmlnaW5bMF0pLCAgLShmeSAtIHN1cmZhY2UuZ2V0U2l6ZSgpWzFdICogc3BlYy5vcmlnaW5bMV0pLCAwLCAxXSk7XG4gICAgICAgICAgICBNYXRyaXhNYXRoLm11bHRpcGx5KHRyYW5zZm9ybSwgc2NyYXRjaE1hdHJpeCwgdHJhbnNmb3JtKTtcbiAgICAgICAgfVxuICAgICAgICBlbGVtZW50LnN0eWxlW0NTU1RSQU5TRk9STV0gPSBET01SZW5kZXJlci5zdHJpbmdpZnlNYXRyaXgodHJhbnNmb3JtKTtcbiAgICB9XG59XG5cbi8qKlxuICogUmVuZGVyIHdpbGwgcnVuIG92ZXIgYWxsIG9mIHRoZSBxdWV1ZXMgdGhhdCBoYXZlIGJlZW4gcG9wdWxhdGVkXG4gKiAgYnkgdGhlIFJlbmRlclN5c3RlbSBhbmQgd2lsbCBleGVjdXRlIHRoZSBkZXBsb3ltZW50LCByZWNhbGxpbmcsXG4gKiAgYW5kIHVwZGF0aW5nLlxuICpcbiAqIEBtZXRob2QgcmVuZGVyXG4gKi9cbiBET01SZW5kZXJlci5yZW5kZXIgPSBmdW5jdGlvbiByZW5kZXIoKSB7XG4gICAgdmFyIHF1ZXVlLFxuICAgICAgICBjb250YWluZXJJRCxcbiAgICAgICAgaW5uZXJRdWV1ZXMsXG4gICAgICAgIHF1ZXVlcyAgICAgPSBET01SZW5kZXJlci5fcXVldWVzLFxuICAgICAgICBjb250YWluZXJzID0gT2JqZWN0LmtleXMocXVldWVzLnN1cmZhY2VzKSxcbiAgICAgICAgaiAgICAgICAgICA9IGNvbnRhaW5lcnMubGVuZ3RoLFxuICAgICAgICBpICAgICAgICAgID0gMCxcbiAgICAgICAgayAgICAgICAgICA9IDA7XG4gICAgXG4gICAgLy8gRGVwbG95IENvbnRhaW5lcnNcbiAgICBxdWV1ZSA9IHF1ZXVlcy5jb250YWluZXJzLmRlcGxveTtcbiAgICBpICAgICA9IHF1ZXVlLmxlbmd0aDtcbiAgICB3aGlsZSAoaS0tKSBfZGVwbG95Q29udGFpbmVyKHF1ZXVlLnNoaWZ0KCkpO1xuXG4gICAgLy8gUmVjYWxsIENvbnRhaW5lcnNcbiAgICBxdWV1ZSA9IHF1ZXVlcy5jb250YWluZXJzLnJlY2FsbDtcbiAgICBpICAgICA9IHF1ZXVlLmxlbmd0aDtcbiAgICB3aGlsZSAoaS0tKSBfcmVjYWxsQ29udGFpbmVyKHF1ZXVlLnNoaWZ0KCkpO1xuXG4gICAgLy8gVXBkYXRlIENvbnRhaW5lcnNcbiAgICBxdWV1ZSA9IHF1ZXVlcy5jb250YWluZXJzLnVwZGF0ZTtcbiAgICBpICAgICA9IHF1ZXVlLmxlbmd0aDtcbiAgICB3aGlsZSAoaS0tKSBfdXBkYXRlQ29udGFpbmVyKHF1ZXVlLnNoaWZ0KCkpO1xuXG4gICAgLy8gRm9yIGVhY2ggQ29udGFpbmVyXG4gICAgd2hpbGUgKGotLSkge1xuICAgICAgICBjb250YWluZXJJRCA9IGNvbnRhaW5lcnNbal07XG4gICAgICAgIGlubmVyUXVldWVzID0gcXVldWVzLnN1cmZhY2VzW2NvbnRhaW5lcklEXTtcblxuICAgICAgICAvLyBEZXBsb3kgU3VyZmFjZXNcbiAgICAgICAgcXVldWUgPSBpbm5lclF1ZXVlcy5kZXBsb3k7XG4gICAgICAgIGkgICAgID0gcXVldWUubGVuZ3RoO1xuICAgICAgICB3aGlsZSAoaS0tKSBfZGVwbG95KHF1ZXVlLnNoaWZ0KCksIGNvbnRhaW5lcklEKTtcblxuICAgICAgICAvLyBSZWNhbGwgU3VyZmFjZXNcbiAgICAgICAgcXVldWUgPSBpbm5lclF1ZXVlcy5yZWNhbGw7XG4gICAgICAgIGkgICAgID0gcXVldWUubGVuZ3RoO1xuICAgICAgICB3aGlsZSAoaS0tKSBfcmVjYWxsKHF1ZXVlLnNoaWZ0KCksIGNvbnRhaW5lcklEKTtcblxuICAgICAgICAvLyBVcGRhdGUgU3VyZmFjZXNcbiAgICAgICAgcXVldWUgPSBpbm5lclF1ZXVlcy51cGRhdGU7XG4gICAgICAgIGkgICAgID0gcXVldWUubGVuZ3RoO1xuICAgICAgICB3aGlsZSAoaS0tKSBfdXBkYXRlKHF1ZXVlLnNoaWZ0KCksIGNvbnRhaW5lcklEKTtcbiAgICB9XG5cbn07XG5cbi8vIEdldCB0aGUgdHlwZSBvZiBUYXJnZXRzIHRoZSBET01SZW5kZXJlciB3aWxsIHdvcmsgZm9yXG5ET01SZW5kZXJlci5nZXRUYXJnZXRzID0gZnVuY3Rpb24gZ2V0VGFyZ2V0cygpIHtcbiAgICByZXR1cm4gdGFyZ2V0cztcbn07XG5cbi8qKlxuICogQ3JlYXRlIHRoZSBUcmFuc2Zvcm0gbWF0cml4IGZvciBhIFN1cmZhY2UgYmFzZWQgb24gaXQgdHJhbnNmb3JtLFxuICogIHNpemUsIG9yaWdpbiwgYW5kIENvbnRleHQncyBzaXplLiAgVXNlcyBpdHMgQ29udGV4dCdzIHNpemUgdG9cbiAqICB0dXJuIGhvbW9nZW5vdXMgY29vcmRpbmF0ZSBUcmFuc2Zvcm1zIHRvIHBpeGVscy5cbiAqXG4gKiBAbWV0aG9kIGNyZWF0ZURPTU1BdHJpeFxuICpcbiAqIEBwYXJhbSB7QXJyYXl9IHRyYW5zZm9ybSBUcmFuc2Zvcm0gbWF0cml4XG4gKiBAcGFyYW0ge0FycmF5fSBjb250ZXh0U2l6ZSAyLWRpbWVuc2lvbmFsIHNpemUgb2YgdGhlIENvbnRleHRcbiAqIEBwYXJhbSB7QXJyYXl9IHNpemUgc2l6ZSBvZiB0aGUgRE9NIGVsZW1lbnQgYXMgYSAzLWRpbWVuc2lvbmFsIGFycmF5XG4gKiBAcGFyYW0ge0FycmF5fSBvcmlnaW4gb3JpZ2luIG9mIHRoZSBET00gZWxlbWVudCBhcyBhIDItZGltZW5zaW9uYWwgYXJyYXlcbiAqIEBwYXJhbSB7QXJyYXl9IHJlc3VsdCBzdG9yYWdlIG9mIHRoZSBET00gYm91bmQgdHJhbnNmb3JtIG1hdHJpeFxuICovXG5ET01SZW5kZXJlci5jcmVhdGVET01NYXRyaXggPSBmdW5jdGlvbiBjcmVhdGVET01NYXRyaXgodHJhbnNmb3JtLCBjb250ZXh0U2l6ZSwgc2l6ZSwgb3JpZ2luLCByZXN1bHQpIHtcbiAgICByZXN1bHQgICAgICAgICAgICAgPSByZXN1bHQgfHwgW107XG4gICAgLy8gc2l6ZVswXSAgICAgICAgICAgLz0gMC41ICogY29udGV4dFNpemVbMF07IC8vIFRPRE86IFdlJ3JlIG5vdCB1c2luZyB0aGUgXG4gICAgLy8gc2l6ZVsxXSAgICAgICAgICAgLz0gMC41ICogY29udGV4dFNpemVbMV07XG4gICAgbWF0cml4U2NyYXRjaDFbMF0gID0gMTtcbiAgICBtYXRyaXhTY3JhdGNoMVsxXSAgPSAwO1xuICAgIG1hdHJpeFNjcmF0Y2gxWzJdICA9IDA7XG4gICAgbWF0cml4U2NyYXRjaDFbM10gID0gMDtcbiAgICBtYXRyaXhTY3JhdGNoMVs0XSAgPSAwO1xuICAgIG1hdHJpeFNjcmF0Y2gxWzVdICA9IDE7XG4gICAgbWF0cml4U2NyYXRjaDFbNl0gID0gMDtcbiAgICBtYXRyaXhTY3JhdGNoMVs3XSAgPSAwO1xuICAgIG1hdHJpeFNjcmF0Y2gxWzhdICA9IDA7XG4gICAgbWF0cml4U2NyYXRjaDFbOV0gID0gMDtcbiAgICBtYXRyaXhTY3JhdGNoMVsxMF0gPSAxO1xuICAgIG1hdHJpeFNjcmF0Y2gxWzExXSA9IDA7XG4gICAgbWF0cml4U2NyYXRjaDFbMTJdID0gLXNpemVbMF0gKiBvcmlnaW5bMF07XG4gICAgbWF0cml4U2NyYXRjaDFbMTNdID0gLXNpemVbMV0gKiBvcmlnaW5bMV07XG4gICAgbWF0cml4U2NyYXRjaDFbMTRdID0gMDtcbiAgICBtYXRyaXhTY3JhdGNoMVsxNV0gPSAxO1xuICAgIE1hdHJpeE1hdGgubXVsdGlwbHkobWF0cml4U2NyYXRjaDIsIG1hdHJpeFNjcmF0Y2gxLCB0cmFuc2Zvcm0pO1xuXG4gICAgcmVzdWx0WzBdICA9ICgobWF0cml4U2NyYXRjaDJbMF0gIDwgMC4wMDAwMDEgJiYgbWF0cml4U2NyYXRjaDJbMF0gID4gLTAuMDAwMDAxKSA/IFpFUk8gOiBtYXRyaXhTY3JhdGNoMlswXSk7XG4gICAgcmVzdWx0WzFdICA9ICgobWF0cml4U2NyYXRjaDJbMV0gIDwgMC4wMDAwMDEgJiYgbWF0cml4U2NyYXRjaDJbMV0gID4gLTAuMDAwMDAxKSA/IFpFUk8gOiBtYXRyaXhTY3JhdGNoMlsxXSk7XG4gICAgcmVzdWx0WzJdICA9ICgobWF0cml4U2NyYXRjaDJbMl0gIDwgMC4wMDAwMDEgJiYgbWF0cml4U2NyYXRjaDJbMl0gID4gLTAuMDAwMDAxKSA/IFpFUk8gOiBtYXRyaXhTY3JhdGNoMlsyXSk7XG4gICAgcmVzdWx0WzNdICA9ICgobWF0cml4U2NyYXRjaDJbM10gIDwgMC4wMDAwMDEgJiYgbWF0cml4U2NyYXRjaDJbM10gID4gLTAuMDAwMDAxKSA/IFpFUk8gOiBtYXRyaXhTY3JhdGNoMlszXSk7XG4gICAgcmVzdWx0WzRdICA9ICgobWF0cml4U2NyYXRjaDJbNF0gIDwgMC4wMDAwMDEgJiYgbWF0cml4U2NyYXRjaDJbNF0gID4gLTAuMDAwMDAxKSA/IFpFUk8gOiBtYXRyaXhTY3JhdGNoMls0XSk7XG4gICAgcmVzdWx0WzVdICA9ICgobWF0cml4U2NyYXRjaDJbNV0gIDwgMC4wMDAwMDEgJiYgbWF0cml4U2NyYXRjaDJbNV0gID4gLTAuMDAwMDAxKSA/IFpFUk8gOiBtYXRyaXhTY3JhdGNoMls1XSk7XG4gICAgcmVzdWx0WzZdICA9ICgobWF0cml4U2NyYXRjaDJbNl0gIDwgMC4wMDAwMDEgJiYgbWF0cml4U2NyYXRjaDJbNl0gID4gLTAuMDAwMDAxKSA/IFpFUk8gOiBtYXRyaXhTY3JhdGNoMls2XSk7XG4gICAgcmVzdWx0WzddICA9ICgobWF0cml4U2NyYXRjaDJbN10gIDwgMC4wMDAwMDEgJiYgbWF0cml4U2NyYXRjaDJbN10gID4gLTAuMDAwMDAxKSA/IFpFUk8gOiBtYXRyaXhTY3JhdGNoMls3XSk7XG4gICAgcmVzdWx0WzhdICA9ICgobWF0cml4U2NyYXRjaDJbOF0gIDwgMC4wMDAwMDEgJiYgbWF0cml4U2NyYXRjaDJbOF0gID4gLTAuMDAwMDAxKSA/IFpFUk8gOiBtYXRyaXhTY3JhdGNoMls4XSk7XG4gICAgcmVzdWx0WzldICA9ICgobWF0cml4U2NyYXRjaDJbOV0gIDwgMC4wMDAwMDEgJiYgbWF0cml4U2NyYXRjaDJbOV0gID4gLTAuMDAwMDAxKSA/IFpFUk8gOiBtYXRyaXhTY3JhdGNoMls5XSk7XG4gICAgcmVzdWx0WzEwXSA9ICgobWF0cml4U2NyYXRjaDJbMTBdIDwgMC4wMDAwMDEgJiYgbWF0cml4U2NyYXRjaDJbMTBdID4gLTAuMDAwMDAxKSA/IFpFUk8gOiBtYXRyaXhTY3JhdGNoMlsxMF0pO1xuICAgIHJlc3VsdFsxMV0gPSAoKG1hdHJpeFNjcmF0Y2gyWzExXSA8IDAuMDAwMDAxICYmIG1hdHJpeFNjcmF0Y2gyWzExXSA+IC0wLjAwMDAwMSkgPyBaRVJPIDogbWF0cml4U2NyYXRjaDJbMTFdKTtcbiAgICByZXN1bHRbMTJdID0gKChtYXRyaXhTY3JhdGNoMlsxMl0gPCAwLjAwMDAwMSAmJiBtYXRyaXhTY3JhdGNoMlsxMl0gPiAtMC4wMDAwMDEpID8gWkVSTyA6IG1hdHJpeFNjcmF0Y2gyWzEyXSkgKyAwLjUgKiBjb250ZXh0U2l6ZVswXTtcbiAgICByZXN1bHRbMTNdID0gKChtYXRyaXhTY3JhdGNoMlsxM10gPCAwLjAwMDAwMSAmJiBtYXRyaXhTY3JhdGNoMlsxM10gPiAtMC4wMDAwMDEpID8gWkVSTyA6IG1hdHJpeFNjcmF0Y2gyWzEzXSkgKyAwLjUgKiBjb250ZXh0U2l6ZVsxXTtcbiAgICAvLyByZXN1bHRbMTJdID0gKE1hdGgucm91bmQoKG1hdHJpeFNjcmF0Y2gyWzEyXSArIDEpICogMC41ICogY29udGV4dFNpemVbMF0gKiBkZXZpY2VQaXhlbFJhdGlvKSAvIGRldmljZVBpeGVsUmF0aW8pO1xuICAgIC8vIHJlc3VsdFsxM10gPSAoTWF0aC5yb3VuZCgobWF0cml4U2NyYXRjaDJbMTNdICsgMSkgKiAwLjUgKiBjb250ZXh0U2l6ZVsxXSAqIGRldmljZVBpeGVsUmF0aW8pIC8gZGV2aWNlUGl4ZWxSYXRpbyk7XG4gICAgcmVzdWx0WzE0XSA9ICgobWF0cml4U2NyYXRjaDJbMTRdIDwgMC4wMDAwMDEgJiYgbWF0cml4U2NyYXRjaDJbMTRdID4gLTAuMDAwMDAxKSA/IFpFUk8gOiBtYXRyaXhTY3JhdGNoMlsxNF0pO1xuICAgIHJlc3VsdFsxNV0gPSAoKG1hdHJpeFNjcmF0Y2gyWzE1XSA8IDAuMDAwMDAxICYmIG1hdHJpeFNjcmF0Y2gyWzE1XSA+IC0wLjAwMDAwMSkgPyBaRVJPIDogbWF0cml4U2NyYXRjaDJbMTVdKTtcblxuICAgIC8vIHNpemVbMF0gKj0gMC41ICogY29udGV4dFNpemVbMF07XG4gICAgLy8gc2l6ZVsxXSAqPSAwLjUgKiBjb250ZXh0U2l6ZVsxXTtcbiAgICByZXR1cm4gcmVzdWx0O1xufTtcblxuLyoqXG4gKiBHZXQgdGhlIENTUyByZXByZXNlbnRhdGlvbiBvZiBhIFRyYW5zZm9ybSBtYXRyaXhcbiAqXG4gKiBAbWV0aG9kIHN0cmluZ2lmeU1hdHJpeFxuICpcbiAqIEBwYXJhbSB7QXJyYXl9IG0gVHJhbnNmb3JtIG1hdHJpeFxuICovXG5ET01SZW5kZXJlci5zdHJpbmdpZnlNYXRyaXggPSBmdW5jdGlvbiBzdHJpbmdpZnlNYXRyaXgobSkge1xuICAgIHJldHVybiBNQVRSSVgzRCArXG4gICAgICAgIG1bMF0gICsgQ09NTUEgK1xuICAgICAgICBtWzFdICArIENPTU1BICtcbiAgICAgICAgbVsyXSAgKyBDT01NQSArXG4gICAgICAgIG1bM10gICsgQ09NTUEgK1xuICAgICAgICBtWzRdICArIENPTU1BICtcbiAgICAgICAgbVs1XSAgKyBDT01NQSArXG4gICAgICAgIG1bNl0gICsgQ09NTUEgK1xuICAgICAgICBtWzddICArIENPTU1BICtcbiAgICAgICAgbVs4XSAgKyBDT01NQSArXG4gICAgICAgIG1bOV0gICsgQ09NTUEgK1xuICAgICAgICBtWzEwXSArIENPTU1BICtcbiAgICAgICAgbVsxMV0gKyBDT01NQSArXG4gICAgICAgIG1bMTJdICsgQ09NTUEgK1xuICAgICAgICBtWzEzXSArIENPTU1BICtcbiAgICAgICAgbVsxNF0gKyBDT01NQSArXG4gICAgICAgIG1bMTVdICsgQ0xPU0VfUEFSRU47XG59O1xuXG5cbm1vZHVsZS5leHBvcnRzID0gRE9NUmVuZGVyZXI7XG4iLCIvKiBUaGlzIFNvdXJjZSBDb2RlIEZvcm0gaXMgc3ViamVjdCB0byB0aGUgdGVybXMgb2YgdGhlIE1vemlsbGEgUHVibGljXG4gKiBMaWNlbnNlLCB2LiAyLjAuIElmIGEgY29weSBvZiB0aGUgTVBMIHdhcyBub3QgZGlzdHJpYnV0ZWQgd2l0aCB0aGlzXG4gKiBmaWxlLCBZb3UgY2FuIG9idGFpbiBvbmUgYXQgaHR0cDovL21vemlsbGEub3JnL01QTC8yLjAvLlxuICpcbiAqIE93bmVyczogbWFya0BmYW1vLnVzXG4gKlxuICogQGxpY2Vuc2UgTVBMIDIuMFxuICogQGNvcHlyaWdodCBGYW1vdXMgSW5kdXN0cmllcywgSW5jLiAyMDE0XG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEludGVybmFsIGhlbHBlciBvYmplY3QgdG8gQ29udGFpbmVyIHRoYXQgaGFuZGxlcyB0aGUgcHJvY2VzcyBvZlxuICogICBjcmVhdGluZyBhbmQgYWxsb2NhdGluZyBET00gZWxlbWVudHMgd2l0aGluIGEgbWFuYWdlZCBkaXYuXG4gKiAgIFByaXZhdGUuXG4gKlxuICogQGNsYXNzIEVsZW1lbnRBbGxvY2F0b3JcbiAqIEBjb25zdHJ1Y3RvclxuICpcbiAqIEBwYXJhbSB7RE9NRWxlbWVudH0gY29udGFpbmVyIGRvY3VtZW50IGVsZW1lbnQgaW4gd2hpY2ggRmFtby51cyBjb250ZW50IHdpbGwgYmUgaW5zZXJ0ZWRcbiAqL1xuZnVuY3Rpb24gRWxlbWVudEFsbG9jYXRvcihjb250YWluZXIpIHtcbiAgICBpZiAoIWNvbnRhaW5lcikgY29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xuICAgIHRoaXMuY29udGFpbmVyICAgICA9IGNvbnRhaW5lcjtcbiAgICB0aGlzLmRldGFjaGVkTm9kZXMgPSB7fTtcbiAgICB0aGlzLm5vZGVDb3VudCAgICAgPSAwO1xufVxuXG4vKipcbiAqIEFsbG9jYXRlIGFuIGVsZW1lbnQgb2Ygc3BlY2lmaWVkIHR5cGUgZnJvbSB0aGUgcG9vbC5cbiAqXG4gKiBAbWV0aG9kIGFsbG9jYXRlXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHR5cGUgdHlwZSBvZiBlbGVtZW50LCBlLmcuICdkaXYnXG4gKlxuICogQHJldHVybiB7RE9NRWxlbWVudH0gYWxsb2NhdGVkIGRvY3VtZW50IGVsZW1lbnRcbiAqL1xuRWxlbWVudEFsbG9jYXRvci5wcm90b3R5cGUuYWxsb2NhdGUgPSBmdW5jdGlvbiBhbGxvY2F0ZSh0eXBlKSB7XG4gICAgdHlwZSA9IHR5cGUudG9Mb3dlckNhc2UoKTtcbiAgICBpZiAoISh0eXBlIGluIHRoaXMuZGV0YWNoZWROb2RlcykpIHRoaXMuZGV0YWNoZWROb2Rlc1t0eXBlXSA9IFtdO1xuICAgIHZhciBub2RlU3RvcmUgPSB0aGlzLmRldGFjaGVkTm9kZXNbdHlwZV07XG4gICAgdmFyIHJlc3VsdDtcbiAgICBpZiAobm9kZVN0b3JlLmxlbmd0aCA+IDApIHtcbiAgICAgICAgcmVzdWx0ID0gbm9kZVN0b3JlLnBvcCgpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJlc3VsdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodHlwZSk7XG4gICAgICAgIHRoaXMuY29udGFpbmVyLmFwcGVuZENoaWxkKHJlc3VsdCk7XG4gICAgfVxuICAgIHRoaXMubm9kZUNvdW50Kys7XG4gICAgcmVzdWx0LnN0eWxlLmRpc3BsYXkgPSAnJzsgICAgXG4gICAgcmV0dXJuIHJlc3VsdDtcbn07XG5cbi8qKlxuICogRGUtYWxsb2NhdGUgYW4gZWxlbWVudCBvZiBzcGVjaWZpZWQgdHlwZSB0byB0aGUgcG9vbC5cbiAqXG4gKiBAbWV0aG9kIGRlYWxsb2NhdGVcbiAqXG4gKiBAcGFyYW0ge0RPTUVsZW1lbnR9IGVsZW1lbnQgZG9jdW1lbnQgZWxlbWVudCB0byBkZWFsbG9jYXRlXG4gKi9cbkVsZW1lbnRBbGxvY2F0b3IucHJvdG90eXBlLmRlYWxsb2NhdGUgPSBmdW5jdGlvbiBkZWFsbG9jYXRlKGVsZW1lbnQpIHtcbiAgICB2YXIgbm9kZVR5cGUgPSBlbGVtZW50Lm5vZGVOYW1lLnRvTG93ZXJDYXNlKCk7XG4gICAgdmFyIG5vZGVTdG9yZSA9IHRoaXMuZGV0YWNoZWROb2Rlc1tub2RlVHlwZV07XG4gICAgbm9kZVN0b3JlLnB1c2goZWxlbWVudCk7XG4gICAgZWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgIGVsZW1lbnQuc3R5bGUub3BhY2l0eSA9ICcnO1xuICAgIGVsZW1lbnQuc3R5bGUud2lkdGggICA9ICcnO1xuICAgIGVsZW1lbnQuc3R5bGUuaGVpZ2h0ICA9ICcnO1xuICAgIHRoaXMubm9kZUNvdW50LS07XG59O1xuXG4vKipcbiAqIEdldCBjb3VudCBvZiB0b3RhbCBhbGxvY2F0ZWQgbm9kZXMgaW4gdGhlIGRvY3VtZW50LlxuICpcbiAqIEBtZXRob2QgZ2V0Tm9kZUNvdW50XG4gKlxuICogQHJldHVybiB7TnVtYmVyfSB0b3RhbCBub2RlIGNvdW50XG4gKi9cbkVsZW1lbnRBbGxvY2F0b3IucHJvdG90eXBlLmdldE5vZGVDb3VudCA9IGZ1bmN0aW9uIGdldE5vZGVDb3VudCgpIHtcbiAgICByZXR1cm4gdGhpcy5ub2RlQ291bnQ7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEVsZW1lbnRBbGxvY2F0b3I7IiwiLyogVGhpcyBTb3VyY2UgQ29kZSBGb3JtIGlzIHN1YmplY3QgdG8gdGhlIHRlcm1zIG9mIHRoZSBNb3ppbGxhIFB1YmxpY1xuICogTGljZW5zZSwgdi4gMi4wLiBJZiBhIGNvcHkgb2YgdGhlIE1QTCB3YXMgbm90IGRpc3RyaWJ1dGVkIHdpdGggdGhpc1xuICogZmlsZSwgWW91IGNhbiBvYnRhaW4gb25lIGF0IGh0dHA6Ly9tb3ppbGxhLm9yZy9NUEwvMi4wLy5cbiAqXG4gKiBPd25lcnM6IGFkbmFuQGZhbW8udXMsXG4gKlxuICogQGxpY2Vuc2UgTVBMIDIuMFxuICogQGNvcHlyaWdodCBGYW1vdXMgSW5kdXN0cmllcywgSW5jLiAyMDE0XG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgbW91c2UgICAgICAgICAgPSBbLjUsIC41XTtcbnZhciBzaGFkZXJzICAgICAgICA9IHt9O1xudmFyIHN0YXJ0ICAgICAgICAgID0gRGF0ZS5ub3coKTtcbnZhciBwZXJzcGVjdGl2ZSAgICA9IF9fcGVyc3BlY3RpdmUoW10sIDAsIGlubmVyV2lkdGggLyBpbm5lckhlaWdodCwgLjEsICAxMDAwLik7XG52YXIgRW50aXR5UmVnaXN0cnkgPSByZXF1aXJlKCcuLi9FbnRpdHlSZWdpc3RyeScpO1xudmFyIEVuZ2luZSAgICAgICAgID0gcmVxdWlyZSgnLi4vRW5naW5lJyk7XG52YXIgR2VvbWV0cnkgICAgICAgPSByZXF1aXJlKCcuLi8uLi9nbC9nZW9tZXRyeScpO1xudmFyIGxpZ2h0TGlzdCAgICAgID0gRW50aXR5UmVnaXN0cnkuZ2V0TGF5ZXIoJ0xpZ2h0cycpO1xuXG52YXIgYXBwZW5kZWQgPSBmYWxzZTtcbnZhciBnbDtcblxudmFyIHZlcnRleFdyYXBwZXIgPSBbXG4gICAgJy8vZGVmaW5lX3ZzJyxcblxuICAgICd2ZWM0IHBpcGVsaW5lX3BvcyhpbiB2ZWM0IHBvcykgeycsXG4gICAgJyAgICAvL2FwcGx5X3ZzJywgXG4gICAgJyAgICBwb3MgPSB0cmFuc2Zvcm0gKiBwZXJzcGVjdGl2ZSAqIHBvczsnLCAgICBcbiAgICAnICAgIHBvcy55ICo9IC0xLjsnLCAgICBcbiAgICAnICAgIHJldHVybiBwb3M7JywgIFxuICAgICd9JyxcblxuICAgICd2b2lkIG1haW4oKSB7JyxcbiAgICAnICAgIHZfbm9ybWFsID0gYV9ub3JtYWw7JyxcbiAgICAnICAgIGdsX1Bvc2l0aW9uID0gcGlwZWxpbmVfcG9zKGFfcG9zKTsnLFxuICAgICd9J1xuXS5qb2luKCdcXG4nKTtcblxudmFyIGZyYWdtZW50V3JhcHBlciA9IFtcbiAgICAnLy9kZWZpbmVfZnMnLCAgXG4gICAgJ3ZlYzQgcGlwZWxpbmVfY29sb3IoaW4gdmVjNCBjb2xvcikgeycsXG4gICAgJyAgICAvL2FwcGx5X2ZzJywgIFxuICAgICcgICAgcmV0dXJuIGNvbG9yOycsIFxuICAgICd9JyxcblxuICAgICd2b2lkIG1haW4oKSB7JyxcbiAgICAnICAgIHZlYzQgY29sb3I7JyxcbiAgICAnICAgIGNvbG9yID0gdmVjNCh2X25vcm1hbCwgMS4pOycsXG4gICAgJyAgICBnbF9GcmFnQ29sb3IgPSB2ZWM0KDEpOycsXG4gICAgJ30nXG5dLmpvaW4oJ1xcbicpO1xuXG52YXIgV2ViR0xSZW5kZXJlciA9IHtcbiAgICBkcmF3OiBkcmF3LFxuICAgIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgZ2VvbSA9IEVudGl0eVJlZ2lzdHJ5LmdldExheWVyKCdHZW9tZXRyaWVzJyk7XG4gICAgICAgIChnZW9tID8gZ2VvbS5lbnRpdGllcyA6IFtdKS5mb3JFYWNoKGZ1bmN0aW9uIChnZW9tKSB7XG4gICAgICAgICAgICB2YXIgYyA9IGdlb20uZ2V0Q29udGV4dCgpLmdldENvbXBvbmVudCgnY2FtZXJhJyk7XG4gICAgICAgICAgICBpZiAoYykgIHRoaXMuc2hhZGVyLnVuaWZvcm1zKHsgcGVyc3BlY3RpdmU6ICBjLmdldFByb2plY3Rpb25UcmFuc2Zvcm0oKSB9KTtcbiAgICAgICAgICAgIHRoaXMuZHJhdyhnZW9tLl9jb21wb25lbnRzLmdlb21ldHJ5LnJlbmRlcigpLCB7X3NpemU6IFtpbm5lcldpZHRoLCBpbm5lckhlaWdodCwgMTBdfSApO1xuICAgICAgICB9LmJpbmQodGhpcykpO1xuICAgIH0sXG4gICAgZGVwbG95OiBmdW5jdGlvbiAoKSB7fSxcbiAgICB1cGRhdGU6IGZ1bmN0aW9uICgpIHt9LFxuICAgIHNldE9wdGlvbnM6IGZ1bmN0aW9uKCkge30sXG4gICAgREVGQVVMVF9PUFRJT05TOiB7fSxcbiAgICByZWNhbGw6IGZ1bmN0aW9uICgpIHt9LFxuICAgIGdldFRhcmdldHM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIFtHZW9tZXRyeS50b1N0cmluZygpXTtcbiAgICB9LFxuICAgIGluaXQ6IGluaXRcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gV2ViR0xSZW5kZXJlcjtcblxuZnVuY3Rpb24gZHJhdyhzcGVjLCBjb250YWluZXIpIHtcbiAgICBpZiAoIWFwcGVuZGVkKSBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGdsLmNhbnZhcyk7XG4gICAgaWYgKCEgc3BlYy50ZXh0dXJlKSBkZWxldGUgc3BlYy50ZXh0dXJlO1xuXG4gICAgaWYgKHNwZWMuY2h1bmtUZXN0KSB0aGlzLnNoYWRlciA9IG1lcmdlUGlwZWxpbmUuY2FsbCh0aGlzLCBzcGVjKTtcbiAgICBpZiAoc3BlYy5mc0NodW5rKSB0aGlzLnNoYWRlciA9IG1lcmdlUGlwZWxpbmUuY2FsbCh0aGlzLCBzcGVjLCB0cnVlKTtcblxuICAgIHNwZWMubW91c2UgPSBtb3VzZTtcbiAgICBzcGVjLnJlc29sdXRpb24gPSBjb250YWluZXIuX3NpemU7XG4gICAgc3BlYy5jbG9jayA9IChEYXRlLm5vdygpIC0gc3RhcnQpIC8gMTAwO1xuICAgIGlmICghIHNwZWMubm9pc2UpIHNwZWMubm9pc2UgPSAwO1xuICAgIHRoaXMuc2hhZGVyLnVuaWZvcm1zKHNwZWMpLmRyYXcoc3BlYy5nZW9tZXRyeSk7XG59XG5cbmZ1bmN0aW9uIGluaXQoKSB7XG4gICAgdmFyIG9wdGlvbnMgPSB7IGFscGhhOiB0cnVlIH07XG4gICAgdmFyIGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgIGdsID0gd2luZG93LmdsID0gY2FudmFzLmdldENvbnRleHQoJ3dlYmdsJywgb3B0aW9ucyk7XG5cbiAgICBpZiAoISBnbCkgdGhyb3cgJ1dlYkdMIG5vdCBzdXBwb3J0ZWQnO1xuXG4gICAgdGhpcy5TaGFkZXJNYWtlciA9IHJlcXVpcmUoJy4uLy4uL2dsL3NoYWRlcicpKGdsKTtcblxuICAgIHRoaXMuc2hhZGVyID0gbmV3IHRoaXMuU2hhZGVyTWFrZXIodmVydGV4V3JhcHBlciwgZnJhZ21lbnRXcmFwcGVyKTtcbiAgICB3aW5kb3cub25tb3VzZW1vdmUgPSBmdW5jdGlvbihlKSB7XG4gICAgICAgIG1vdXNlID0gW2UueCAvIGlubmVyV2lkdGgsIDEuIC0gZS55IC9pbm5lckhlaWdodF07XG4gICAgfTtcblxuICAgIGdsLmVuYWJsZShnbC5QT0xZR09OX09GRlNFVF9GSUxMKTtcbiAgICBnbC5wb2x5Z29uT2Zmc2V0KDEsIDEpO1xuICAgIGdsLmVuYWJsZShnbC5ERVBUSF9URVNUKTtcbiAgICBnbC5jYW52YXMuY2xhc3NOYW1lID0gJ0dMJztcbiAgICBnbC5jYW52YXMud2lkdGggPSB3aW5kb3cuaW5uZXJXaWR0aDtcbiAgICBnbC5jYW52YXMuaGVpZ2h0ID0gd2luZG93LmlubmVySGVpZ2h0O1xuICAgIGdsLnZpZXdwb3J0KDAsIDAsIGdsLmNhbnZhcy53aWR0aCwgZ2wuY2FudmFzLmhlaWdodCk7XG59XG5cbmZ1bmN0aW9uIF9fcGVyc3BlY3RpdmUob3V0LCBmb3Z5LCBhc3BlY3QsIG5lYXIsIGZhcikge1xuICAgIHZhciBmID0gMS4wIC8gTWF0aC50YW4oZm92eSAvIDIpLFxuICAgICAgICBuZiA9IDEgLyAobmVhciAtIGZhcik7XG4gICAgb3V0WzBdID0gZiAvIGFzcGVjdDtcbiAgICBvdXRbMV0gPSAwO1xuICAgIG91dFsyXSA9IDA7XG4gICAgb3V0WzNdID0gMDtcbiAgICBvdXRbNF0gPSAwO1xuICAgIG91dFs1XSA9IGY7XG4gICAgb3V0WzZdID0gMDtcbiAgICBvdXRbN10gPSAwO1xuICAgIG91dFs4XSA9IDA7XG4gICAgb3V0WzldID0gMDtcbiAgICBvdXRbMTBdID0gKGZhciArIG5lYXIpICogbmY7XG4gICAgb3V0WzExXSA9IC0xO1xuICAgIG91dFsxMl0gPSAwO1xuICAgIG91dFsxM10gPSAwO1xuICAgIG91dFsxNF0gPSAoMiAqIGZhciAqIG5lYXIpICogbmY7XG4gICAgb3V0WzE1XSA9IDA7XG4gICAgcmV0dXJuIG91dDtcbn07XG52YXIgb25jZSA9IDA7XG5mdW5jdGlvbiBtZXJnZVBpcGVsaW5lKHNwZWMsIHNoYWRlciwgZmxhZykge1xuICAgIHNwZWMuY2h1bmtUZXN0ID0gZmFsc2U7XG4gICAgaWYgKGZsYWcpXG4gICAgdGhpcy5zaGFkZXIudnMgPSB0aGlzLnNoYWRlci52c1xuICAgICAgICAucmVwbGFjZSgnLy9kZWZpbmVfdnMnLCBzcGVjLmNodW5rTm9pc2UuZGVmaW5lcylcbiAgICAgICAgLnJlcGxhY2UoJy8vYXBwbHlfZnMnLCBzcGVjLmNodW5rTm9pc2UuYXBwbHkpO1xuICAgIGVsc2UgdGhpcy5zaGFkZXIuZnMgPSB0aGlzLnNoYWRlci5mcy5yZXBsYWNlKCcvL2FwcGx5X2ZzJywgc3BlYy5mc0NodW5rKTtcbiAgICBpZihvbmNlKSByZXR1cm4gdGhpcy5zaGFkZXI7XG4gICAgb25jZSArKztcbiAgICBcbiAgICByZXR1cm4gbmV3IHRoaXMuU2hhZGVyTWFrZXIodGhpcy5zaGFkZXIudnMsIHRoaXMuc2hhZGVyLmZzKTtcbn1cbiIsInZhciBjc3MgPSBcInZhciBjc3MgPSBcXFwiLyogVGhpcyBTb3VyY2UgQ29kZSBGb3JtIGlzIHN1YmplY3QgdG8gdGhlIHRlcm1zIG9mIHRoZSBNb3ppbGxhIFB1YmxpY1xcXFxuICogTGljZW5zZSwgdi4gMi4wLiBJZiBhIGNvcHkgb2YgdGhlIE1QTCB3YXMgbm90IGRpc3RyaWJ1dGVkIHdpdGggdGhpc1xcXFxuICogZmlsZSwgWW91IGNhbiBvYnRhaW4gb25lIGF0IGh0dHA6Ly9tb3ppbGxhLm9yZy9NUEwvMi4wLy5cXFxcbiAqXFxcXG4gKiBPd25lcjogbWFya0BmYW1vLnVzXFxcXG4gKiBAbGljZW5zZSBNUEwgMi4wXFxcXG4gKiBAY29weXJpZ2h0IEZhbW91cyBJbmR1c3RyaWVzLCBJbmMuIDIwMTRcXFxcbiAqL1xcXFxuXFxcXG5cXFxcbmh0bWwge1xcXFxuICAgIHdpZHRoOiAxMDAlO1xcXFxuICAgIGhlaWdodDogMTAwJTtcXFxcbiAgICBtYXJnaW46IDBweDtcXFxcbiAgICBwYWRkaW5nOiAwcHg7XFxcXG4gICAgb3ZlcmZsb3c6IGhpZGRlbjtcXFxcbiAgICAtd2Via2l0LXRyYW5zZm9ybS1zdHlsZTogcHJlc2VydmUtM2Q7XFxcXG4gICAgdHJhbnNmb3JtLXN0eWxlOiBwcmVzZXJ2ZS0zZDtcXFxcbn1cXFxcblxcXFxuYm9keSB7XFxcXG4gICAgcG9zaXRpb246IGFic29sdXRlO1xcXFxuICAgIHdpZHRoOiAxMDAlO1xcXFxuICAgIGhlaWdodDogMTAwJTtcXFxcbiAgICBtYXJnaW46IDBweDtcXFxcbiAgICBwYWRkaW5nOiAwcHg7XFxcXG4gICAgLXdlYmtpdC10cmFuc2Zvcm0tc3R5bGU6IHByZXNlcnZlLTNkO1xcXFxuICAgIHRyYW5zZm9ybS1zdHlsZTogcHJlc2VydmUtM2Q7XFxcXG4gICAgLXdlYmtpdC1mb250LXNtb290aGluZzogYW50aWFsaWFzZWQ7XFxcXG4gICAgLXdlYmtpdC10YXAtaGlnaGxpZ2h0LWNvbG9yOiB0cmFuc3BhcmVudDtcXFxcbiAgICAtd2Via2l0LXBlcnNwZWN0aXZlOiAwO1xcXFxuICAgIHBlcnNwZWN0aXZlOiBub25lO1xcXFxuICAgIG92ZXJmbG93OiBoaWRkZW47XFxcXG59XFxcXG5cXFxcbi5mYW1vdXMtY29udGFpbmVyLCAuZmFtb3VzLWdyb3VwIHtcXFxcbiAgICBwb3NpdGlvbjogYWJzb2x1dGU7XFxcXG4gICAgdG9wOiAwcHg7XFxcXG4gICAgbGVmdDogMHB4O1xcXFxuICAgIGJvdHRvbTogMHB4O1xcXFxuICAgIHJpZ2h0OiAwcHg7XFxcXG4gICAgb3ZlcmZsb3c6IHZpc2libGU7XFxcXG4gICAgLXdlYmtpdC10cmFuc2Zvcm0tc3R5bGU6IHByZXNlcnZlLTNkO1xcXFxuICAgIHRyYW5zZm9ybS1zdHlsZTogcHJlc2VydmUtM2Q7XFxcXG4gICAgLXdlYmtpdC1iYWNrZmFjZS12aXNpYmlsaXR5OiB2aXNpYmxlO1xcXFxuICAgIGJhY2tmYWNlLXZpc2liaWxpdHk6IHZpc2libGU7XFxcXG4gICAgcG9pbnRlci1ldmVudHM6IG5vbmU7XFxcXG59XFxcXG5cXFxcbi5mYW1vdXMtZ3JvdXAge1xcXFxuICAgIHdpZHRoOiAwcHg7XFxcXG4gICAgaGVpZ2h0OiAwcHg7XFxcXG4gICAgbWFyZ2luOiAwcHg7XFxcXG4gICAgcGFkZGluZzogMHB4O1xcXFxuICAgIC13ZWJraXQtdHJhbnNmb3JtLXN0eWxlOiBwcmVzZXJ2ZS0zZDtcXFxcbiAgICB0cmFuc2Zvcm0tc3R5bGU6IHByZXNlcnZlLTNkO1xcXFxufVxcXFxuXFxcXG4uZmEtc3VyZmFjZSB7XFxcXG4gICAgcG9zaXRpb246IGFic29sdXRlO1xcXFxuICAgIC13ZWJraXQtdHJhbnNmb3JtLW9yaWdpbjogMCUgMCU7XFxcXG4gICAgdHJhbnNmb3JtLW9yaWdpbjogMCUgMCU7XFxcXG4gICAgLXdlYmtpdC1iYWNrZmFjZS12aXNpYmlsaXR5OiB2aXNpYmxlO1xcXFxuICAgIGJhY2tmYWNlLXZpc2liaWxpdHk6IHZpc2libGU7XFxcXG4gICAgLXdlYmtpdC10cmFuc2Zvcm0tc3R5bGU6IGZsYXQ7XFxcXG4gICAgdHJhbnNmb3JtLXN0eWxlOiBwcmVzZXJ2ZS0zZDsgLyogcGVyZm9ybWFuY2UgKi9cXFxcbi8qICAgIC13ZWJraXQtYm94LXNpemluZzogYm9yZGVyLWJveDtcXFxcbiAgICAtbW96LWJveC1zaXppbmc6IGJvcmRlci1ib3g7Ki9cXFxcbiAgICAtd2Via2l0LXRhcC1oaWdobGlnaHQtY29sb3I6IHRyYW5zcGFyZW50O1xcXFxuICAgIHBvaW50ZXItZXZlbnRzOiBhdXRvO1xcXFxuXFxcXG59XFxcXG5cXFxcbi5mYW1vdXMtY29udGFpbmVyLWdyb3VwIHtcXFxcbiAgICBwb3NpdGlvbjogcmVsYXRpdmU7XFxcXG4gICAgd2lkdGg6IDEwMCU7XFxcXG4gICAgaGVpZ2h0OiAxMDAlO1xcXFxufVxcXFxuXFxcXG4uZmEtY29udGFpbmVyIHtcXFxcbiAgICBwb3NpdGlvbjogYWJzb2x1dGU7XFxcXG4gICAgLXdlYmtpdC10cmFuc2Zvcm0tb3JpZ2luOiBjZW50ZXIgY2VudGVyO1xcXFxuICAgIHRyYW5zZm9ybS1vcmlnaW46IGNlbnRlciBjZW50ZXI7XFxcXG4gICAgb3ZlcmZsb3c6IGhpZGRlbjtcXFxcbn1cXFxcblxcXFxuY2FudmFzLkdMIHtcXFxcbiAgICBwb2ludGVyLWV2ZW50czogbm9uZTtcXFxcbiAgICBwb3NpdGlvbjogYWJzb2x1dGU7XFxcXG4gICAgb3BhY2l0eTogLjc7XFxcXG4gICAgei1pbmRleDogOTk5OTtcXFxcbiAgICB0b3A6IDBweDtcXFxcbiAgICBsZWZ0OiAwcHg7XFxcXG59XFxcXG5cXFwiOyAocmVxdWlyZShcXFwiL1VzZXJzL2Z0cmlwaWVyL0NvZGUvR2FtZXMvT25lL25vZGVfbW9kdWxlcy9jc3NpZnlcXFwiKSkoY3NzKTsgbW9kdWxlLmV4cG9ydHMgPSBjc3M7XCI7IChyZXF1aXJlKFwiL1VzZXJzL2Z0cmlwaWVyL0NvZGUvR2FtZXMvT25lL25vZGVfbW9kdWxlcy9jc3NpZnlcIikpKGNzcyk7IG1vZHVsZS5leHBvcnRzID0gY3NzOyIsIi8qIFRoaXMgU291cmNlIENvZGUgRm9ybSBpcyBzdWJqZWN0IHRvIHRoZSB0ZXJtcyBvZiB0aGUgTW96aWxsYSBQdWJsaWNcbiAqIExpY2Vuc2UsIHYuIDIuMC4gSWYgYSBjb3B5IG9mIHRoZSBNUEwgd2FzIG5vdCBkaXN0cmlidXRlZCB3aXRoIHRoaXNcbiAqIGZpbGUsIFlvdSBjYW4gb2J0YWluIG9uZSBhdCBodHRwOi8vbW96aWxsYS5vcmcvTVBMLzIuMC8uXG4gKlxuICogT3duZXJzOiBkYW5AZmFtby51c1xuICogICAgICAgICBmZWxpeEBmYW1vLnVzXG4gKiAgICAgICAgIG1pa2VAZmFtby51c1xuICpcbiAqIEBsaWNlbnNlIE1QTCAyLjBcbiAqIEBjb3B5cmlnaHQgRmFtb3VzIEluZHVzdHJpZXMsIEluYy4gMjAxNFxuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIEVudGl0eVJlZ2lzdHJ5ID0gcmVxdWlyZSgnLi4vRW50aXR5UmVnaXN0cnknKTtcbnZhciByZW5kZXJOb2RlcyAgICA9IEVudGl0eVJlZ2lzdHJ5LmdldExheWVyKCdldmVyeXRoaW5nJyk7XG5cbi8qKlxuICogQSBzeXN0ZW0gdGhhdCB3aWxsIHJ1biBvdmVyIGN1c3RvbSBjb21wb25lbnRzIHRoYXQgaGF2ZSBhblxuICogICB1cGRhdGUgZnVuY3Rpb24uXG4gKlxuICogQGNsYXNzIEJlaGF2aW9yU3lzdGVtXG4gKiBAc3lzdGVtXG4gKiBAc2luZ2xldG9uXG4gKi9cbnZhciBCZWhhdmlvclN5c3RlbSA9IHt9O1xuXG4vKipcbiAqIFVwZGF0ZSB3aWxsIGl0ZXJhdGUgb3ZlciBhbGwgb2YgdGhlIGVudGl0aWVzIGFuZCBjYWxsXG4gKiAgIGVhY2ggb2YgdGhlaXIgdXBkYXRlIGZ1bmN0aW9ucy5cbiAqXG4gKiBAbWV0aG9kIHVwZGF0ZVxuICovXG5CZWhhdmlvclN5c3RlbS51cGRhdGUgPSBmdW5jdGlvbiB1cGRhdGUoKSB7XG4gICAgdmFyIGkgPSByZW5kZXJOb2Rlcy5sZW5ndGg7XG5cbiAgICB3aGlsZSAoaS0tKVxuICAgICAgICBpZiAocmVuZGVyTm9kZXMuZW50aXRpZXNbaV0udXBkYXRlKVxuICAgICAgICAgICAgcmVuZGVyTm9kZXMuZW50aXRpZXNbaV0udXBkYXRlKCk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEJlaGF2aW9yU3lzdGVtO1xuXG4iLCIvKiBUaGlzIFNvdXJjZSBDb2RlIEZvcm0gaXMgc3ViamVjdCB0byB0aGUgdGVybXMgb2YgdGhlIE1vemlsbGEgUHVibGljXG4gKiBMaWNlbnNlLCB2LiAyLjAuIElmIGEgY29weSBvZiB0aGUgTVBMIHdhcyBub3QgZGlzdHJpYnV0ZWQgd2l0aCB0aGlzXG4gKiBmaWxlLCBZb3UgY2FuIG9idGFpbiBvbmUgYXQgaHR0cDovL21vemlsbGEub3JnL01QTC8yLjAvLlxuICpcbiAqIE93bmVyczogZGFuQGZhbW8udXNcbiAqICAgICAgICAgZmVsaXhAZmFtby51c1xuICogICAgICAgICBtaWtlQGZhbW8udXNcbiAqXG4gKiBAbGljZW5zZSBNUEwgMi4wXG4gKiBAY29weXJpZ2h0IEZhbW91cyBJbmR1c3RyaWVzLCBJbmMuIDIwMTRcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBFbnRpdHlSZWdpc3RyeSA9IHJlcXVpcmUoJy4uL0VudGl0eVJlZ2lzdHJ5Jyk7XG52YXIgcm9vdHMgICAgICAgICAgPSBFbnRpdHlSZWdpc3RyeS5hZGRMYXllcignQ29udGV4dHMnKTtcblxuLyoqXG4gKiBDb3JlU3lzdGVtIGlzIHJlc3BvbnNpYmxlIGZvciB0cmF2ZXJzaW5nIHRoZSBzY2VuZSBncmFwaCBhbmRcbiAqICAgdXBkYXRpbmcgdGhlIFRyYW5zZm9ybXMgb2YgdGhlIGVudGl0aWVzLlxuICpcbiAqIEBjbGFzcyAgQ29yZVN5c3RlbVxuICogQHN5c3RlbVxuICogQHNpbmdsZXRvblxuICovXG52YXIgQ29yZVN5c3RlbSA9IHt9O1xuXG4vKipcbiAqIHVwZGF0ZSBpdGVyYXRlcyBvdmVyIGVhY2ggb2YgdGhlIENvbnRleHRzIHRoYXQgd2VyZSByZWdpc3RlcmVkIGFuZFxuICogICBraWNrcyBvZiB0aGUgcmVjdXJzaXZlIHVwZGF0aW5nIG9mIHRoZWlyIGVudGl0aWVzLlxuICpcbiAqIEBtZXRob2QgdXBkYXRlXG4gKi9cbkNvcmVTeXN0ZW0udXBkYXRlID0gZnVuY3Rpb24gdXBkYXRlKCkge1xuICAgIHJvb3RzLmZvckVhY2goY29yZVVwZGF0ZUFuZEZlZWQpO1xufTtcblxuLyoqXG4gKiBjb3JlVXBkYXRlQW5kRmVlZCBmZWVkcyBwYXJlbnQgaW5mb3JtYXRpb24gdG8gYW4gZW50aXR5IGFuZCBzbyB0aGF0XG4gKiAgIGVhY2ggZW50aXR5IGNhbiB1cGRhdGUgdGhlaXIgdHJhbnNmb3JtLiAgSXQgd2lsbCB0aGVuIHBhc3MgZG93blxuICogICBpbnZhbGlkYXRpb24gc3RhdGVzIGFuZCB2YWx1ZXMgdG8gYW55IGNoaWxkcmVuLlxuICpcbiAqIEBtZXRob2QgY29yZVVwZGF0ZUFuZEZlZWRcbiAqIEBwcml2YXRlXG4gKiAgIFxuICogQHBhcmFtICB7RW50aXR5fSAgZW50aXR5ICAgICAgICAgICBFbnRpdHkgaW4gdGhlIHNjZW5lIGdyYXBoXG4gKiBAcGFyYW0gIHtOdW1iZXJ9ICB0cmFuc2Zvcm1SZXBvcnQgIGJpdFNjaGVtZSByZXBvcnQgb2YgdHJhbnNmb3JtIGludmFsaWRhdGlvbnNcbiAqIEBwYXJhbSAge0FycmF5fSAgIGluY29taW5nTWF0cml4ICAgcGFyZW50IHRyYW5zZm9ybSBhcyBhIEZsb2F0MzIgQXJyYXlcbiAqL1xuZnVuY3Rpb24gY29yZVVwZGF0ZUFuZEZlZWQoZW50aXR5LCB0cmFuc2Zvcm1SZXBvcnQsIGluY29taW5nTWF0cml4KSB7XG4gICAgdmFyIHRyYW5zZm9ybSA9IGVudGl0eS5nZXRDb21wb25lbnQoJ3RyYW5zZm9ybScpO1xuICAgIHZhciBpICAgICAgICAgPSBlbnRpdHkuX2NoaWxkcmVuLmxlbmd0aDtcblxuICAgIC8vIFVwZGF0ZSB0aGUgVHJhbnNmb3JtIGJhc2VkIG9uIHBhcmVudCBpbnZhbGlkYXRpb25zXG4gICAgdHJhbnNmb3JtUmVwb3J0ID0gdHJhbnNmb3JtLl91cGRhdGUodHJhbnNmb3JtUmVwb3J0LCBpbmNvbWluZ01hdHJpeCk7XG5cbiAgICB3aGlsZSAoaS0tKSBjb3JlVXBkYXRlQW5kRmVlZChlbnRpdHkuX2NoaWxkcmVuW2ldLCB0cmFuc2Zvcm1SZXBvcnQsIHRyYW5zZm9ybS5fbWF0cml4KTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBDb3JlU3lzdGVtO1xuIiwiLyogVGhpcyBTb3VyY2UgQ29kZSBGb3JtIGlzIHN1YmplY3QgdG8gdGhlIHRlcm1zIG9mIHRoZSBNb3ppbGxhIFB1YmxpY1xuICogTGljZW5zZSwgdi4gMi4wLiBJZiBhIGNvcHkgb2YgdGhlIE1QTCB3YXMgbm90IGRpc3RyaWJ1dGVkIHdpdGggdGhpc1xuICogZmlsZSwgWW91IGNhbiBvYnRhaW4gb25lIGF0IGh0dHA6Ly9tb3ppbGxhLm9yZy9NUEwvMi4wLy5cbiAqXG4gKiBPd25lcnM6IGRhbkBmYW1vLnVzXG4gKiAgICAgICAgIGZlbGl4QGZhbW8udXNcbiAqICAgICAgICAgbWlrZUBmYW1vLnVzXG4gKlxuICogQGxpY2Vuc2UgTVBMIDIuMFxuICogQGNvcHlyaWdodCBGYW1vdXMgSW5kdXN0cmllcywgSW5jLiAyMDE0XG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgRW50aXR5UmVnaXN0cnkgPSByZXF1aXJlKCcuLi9FbnRpdHlSZWdpc3RyeScpLFxuICAgIE1hdHJpeE1hdGggICAgID0gcmVxdWlyZSgnLi4vLi4vbWF0aC80eDRtYXRyaXgnKSxcbiAgICBPcHRpb25zTWFuYWdlciA9IHJlcXVpcmUoJy4uL09wdGlvbnNNYW5hZ2VyJyk7XG5cbnZhciByZW5kZXJlcnMgICAgICAgICAgPSB7fSxcbiAgICB0YXJnZXRzVG9SZW5kZXJlcnMgPSB7fTtcblxudmFyIGNvbnRhaW5lcnMgID0gRW50aXR5UmVnaXN0cnkuYWRkTGF5ZXIoJ0hhc0NvbnRhaW5lcicpLFxuICAgIHJlbmRlcmFibGVzID0gRW50aXR5UmVnaXN0cnkuYWRkTGF5ZXIoJ1JlbmRlcmFibGVzJyk7XG5cbnZhciB0b0RlcGxveSA9IFtdO1xuXG5jb250YWluZXJzLm9uKCdlbnRpdHlQdXNoZWQnLCBkZXBsb3lDb250YWluZXIpO1xuY29udGFpbmVycy5vbignZW50aXR5UmVtb3ZlZCcsIHJlY2FsbENvbnRhaW5lcik7XG5cbnZhciBjb250YWluZXJUb1RhcmdldHMgPSB7fTtcblxuZnVuY3Rpb24gZGVwbG95Q29udGFpbmVyKGVudGl0eSkge1xuICAgIGlmIChlbnRpdHkuZ2V0Q29udGV4dCgpKSByZW5kZXJlcnMuRE9NLmRlcGxveUNvbnRhaW5lcihlbnRpdHkpO1xuICAgIGVsc2UgICAgICAgICAgICAgICAgICAgICB0b0RlcGxveS5wdXNoKGVudGl0eSk7IC8vIFRPRE8gVGhpcyBpcyB0ZW1wb3JhcnkgYW5kIGl0IHN1Y2tzXG59XG5cbmZ1bmN0aW9uIHJlY2FsbENvbnRhaW5lcihlbnRpdHkpIHtcbiAgICByZW5kZXJlcnMuRE9NLnJlY2FsbENvbnRhaW5lcihlbnRpdHkpO1xufVxuXG5mdW5jdGlvbiBfcmVsZXZlbnRUb1JlbmRlcmVyKHJlbmRlcmVyLCBlbnRpdHkpIHtcbiAgICB2YXIgdGFyZ2V0cyA9IHJlbmRlcmVyLmdldFRhcmdldHMoKTtcbiAgICB2YXIgaiAgICAgICA9IHRhcmdldHMubGVuZ3RoO1xuICAgIHdoaWxlIChqLS0pIGlmIChlbnRpdHkuaGFzQ29tcG9uZW50KHRhcmdldHNbal0pKSByZXR1cm4gdHJ1ZTtcbiAgICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIF9yZWxldmVudFRvQW55UmVuZGVyZXIoZW50aXR5KSB7XG4gICAgdmFyIHJlbmRlcmVyTmFtZXMgPSBPYmplY3Qua2V5cyhyZW5kZXJlcnMpLFxuICAgICAgICBpICAgICAgICAgICAgID0gcmVuZGVyZXJOYW1lcy5sZW5ndGg7XG5cbiAgICB3aGlsZSAoaS0tKSBpZiAoX3JlbGV2ZW50VG9SZW5kZXJlcihyZW5kZXJlcnNbcmVuZGVyZXJOYW1lc1tpXV0sIGVudGl0eSkpIHJldHVybiB0cnVlO1xuICAgIHJldHVybiBmYWxzZTtcbn1cblxudmFyIHZlcnRleFNjcmF0Y2ggPSBuZXcgRmxvYXQzMkFycmF5KFswLCAwLCAwLCAwXSksXG4gICAgbWF0cml4U2NyYXRjaCA9IG5ldyBGbG9hdDMyQXJyYXkoWzEsIDAsIDAsIDAsIDAsIDEsIDAsIDAsIDAsIDAsIDEsIDAsIDAsIDAsIDAsIDFdKTtcblxuLy8gVmVydGV4IGN1bGxpbmcgbG9naWNcbmZ1bmN0aW9uIF9pc1dpdGhpbih0YXJnZXQsIGVudGl0eSwgY29udGFpbmVyKSB7XG4gICAgLy8gdmFyIHZlcnRpY2llcyAgID0gdGFyZ2V0LmdldFZlcnRpY2llcygpLFxuICAgIC8vICAgICBpICAgICAgICAgICA9IHZlcnRpY2llcy5sZW5ndGgsXG4gICAgLy8gICAgIHYgICAgICAgICAgID0gbnVsbCxcbiAgICAvLyAgICAgb3JpZ2luICAgICAgPSB2b2lkIDAsXG4gICAgLy8gICAgIGlzSW5zaWRlICAgID0gZmFsc2UsXG4gICAgLy8gICAgIGRpc3BsYXlTaXplID0gY29udGFpbmVyLmdldENvbXBvbmVudCgnc2l6ZScpLmdldEdsb2JhbFNpemUoKSxcbiAgICAvLyAgICAgeCAgICAgICAgICAgPSAwLFxuICAgIC8vICAgICB5ICAgICAgICAgICA9IDAsXG4gICAgLy8gICAgIHNpemUgICAgICAgID0gZW50aXR5LmdldENvbXBvbmVudCgnc2l6ZScpLmdldEdsb2JhbFNpemUoKSxcbiAgICAvLyAgICAgZnQgICAgICAgICAgPSBNYXRyaXhNYXRoLm11bHRpcGx5KG1hdHJpeFNjcmF0Y2gsXG4gICAgLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250YWluZXIuZ2V0Q29tcG9uZW50KCdjb250YWluZXInKS5nZXREaXNwbGF5TWF0cml4KCksIFxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW50aXR5LmdldENvbXBvbmVudCgndHJhbnNmb3JtJykuZ2V0R2xvYmFsTWF0cml4KCkpO1xuXG4gICAgLy8gd2hpbGUgKCFpc0luc2lkZSAmJiBpLS0pIHtcbiAgICAvLyAgICAgdiA9IHZlcnRpY2llc1tpXTtcbiAgICAvLyAgICAgaWYgKHRhcmdldC5nZXRPcmlnaW4pIHtcbiAgICAvLyAgICAgICAgIG9yaWdpbiAgPSB0YXJnZXQuZ2V0T3JpZ2luKCk7XG4gICAgLy8gICAgICAgICB2WzBdICAgLT0gc2l6ZVswXSAqIG9yaWdpblswXTtcbiAgICAvLyAgICAgICAgIHZbMV0gICAtPSBzaXplWzFdICogb3JpZ2luWzFdO1xuICAgIC8vICAgICB9XG4gICAgLy8gICAgIE1hdHJpeE1hdGguYXBwbHlUb1ZlY3Rvcih2ZXJ0ZXhTY3JhdGNoLCBmdCwgdik7XG4gICAgLy8gICAgIGlmIChvcmlnaW4pIHtcbiAgICAvLyAgICAgICAgIHZbMF0gKz0gc2l6ZVswXSAqIG9yaWdpblswXTtcbiAgICAvLyAgICAgICAgIHZbMV0gKz0gc2l6ZVsxXSAqIG9yaWdpblsxXTtcbiAgICAvLyAgICAgfVxuICAgIC8vICAgICB4ID0gdmVydGV4U2NyYXRjaFswXSAvIHZlcnRleFNjcmF0Y2hbM107XG4gICAgLy8gICAgIHkgPSB2ZXJ0ZXhTY3JhdGNoWzFdIC8gdmVydGV4U2NyYXRjaFszXTtcbiAgICAvLyAgICAgaXNJbnNpZGUgPSB4IDw9ICggZGlzcGxheVNpemVbMF0gLyAyKSAmJlxuICAgIC8vICAgICAgICAgICAgICAgIHkgPD0gKCBkaXNwbGF5U2l6ZVsxXSAvIDIpICYmXG4gICAgLy8gICAgICAgICAgICAgICAgeCA+PSAoLWRpc3BsYXlTaXplWzBdIC8gMikgJiZcbiAgICAvLyAgICAgICAgICAgICAgICB5ID49ICgtZGlzcGxheVNpemVbMV0gLyAyKTtcbiAgICAvLyB9IFxuICAgIC8vIHJldHVybiBpc0luc2lkZTtcbiAgICByZXR1cm4gdHJ1ZTtcbn1cblxuLyoqXG4gKiBSZW5kZXJTeXN0ZW0gaXMgcmVzcG9uc2libGUgZm9yIGtlZXBpbmcgdHJhY2sgb2YgdGhlIHZhcmlvdXMgcmVuZGVyZXJzXG4gKiAgYW5kIGZlZWRpbmcgdGhlbSBcbiAqXG4gKlxuICogQGNsYXNzIFJlbmRlclN5c3RlbVxuICogQHN5c3RlbVxuICovXG52YXIgUmVuZGVyU3lzdGVtID0ge307XG5cblJlbmRlclN5c3RlbS51cGRhdGUgPSBmdW5jdGlvbiB1cGRhdGUoKSB7XG4gICAgdmFyIHRhcmdldHMgICAgICAgICAgICAgPSBPYmplY3Qua2V5cyh0YXJnZXRzVG9SZW5kZXJlcnMpLFxuICAgICAgICByZW5kZXJlck5hbWVzICAgICAgID0gT2JqZWN0LmtleXMocmVuZGVyZXJzKSxcbiAgICAgICAgdGFyZ2V0ICAgICAgICAgICAgICA9IG51bGwsXG4gICAgICAgIGVudGl0eSAgICAgICAgICAgICAgPSBudWxsLFxuICAgICAgICBjb250YWluZXIgICAgICAgICAgID0gbnVsbCxcbiAgICAgICAgdGFyZ2V0TmFtZSAgICAgICAgICA9IHZvaWQgMCxcbiAgICAgICAgY29udGFpbmVyRW50cyAgICAgICA9IGNvbnRhaW5lcnMuZW50aXRpZXMsXG4gICAgICAgIGVudGl0aWVzICAgICAgICAgICAgPSByZW5kZXJhYmxlcy5lbnRpdGllcyxcbiAgICAgICAgaSAgICAgICAgICAgICAgICAgICA9IGVudGl0aWVzLmxlbmd0aCxcbiAgICAgICAgdGFyZ2V0c0xlbmd0aCAgICAgICA9IHRhcmdldHMubGVuZ3RoLFxuICAgICAgICBjb250YWluZXJFbnRMZW5ndGhzID0gY29udGFpbmVyRW50cy5sZW5ndGgsXG4gICAgICAgIHJlbmRlcmVyc0xlbmd0aCAgICAgPSAwLFxuICAgICAgICBqICAgICAgICAgICAgICAgICAgID0gdG9EZXBsb3kubGVuZ3RoLFxuICAgICAgICBrICAgICAgICAgICAgICAgICAgID0gMCxcbiAgICAgICAgbCAgICAgICAgICAgICAgICAgICA9IDA7XG5cbiAgICAvLyBVcGRhdGUgdGhlIENvbnRhaW5lciBpZiBpdHMgdHJhbnNmb3JtIG9yIHNpemUgYXJlIGRpcnR5LlxuICAgIGNvbnRhaW5lcnMuZm9yRWFjaChmdW5jdGlvbihlbnRpdHkpIHtcbiAgICAgICAgY29udGFpbmVyID0gZW50aXR5LmdldENvbXBvbmVudCgnY29udGFpbmVyJyk7XG4gICAgICAgIGlmIChlbnRpdHkuZ2V0Q29udGV4dCgpICYmIChjb250YWluZXIuX3RyYW5zZm9ybURpcnR5IHx8IGNvbnRhaW5lci5fc2l6ZURpcnR5KSkgcmVuZGVyZXJzLkRPTS51cGRhdGVDb250YWluZXIoZW50aXR5KTtcbiAgICB9KTtcblxuICAgIHdoaWxlIChqLS0pIGRlcGxveUNvbnRhaW5lcih0b0RlcGxveS5wb3AoKSk7XG5cbiAgICAvLyBGb3IgYWxsIG9mIHRoZSByZW5kZXJhYmxlc1xuICAgIHdoaWxlIChpLS0pIHtcbiAgICAgICAgaiAgICAgID0gdGFyZ2V0c0xlbmd0aDtcbiAgICAgICAgZW50aXR5ID0gZW50aXRpZXNbaV07XG4gICAgICAgIGlmICghZW50aXR5LmdldENvbnRleHQoKSkgY29udGludWU7XG5cbiAgICAgICAgLy8gRm9yIGVhY2ggcmVuZGVyZXJcbiAgICAgICAgd2hpbGUgKGotLSkge1xuICAgICAgICAgICAgdGFyZ2V0ID0gZW50aXR5LmdldENvbXBvbmVudCh0YXJnZXRzW2pdKTtcbiAgICAgICAgICAgIGlmICghdGFyZ2V0KSBjb250aW51ZTsgLy8gc2tpcCBpZiB0aGlzIFJlbmRlcmFibGUgZG9lcyBub3QgY29udGFpbmVyIHRoZSBwcm9wZXIgdGFyZ2V0IGNvbXBvbmVudCBmb3IgdGhpcyByZW5kZXJlclxuXG4gICAgICAgICAgICBrID0gY29udGFpbmVyRW50TGVuZ3RocztcblxuICAgICAgICAgICAgaWYgKGspIHtcbiAgICAgICAgICAgICAgICB0YXJnZXROYW1lICAgICAgPSB0YXJnZXQuY29uc3RydWN0b3IudG9TdHJpbmcoKTtcbiAgICAgICAgICAgICAgICByZW5kZXJlcnNMZW5ndGggPSB0YXJnZXRzVG9SZW5kZXJlcnNbdGFyZ2V0TmFtZV0ubGVuZ3RoO1xuXG4gICAgICAgICAgICAgICAgLy8gRm9yIGVhY2ggY29udGFpbmVyXG4gICAgICAgICAgICAgICAgd2hpbGUgKGstLSkge1xuICAgICAgICAgICAgICAgICAgICBsICAgICAgICAgID0gcmVuZGVyZXJzTGVuZ3RoO1xuICAgICAgICAgICAgICAgICAgICBjb250YWluZXIgID0gY29udGFpbmVyRW50c1trXTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBJZiB0aGUgdGFyZ2V0IGlzIGluIHRoZSBDb250YWluZXJcbiAgICAgICAgICAgICAgICAgICAgaWYgKF9pc1dpdGhpbih0YXJnZXQsIGVudGl0eSwgY29udGFpbmVyKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gRGVjaWRlIGlmIHRvIGRlcGxveSAgYW5kIHVwZGF0ZSBvciBqdXN0IHVwZGF0ZVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRhcmdldC5faXNXaXRoaW4oY29udGFpbmVyKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdoaWxlIChsLS0pIHRhcmdldHNUb1JlbmRlcmVyc1t0YXJnZXROYW1lXVtsXS51cGRhdGUoZW50aXR5LCBjb250YWluZXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSAobC0tKSB0YXJnZXRzVG9SZW5kZXJlcnNbdGFyZ2V0TmFtZV1bbF0uZGVwbG95KGVudGl0eSwgY29udGFpbmVyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXQuX2FkZFRvQ29udGFpbmVyKGNvbnRhaW5lcik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodGFyZ2V0Ll9pc1dpdGhpbihjb250YWluZXIpKSB7IC8vIElmIHRoZSB0YXJnZXQgaXMgY3VsbGVkIHJlY2FsbCBpdFxuICAgICAgICAgICAgICAgICAgICAgICAgd2hpbGUgKGwtLSkgdGFyZ2V0c1RvUmVuZGVyZXJzW3RhcmdldE5hbWVdW2xdLnJlY2FsbChlbnRpdHksIGNvbnRhaW5lcik7XG4gICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXQuX3JlbW92ZUZyb21Db250YWluZXIoY29udGFpbmVyKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gUmVzZXQgdGhlIGludmFsaWRhdGlvbnMgYWZ0ZXIgYWxsIG9mIHRoZSBsb2dpYyBmb3IgXG4gICAgICAgICAgICAvLyBhIHBhcnRpY3VsYXIgdGFyZ2V0IFxuICAgICAgICAgICAgaWYgKHRhcmdldC5yZXNldEludmFsaWRhdGlvbnMpIHRhcmdldC5yZXNldEludmFsaWRhdGlvbnMoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIEhhdmUgZWFjaCByZW5kZXJlciBydW5cbiAgICBpID0gcmVuZGVyZXJOYW1lcy5sZW5ndGg7XG4gICAgd2hpbGUgKGktLSkgcmVuZGVyZXJzW3JlbmRlcmVyTmFtZXNbaV1dLnJlbmRlcigpO1xufTtcblxuLyoqXG4gKiBBZGQgYSBuZXcgcmVuZGVyZXIgd2hpY2ggd2lsbCBiZSBjYWxsZWQgZXZlcnkgZnJhbWUuXG4gKlxuICogQG1ldGhvZCByZWdpc3RlclxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIG5hbWUgb2YgdGhlIHJlbmRlcmVyXG4gKiBAcGFyYW0ge09iamVjdH0gcmVuZGVyZXIgc2luZ2xldG9uIHJlbmRlcmVyIG9iamVjdFxuICovXG5SZW5kZXJTeXN0ZW0ucmVnaXN0ZXIgPSBmdW5jdGlvbiByZWdpc3RlcihuYW1lLCByZW5kZXJlcikge1xuICAgIGlmIChyZW5kZXJlcnNbbmFtZV0gIT0gbnVsbCkgcmV0dXJuIGZhbHNlO1xuXG4gICAgcmVuZGVyZXJzW25hbWVdID0gcmVuZGVyZXI7XG5cbiAgICB2YXIgdGFyZ2V0cyA9IHJlbmRlcmVyLmdldFRhcmdldHMoKSxcbiAgICAgICAgaSAgICAgICA9IHRhcmdldHMubGVuZ3RoO1xuXG4gICAgd2hpbGUgKGktLSkge1xuICAgICAgICBpZiAodGFyZ2V0c1RvUmVuZGVyZXJzW3RhcmdldHNbaV1dID09IG51bGwpIHRhcmdldHNUb1JlbmRlcmVyc1t0YXJnZXRzW2ldXSA9IFtdO1xuICAgICAgICB0YXJnZXRzVG9SZW5kZXJlcnNbdGFyZ2V0c1tpXV0ucHVzaChyZW5kZXJlcik7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlbmRlclN5c3RlbTtcbiIsIi8qIFRoaXMgU291cmNlIENvZGUgRm9ybSBpcyBzdWJqZWN0IHRvIHRoZSB0ZXJtcyBvZiB0aGUgTW96aWxsYSBQdWJsaWNcbiAqIExpY2Vuc2UsIHYuIDIuMC4gSWYgYSBjb3B5IG9mIHRoZSBNUEwgd2FzIG5vdCBkaXN0cmlidXRlZCB3aXRoIHRoaXNcbiAqIGZpbGUsIFlvdSBjYW4gb2J0YWluIG9uZSBhdCBodHRwOi8vbW96aWxsYS5vcmcvTVBMLzIuMC8uXG4gKlxuICogT3duZXJzOiBkYW5AZmFtby51c1xuICogICAgICAgICBmZWxpeEBmYW1vLnVzXG4gKiAgICAgICAgIG1pa2VAZmFtby51c1xuICpcbiAqIEBsaWNlbnNlIE1QTCAyLjBcbiAqIEBjb3B5cmlnaHQgRmFtb3VzIEluZHVzdHJpZXMsIEluYy4gMjAxNFxuICovXG5cbiAndXNlIHN0cmljdCc7XG5cbnZhciBwcmV2aW91c1RpbWUgICAgICAgPSAwLCBcbiAgICBkZWx0YSAgICAgICAgICAgICAgPSAwLFxuICAgIGluaXRpYWxpemF0aW9uVGltZSA9IERhdGUubm93KCksXG4gICAgY3VycmVudFRpbWUgICAgICAgID0gaW5pdGlhbGl6YXRpb25UaW1lLFxuICAgIHJlbGF0aXZlVGltZSAgICAgICA9IGluaXRpYWxpemF0aW9uVGltZSxcbiAgICBhYnNvbHV0ZVRpbWUgICAgICAgPSBpbml0aWFsaXphdGlvblRpbWUsXG4gICAgcHJldmlvdXNSZWxGcmFtZSAgID0gMDtcblxuLyoqXG4gKiBUaW1lU3lzdGVtIGlzIHJlc3BvbnNpYmxlIGZvciBkZXRlcm1pbmluZyB0aGUgY3VycmVudCBtb21lbnQuXG4gKlxuICogQGNsYXNzIFRpbWVTeXN0ZW1cbiAqIEBzeXN0ZW1cbiAqL1xudmFyIFRpbWVTeXN0ZW0gPSB7fTtcblxuLyoqXG4gKiBVcGRhdGUgdGhlIHRpbWUgYmFzZWQgb24gdGhlIGZyYW1lIGRhdGEgZnJvbSB0aGUgRW5naW5lLlxuICpcbiAqIEBtZXRob2QgdXBkYXRlXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IHJlbEZyYW1lIFxuICovXG5UaW1lU3lzdGVtLnVwZGF0ZSA9IGZ1bmN0aW9uIHVwZGF0ZShyZWxGcmFtZSkge1xuICAgIHByZXZpb3VzVGltZSAgICAgPSBjdXJyZW50VGltZTtcbiAgICBjdXJyZW50VGltZSAgICAgID0gRGF0ZS5ub3coKTtcbiAgICBkZWx0YSAgICAgICAgICAgID0gY3VycmVudFRpbWUgLSBwcmV2aW91c1RpbWU7XG4gICAgcmVsYXRpdmVUaW1lICAgICs9IGRlbHRhICogKHJlbEZyYW1lIC0gcHJldmlvdXNSZWxGcmFtZSk7XG4gICAgYWJzb2x1dGVUaW1lICAgICs9IGRlbHRhO1xuICAgIHByZXZpb3VzUmVsRnJhbWUgPSByZWxGcmFtZTtcbn07XG5cbi8qKlxuICogR2V0IHJlbGF0aXZlIHRpbWUgaW4gbXMgb2ZmZnNldCBieSB0aGUgc3BlZWQgYXQgd2hpY2ggdGhlIEVuZ2luZSBpcyBydW5uaW5nLlxuICpcbiAqIEBtZXRob2QgZ2V0UmVsYXRpdmVUaW1lXG4gKlxuICogQHJldHVybiB7TnVtYmVyfSB0aGUgdGltZSBhY2NvdW50aW5nIGZvciBFbmdpbmUncyBydW4gc3BlZWRcbiAqL1xuVGltZVN5c3RlbS5nZXRSZWxhdGl2ZVRpbWUgPSBmdW5jdGlvbiBnZXRSZWxhdGl2ZVRpbWUoKSB7XG4gICAgcmV0dXJuIHJlbGF0aXZlVGltZTtcbn07XG5cbi8qKlxuICogR2V0IGFic29sdXRlIHRpbWUuXG4gKlxuICogQG1ldGhvZCBnZXRBYnNvbHV0ZVRpbWVcbiAqXG4gKiBAcmV0dXJuIHtOdW1iZXJ9IHRoZSB0aW1lIGluIG1zXG4gKi9cblRpbWVTeXN0ZW0uZ2V0QWJzb2x1dGVUaW1lID0gZnVuY3Rpb24gZ2V0QWJzb2x1dGVUaW1lKCkge1xuICAgIHJldHVybiBhYnNvbHV0ZVRpbWU7XG59O1xuXG4vKipcbiAqIEdldCB0aGUgdGltZSBpbiB3aGljaCB0aGUgRW5naW5lIHdhcyBpbnN0YW50aWF0ZWQuXG4gKlxuICogQG1ldGhvZCBnZXRJbml0aWFsVGltZVxuICpcbiAqIEByZXR1cm4ge051bWJlcn0gdGhlIHRpbWUgaW4gbXNcbiAqL1xuVGltZVN5c3RlbS5nZXRJbml0aWFsVGltZSA9IGZ1bmN0aW9uIGdldEluaXRpYWxUaW1lKCkge1xuICAgIHJldHVybiBpbml0aWFsaXphdGlvblRpbWU7XG59O1xuXG4vKipcbiAqIEdldCBlbGFwc2VkIHRpbWUgc2luY2UgaW5zdGFudGlhdGlvbiBhY2NvdW50aW5nIGZvciBFbmdpbmUgc3BlZWRcbiAqXG4gKiBAbWV0aG9kIGdldEVsYXBzZWRSZWxhdGl2ZVRpbWVcbiAqXG4gKiBAcmV0dXJuIHtOdW1iZXJ9IHRoZSB0aW1lIGluIG1zXG4gKi9cblRpbWVTeXN0ZW0uZ2V0RWxhcHNlZFJlbGF0aXZlVGltZSA9IGZ1bmN0aW9uIGdldEVsYXBzZWRSZWxhdGl2ZVRpbWUoKSB7XG4gICAgcmV0dXJuIHJlbGF0aXZlVGltZSAtIGluaXRpYWxpemF0aW9uVGltZTtcbn07XG5cbi8qKlxuICogR2V0IGFic29sdXRlIGVsYXBzZWQgdGltZSBzaW5jZSBpbnN0YW50aWF0aW9uXG4gKlxuICogQG1ldGhvZCBnZXRFbGFwc2VkQWJzb2x1dGVUaW1lXG4gKlxuICogQHJldHVybiB7TnVtYmVyfSB0aGUgdGltZSBpbiBtc1xuICovXG5UaW1lU3lzdGVtLmdldEVsYXBzZWRBYnNvbHV0ZVRpbWUgPSBmdW5jdGlvbiBnZXRFbGFwc2VkQWJzb2x1dGVUaW1lKCkge1xuICAgIHJldHVybiBhYnNvbHV0ZVRpbWUgLSBpbml0aWFsaXphdGlvblRpbWU7XG59O1xuXG4vKipcbiAqIEdldCB0aGUgdGltZSBiZXR3ZWVuIHRoaXMgZnJhbWUgYW5kIGxhc3QuXG4gKlxuICogQG1ldGhvZCBnZXREZWx0YVxuICpcbiAqIEByZXR1cm4ge051bWJlcn0gdGhlIHRpbWUgaW4gbXNcbiAqL1xuVGltZVN5c3RlbS5nZXREZWx0YSA9IGZ1bmN0aW9uIGdldERlbHRhKCkge1xuICAgIHJldHVybiBkZWx0YTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gVGltZVN5c3RlbTtcbiIsIi8qIFRoaXMgU291cmNlIENvZGUgRm9ybSBpcyBzdWJqZWN0IHRvIHRoZSB0ZXJtcyBvZiB0aGUgTW96aWxsYSBQdWJsaWNcbiAqIExpY2Vuc2UsIHYuIDIuMC4gSWYgYSBjb3B5IG9mIHRoZSBNUEwgd2FzIG5vdCBkaXN0cmlidXRlZCB3aXRoIHRoaXNcbiAqIGZpbGUsIFlvdSBjYW4gb2J0YWluIG9uZSBhdCBodHRwOi8vbW96aWxsYS5vcmcvTVBMLzIuMC8uXG4gKlxuICogT3duZXJzOiBkYW5AZmFtby51c1xuICpcbiAqIEBsaWNlbnNlIE1QTCAyLjBcbiAqIEBjb3B5cmlnaHQgRmFtb3VzIEluZHVzdHJpZXMsIEluYy4gMjAxNFxuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIE1hdHJpeE1hdGggPSByZXF1aXJlKCcuLi8uLi9tYXRoLzR4NG1hdHJpeCcpO1xuXG4vKipcbiAqIFRhcmdldCBpcyB0aGUgYmFzZSBjbGFzcyBmb3IgYWxsIHJlbmRlcmFibGVzLiAgSXQgaG9sZHMgdGhlIHN0YXRlIG9mXG4gKiAgIGl0cyB2ZXJ0aWNpZXMsIHRoZSBDb250YWluZXJzIGl0IGlzIGRlcGxveWVkIGluLCB0aGUgQ29udGV4dCBpdCBiZWxvbmdzXG4gKiAgIHRvLCBhbmQgd2hldGhlciBvciBub3Qgb3JpZ2luIGFsaWdubWVudCBuZWVkcyB0byBiZSBhcHBsaWVkLlxuICpcbiAqIEBjb21wb25lbnQgVGFyZ2V0XG4gKiBAY29uc3RydWN0b3JcbiAqXG4gKiBAcGFyYW0ge0VudGl0eX0gZW50aXR5ICBFbnRpdHkgdGhhdCB0aGUgVGFyZ2V0IGlzIGEgY29tcG9uZW50IG9mXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyBvcHRpb25zXG4gKi9cbmZ1bmN0aW9uIFRhcmdldChlbnRpdHksIG9wdGlvbnMpIHtcbiAgICB0aGlzLnZlcnRpY2llcyAgPSBvcHRpb25zLnZlcnRpY2llcyB8fCBbXTtcbiAgICB0aGlzLmNvbnRhaW5lcnMgPSB7fTtcbiAgICAvLyB0aGlzLmNvbnRleHQgICAgPSBlbnRpdHkuZ2V0Q29udGV4dCgpLl9pZDtcbiAgICB0aGlzLl9oYXNPcmlnaW4gPSBmYWxzZTtcbn1cblxuLyoqXG4gKiBHZXQgdGhlIHZlcnRpY2llcyBvZiB0aGUgVGFyZ2V0LlxuICpcbiAqIEBtZXRob2QgZ2V0VmVydGljaWVzXG4gKlxuICogQHJldHVybiB7QXJyYXl9IGFycmF5IG9mIHRoZSB2ZXJ0aWNpZXMgcmVwcmVzZW50ZWQgYXMgdGhyZWUgZWxlbWVudCBhcnJheXMgW3gsIHksIHpdXG4gKi9cblRhcmdldC5wcm90b3R5cGUuZ2V0VmVydGljaWVzID0gZnVuY3Rpb24gZ2V0VmVydGljaWVzKCl7XG4gICAgcmV0dXJuIHRoaXMudmVydGljaWVzO1xufTtcblxuLyoqXG4gKiBEZXRlcm1pbmVzIHdoZXRoZXIgYSBUYXJnZXQgd2FzIGRlcGxveWVkIHRvIGEgcGFydGljdWxhciBjb250YWluZXJcbiAqXG4gKiBAbWV0aG9kIF9pc1dpdGhpblxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSB0aGUgaWQgb2YgdGhlIENvbnRhaW5lcidzIEVudGl0eVxuICogQHJldHVybiB7Qm9vbGVhbn0gd2hldGhlciBvciBub3cgdGhlIFRhcmdldCB3YXMgZGVwbG95ZWQgdG8gdGhpcyBwYXJ0aWN1bGFyIENvbnRhaW5lclxuICovXG5UYXJnZXQucHJvdG90eXBlLl9pc1dpdGhpbiA9IGZ1bmN0aW9uIF9pc1dpdGhpbihjb250YWluZXIpIHtcbiAgICByZXR1cm4gdGhpcy5jb250YWluZXJzW2NvbnRhaW5lci5faWRdO1xufTtcblxuLyoqXG4gKiBNYXJrIGEgQ29udGFpbmVyIGFzIGhhdmluZyBhIGRlcGxveWVkIGluc3RhbmNlIG9mIHRoZSBUYXJnZXRcbiAqXG4gKiBAbWV0aG9kIF9hZGRUb0NvbnRhaW5lclxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSB0aGUgaWQgb2YgdGhlIENvbnRhaW5lcidzIEVudGl0eVxuICogQHJldHVybiB7Qm9vbGVhbn0gc3RhdXMgb2YgdGhlIGFkZGl0aW9uXG4gKi9cblRhcmdldC5wcm90b3R5cGUuX2FkZFRvQ29udGFpbmVyID0gZnVuY3Rpb24gX2FkZFRvQ29udGFpbmVyKGNvbnRhaW5lcikge1xuICAgIHRoaXMuY29udGFpbmVyc1tjb250YWluZXIuX2lkXSA9IHRydWU7XG4gICAgcmV0dXJuIHRydWU7XG59O1xuXG4vKipcbiAqIFVubWFyayBhIENvbnRhaW5lciBhcyBoYXZpbmcgYSBkZXBsb3llZCBpbnN0YW5jZSBvZiB0aGUgVGFyZ2V0XG4gKlxuICogQG1ldGhvZCBfcmVtb3ZlRnJvbUNvbnRhaW5lclxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSB0aGUgaWQgb2YgdGhlIENvbnRhaW5lcidzIEVudGl0eVxuICogQHJldHVybiB7Qm9vbGVhbn0gc3RhdXMgb2YgdGhlIHJlbW92YWxcbiAqL1xuVGFyZ2V0LnByb3RvdHlwZS5fcmVtb3ZlRnJvbUNvbnRhaW5lciA9IGZ1bmN0aW9uIF9yZW1vdmVGcm9tQ29udGFpbmVyKGNvbnRhaW5lcikge1xuICAgIHRoaXMuY29udGFpbmVyc1tjb250YWluZXIuX2lkXSA9IGZhbHNlO1xuICAgIHJldHVybiB0cnVlO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBUYXJnZXQ7XG4iLCIvKiBUaGlzIFNvdXJjZSBDb2RlIEZvcm0gaXMgc3ViamVjdCB0byB0aGUgdGVybXMgb2YgdGhlIE1vemlsbGEgUHVibGljXG4qIExpY2Vuc2UsIHYuIDIuMC4gSWYgYSBjb3B5IG9mIHRoZSBNUEwgd2FzIG5vdCBkaXN0cmlidXRlZCB3aXRoIHRoaXNcbiogZmlsZSwgWW91IGNhbiBvYnRhaW4gb25lIGF0IGh0dHA6Ly9tb3ppbGxhLm9yZy9NUEwvMi4wLy5cbipcbiogT3duZXI6IG1hcmtAZmFtby51c1xuKiBAbGljZW5zZSBNUEwgMi4wXG4qIEBjb3B5cmlnaHQgRmFtb3VzIEluZHVzdHJpZXMsIEluYy4gMjAxNFxuKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEV2ZW50RW1pdHRlciByZXByZXNlbnRzIGEgY2hhbm5lbCBmb3IgZXZlbnRzLlxuICpcbiAqIEBjbGFzcyBFdmVudEVtaXR0ZXJcbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBFdmVudEVtaXR0ZXIoKSB7XG4gICAgdGhpcy5saXN0ZW5lcnMgPSB7fTtcbiAgICB0aGlzLl9vd25lciA9IHRoaXM7XG59XG5cbi8qKlxuICogVHJpZ2dlciBhbiBldmVudCwgc2VuZGluZyB0byBhbGwgZG93bnN0cmVhbSBoYW5kbGVyc1xuICogICBsaXN0ZW5pbmcgZm9yIHByb3ZpZGVkICd0eXBlJyBrZXkuXG4gKlxuICogQG1ldGhvZCBlbWl0XG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHR5cGUgZXZlbnQgdHlwZSBrZXkgKGZvciBleGFtcGxlLCAnY2xpY2snKVxuICogQHBhcmFtIHtPYmplY3R9IGV2ZW50IGV2ZW50IGRhdGFcbiAqIEByZXR1cm4ge0V2ZW50SGFuZGxlcn0gdGhpc1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbiBlbWl0KHR5cGUsIGV2ZW50KSB7XG4gICAgdmFyIGhhbmRsZXJzID0gdGhpcy5saXN0ZW5lcnNbdHlwZV07XG4gICAgaWYgKGhhbmRsZXJzKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgaGFuZGxlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGhhbmRsZXJzW2ldLmNhbGwodGhpcy5fb3duZXIsIGV2ZW50KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQmluZCBhIGNhbGxiYWNrIGZ1bmN0aW9uIHRvIGFuIGV2ZW50IHR5cGUgaGFuZGxlZCBieSB0aGlzIG9iamVjdC5cbiAqXG4gKiBAbWV0aG9kIFwib25cIlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSB0eXBlIGV2ZW50IHR5cGUga2V5IChmb3IgZXhhbXBsZSwgJ2NsaWNrJylcbiAqIEBwYXJhbSB7ZnVuY3Rpb24oc3RyaW5nLCBPYmplY3QpfSBoYW5kbGVyIGNhbGxiYWNrXG4gKiBAcmV0dXJuIHtFdmVudEhhbmRsZXJ9IHRoaXNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbiA9IGZ1bmN0aW9uIG9uKHR5cGUsIGhhbmRsZXIpIHtcbiAgICBpZiAoISh0eXBlIGluIHRoaXMubGlzdGVuZXJzKSkgdGhpcy5saXN0ZW5lcnNbdHlwZV0gPSBbXTtcbiAgICB2YXIgaW5kZXggPSB0aGlzLmxpc3RlbmVyc1t0eXBlXS5pbmRleE9mKGhhbmRsZXIpO1xuICAgIGlmIChpbmRleCA8IDApIHRoaXMubGlzdGVuZXJzW3R5cGVdLnB1c2goaGFuZGxlcik7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEFsaWFzIGZvciBcIm9uXCIuXG4gKiBAbWV0aG9kIGFkZExpc3RlbmVyXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXIgPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uO1xuXG4vKipcbiAqIFVuYmluZCBhbiBldmVudCBieSB0eXBlIGFuZCBoYW5kbGVyLlxuICogICBUaGlzIHVuZG9lcyB0aGUgd29yayBvZiBcIm9uXCIuXG4gKlxuICogQG1ldGhvZCByZW1vdmVMaXN0ZW5lclxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSB0eXBlIGV2ZW50IHR5cGUga2V5IChmb3IgZXhhbXBsZSwgJ2NsaWNrJylcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGhhbmRsZXIgZnVuY3Rpb24gb2JqZWN0IHRvIHJlbW92ZVxuICogQHJldHVybiB7RXZlbnRFbWl0dGVyfSB0aGlzXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXIgPSBmdW5jdGlvbiByZW1vdmVMaXN0ZW5lcih0eXBlLCBoYW5kbGVyKSB7XG4gICAgdmFyIGluZGV4ID0gdGhpcy5saXN0ZW5lcnNbdHlwZV0uaW5kZXhPZihoYW5kbGVyKTtcbiAgICBpZiAoaW5kZXggPj0gMCkgdGhpcy5saXN0ZW5lcnNbdHlwZV0uc3BsaWNlKGluZGV4LCAxKTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQ2FsbCBldmVudCBoYW5kbGVycyB3aXRoIHRoaXMgc2V0IHRvIG93bmVyLlxuICpcbiAqIEBtZXRob2QgYmluZFRoaXNcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb3duZXIgb2JqZWN0IHRoaXMgRXZlbnRFbWl0dGVyIGJlbG9uZ3MgdG9cbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5iaW5kVGhpcyA9IGZ1bmN0aW9uIGJpbmRUaGlzKG93bmVyKSB7XG4gICAgdGhpcy5fb3duZXIgPSBvd25lcjtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRXZlbnRFbWl0dGVyO1xuIiwiLyogVGhpcyBTb3VyY2UgQ29kZSBGb3JtIGlzIHN1YmplY3QgdG8gdGhlIHRlcm1zIG9mIHRoZSBNb3ppbGxhIFB1YmxpY1xuKiBMaWNlbnNlLCB2LiAyLjAuIElmIGEgY29weSBvZiB0aGUgTVBMIHdhcyBub3QgZGlzdHJpYnV0ZWQgd2l0aCB0aGlzXG4qIGZpbGUsIFlvdSBjYW4gb2J0YWluIG9uZSBhdCBodHRwOi8vbW96aWxsYS5vcmcvTVBMLzIuMC8uXG4qXG4qIE93bmVyOiBtYXJrQGZhbW8udXNcbiogQGxpY2Vuc2UgTVBMIDIuMFxuKiBAY29weXJpZ2h0IEZhbW91cyBJbmR1c3RyaWVzLCBJbmMuIDIwMTRcbiovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIEV2ZW50RW1pdHRlciA9IHJlcXVpcmUoJy4vRXZlbnRFbWl0dGVyJyk7XG5cbi8qKlxuICogRXZlbnRIYW5kbGVyIGZvcndhcmRzIHJlY2VpdmVkIGV2ZW50cyB0byBhIHNldCBvZiBwcm92aWRlZCBjYWxsYmFjayBmdW5jdGlvbnMuXG4gKiBJdCBhbGxvd3MgZXZlbnRzIHRvIGJlIGNhcHR1cmVkLCBwcm9jZXNzZWQsIGFuZCBvcHRpb25hbGx5IHBpcGVkIHRocm91Z2ggdG8gb3RoZXIgZXZlbnQgaGFuZGxlcnMuXG4gKlxuICogQGNsYXNzIEV2ZW50SGFuZGxlclxuICogQGV4dGVuZHMgRXZlbnRFbWl0dGVyXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gRXZlbnRIYW5kbGVyKCkge1xuICAgIEV2ZW50RW1pdHRlci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXG4gICAgdGhpcy5kb3duc3RyZWFtID0gW107IC8vIGRvd25zdHJlYW0gZXZlbnQgaGFuZGxlcnNcbiAgICB0aGlzLmRvd25zdHJlYW1GbiA9IFtdOyAvLyBkb3duc3RyZWFtIGZ1bmN0aW9uc1xuXG4gICAgdGhpcy51cHN0cmVhbSA9IFtdOyAvLyB1cHN0cmVhbSBldmVudCBoYW5kbGVyc1xuICAgIHRoaXMudXBzdHJlYW1MaXN0ZW5lcnMgPSB7fTsgLy8gdXBzdHJlYW0gbGlzdGVuZXJzXG59XG5FdmVudEhhbmRsZXIucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShFdmVudEVtaXR0ZXIucHJvdG90eXBlKTtcbkV2ZW50SGFuZGxlci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBFdmVudEhhbmRsZXI7XG5cbi8qKlxuICogQXNzaWduIGFuIGV2ZW50IGhhbmRsZXIgdG8gcmVjZWl2ZSBhbiBvYmplY3QncyBpbnB1dCBldmVudHMuXG4gKlxuICogQG1ldGhvZCBzZXRJbnB1dEhhbmRsZXJcbiAqIEBzdGF0aWNcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IG9iamVjdCB0byBtaXggdHJpZ2dlciwgc3Vic2NyaWJlLCBhbmQgdW5zdWJzY3JpYmUgZnVuY3Rpb25zIGludG9cbiAqIEBwYXJhbSB7RXZlbnRIYW5kbGVyfSBoYW5kbGVyIGFzc2lnbmVkIGV2ZW50IGhhbmRsZXJcbiAqL1xuRXZlbnRIYW5kbGVyLnNldElucHV0SGFuZGxlciA9IGZ1bmN0aW9uIHNldElucHV0SGFuZGxlcihvYmplY3QsIGhhbmRsZXIpIHtcbiAgICBvYmplY3QudHJpZ2dlciA9IGhhbmRsZXIudHJpZ2dlci5iaW5kKGhhbmRsZXIpO1xuICAgIGlmIChoYW5kbGVyLnN1YnNjcmliZSAmJiBoYW5kbGVyLnVuc3Vic2NyaWJlKSB7XG4gICAgICAgIG9iamVjdC5zdWJzY3JpYmUgPSBoYW5kbGVyLnN1YnNjcmliZS5iaW5kKGhhbmRsZXIpO1xuICAgICAgICBvYmplY3QudW5zdWJzY3JpYmUgPSBoYW5kbGVyLnVuc3Vic2NyaWJlLmJpbmQoaGFuZGxlcik7XG4gICAgfVxufTtcblxuLyoqXG4gKiBBc3NpZ24gYW4gZXZlbnQgaGFuZGxlciB0byByZWNlaXZlIGFuIG9iamVjdCdzIG91dHB1dCBldmVudHMuXG4gKlxuICogQG1ldGhvZCBzZXRPdXRwdXRIYW5kbGVyXG4gKiBAc3RhdGljXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBvYmplY3QgdG8gbWl4IHBpcGUsIHVucGlwZSwgb24sIGFkZExpc3RlbmVyLCBhbmQgcmVtb3ZlTGlzdGVuZXIgZnVuY3Rpb25zIGludG9cbiAqIEBwYXJhbSB7RXZlbnRIYW5kbGVyfSBoYW5kbGVyIGFzc2lnbmVkIGV2ZW50IGhhbmRsZXJcbiAqL1xuRXZlbnRIYW5kbGVyLnNldE91dHB1dEhhbmRsZXIgPSBmdW5jdGlvbiBzZXRPdXRwdXRIYW5kbGVyKG9iamVjdCwgaGFuZGxlcikge1xuICAgIGlmIChoYW5kbGVyIGluc3RhbmNlb2YgRXZlbnRIYW5kbGVyKSBoYW5kbGVyLmJpbmRUaGlzKG9iamVjdCk7XG4gICAgb2JqZWN0LnBpcGUgPSBoYW5kbGVyLnBpcGUuYmluZChoYW5kbGVyKTtcbiAgICBvYmplY3QudW5waXBlID0gaGFuZGxlci51bnBpcGUuYmluZChoYW5kbGVyKTtcbiAgICBvYmplY3Qub24gPSBoYW5kbGVyLm9uLmJpbmQoaGFuZGxlcik7XG4gICAgb2JqZWN0LmFkZExpc3RlbmVyID0gb2JqZWN0Lm9uO1xuICAgIG9iamVjdC5yZW1vdmVMaXN0ZW5lciA9IGhhbmRsZXIucmVtb3ZlTGlzdGVuZXIuYmluZChoYW5kbGVyKTtcbn07XG5cbi8qKlxuICogVHJpZ2dlciBhbiBldmVudCwgc2VuZGluZyB0byBhbGwgZG93bnN0cmVhbSBoYW5kbGVyc1xuICogICBsaXN0ZW5pbmcgZm9yIHByb3ZpZGVkICd0eXBlJyBrZXkuXG4gKlxuICogQG1ldGhvZCBlbWl0XG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHR5cGUgZXZlbnQgdHlwZSBrZXkgKGZvciBleGFtcGxlLCAnY2xpY2snKVxuICogQHBhcmFtIHtPYmplY3R9IGV2ZW50IGV2ZW50IGRhdGFcbiAqIEByZXR1cm4ge0V2ZW50SGFuZGxlcn0gdGhpc1xuICovXG5FdmVudEhhbmRsZXIucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbiBlbWl0KHR5cGUsIGV2ZW50KSB7XG4gICAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5lbWl0LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgdmFyIGkgPSAwO1xuICAgIGZvciAoaSA9IDA7IGkgPCB0aGlzLmRvd25zdHJlYW0ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKHRoaXMuZG93bnN0cmVhbVtpXS50cmlnZ2VyKSB0aGlzLmRvd25zdHJlYW1baV0udHJpZ2dlcih0eXBlLCBldmVudCk7XG4gICAgfVxuICAgIGZvciAoaSA9IDA7IGkgPCB0aGlzLmRvd25zdHJlYW1Gbi5sZW5ndGg7IGkrKykge1xuICAgICAgICB0aGlzLmRvd25zdHJlYW1GbltpXSh0eXBlLCBldmVudCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBBbGlhcyBmb3IgZW1pdFxuICogQG1ldGhvZCBhZGRMaXN0ZW5lclxuICovXG5FdmVudEhhbmRsZXIucHJvdG90eXBlLnRyaWdnZXIgPSBFdmVudEhhbmRsZXIucHJvdG90eXBlLmVtaXQ7XG5cbi8qKlxuICogQWRkIGV2ZW50IGhhbmRsZXIgb2JqZWN0IHRvIHNldCBvZiBkb3duc3RyZWFtIGhhbmRsZXJzLlxuICpcbiAqIEBtZXRob2QgcGlwZVxuICpcbiAqIEBwYXJhbSB7RXZlbnRIYW5kbGVyfSB0YXJnZXQgZXZlbnQgaGFuZGxlciB0YXJnZXQgb2JqZWN0XG4gKiBAcmV0dXJuIHtFdmVudEhhbmRsZXJ9IHBhc3NlZCBldmVudCBoYW5kbGVyXG4gKi9cbkV2ZW50SGFuZGxlci5wcm90b3R5cGUucGlwZSA9IGZ1bmN0aW9uIHBpcGUodGFyZ2V0KSB7XG4gICAgaWYgKHRhcmdldC5zdWJzY3JpYmUgaW5zdGFuY2VvZiBGdW5jdGlvbikgcmV0dXJuIHRhcmdldC5zdWJzY3JpYmUodGhpcyk7XG5cbiAgICB2YXIgZG93bnN0cmVhbUN0eCA9ICh0YXJnZXQgaW5zdGFuY2VvZiBGdW5jdGlvbikgPyB0aGlzLmRvd25zdHJlYW1GbiA6IHRoaXMuZG93bnN0cmVhbTtcbiAgICB2YXIgaW5kZXggPSBkb3duc3RyZWFtQ3R4LmluZGV4T2YodGFyZ2V0KTtcbiAgICBpZiAoaW5kZXggPCAwKSBkb3duc3RyZWFtQ3R4LnB1c2godGFyZ2V0KTtcblxuICAgIGlmICh0YXJnZXQgaW5zdGFuY2VvZiBGdW5jdGlvbikgdGFyZ2V0KCdwaXBlJywgbnVsbCk7XG4gICAgZWxzZSBpZiAodGFyZ2V0LnRyaWdnZXIpIHRhcmdldC50cmlnZ2VyKCdwaXBlJywgbnVsbCk7XG5cbiAgICByZXR1cm4gdGFyZ2V0O1xufTtcblxuLyoqXG4gKiBSZW1vdmUgaGFuZGxlciBvYmplY3QgZnJvbSBzZXQgb2YgZG93bnN0cmVhbSBoYW5kbGVycy5cbiAqICAgVW5kb2VzIHdvcmsgb2YgXCJwaXBlXCIuXG4gKlxuICogQG1ldGhvZCB1bnBpcGVcbiAqXG4gKiBAcGFyYW0ge0V2ZW50SGFuZGxlcn0gdGFyZ2V0IHRhcmdldCBoYW5kbGVyIG9iamVjdFxuICogQHJldHVybiB7RXZlbnRIYW5kbGVyfSBwcm92aWRlZCB0YXJnZXRcbiAqL1xuRXZlbnRIYW5kbGVyLnByb3RvdHlwZS51bnBpcGUgPSBmdW5jdGlvbiB1bnBpcGUodGFyZ2V0KSB7XG4gICAgaWYgKHRhcmdldC51bnN1YnNjcmliZSBpbnN0YW5jZW9mIEZ1bmN0aW9uKSByZXR1cm4gdGFyZ2V0LnVuc3Vic2NyaWJlKHRoaXMpO1xuXG4gICAgdmFyIGRvd25zdHJlYW1DdHggPSAodGFyZ2V0IGluc3RhbmNlb2YgRnVuY3Rpb24pID8gdGhpcy5kb3duc3RyZWFtRm4gOiB0aGlzLmRvd25zdHJlYW07XG4gICAgdmFyIGluZGV4ID0gZG93bnN0cmVhbUN0eC5pbmRleE9mKHRhcmdldCk7XG4gICAgaWYgKGluZGV4ID49IDApIHtcbiAgICAgICAgZG93bnN0cmVhbUN0eC5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICBpZiAodGFyZ2V0IGluc3RhbmNlb2YgRnVuY3Rpb24pIHRhcmdldCgndW5waXBlJywgbnVsbCk7XG4gICAgICAgIGVsc2UgaWYgKHRhcmdldC50cmlnZ2VyKSB0YXJnZXQudHJpZ2dlcigndW5waXBlJywgbnVsbCk7XG4gICAgICAgIHJldHVybiB0YXJnZXQ7XG4gICAgfVxuICAgIGVsc2UgcmV0dXJuIGZhbHNlO1xufTtcblxuLyoqXG4gKiBCaW5kIGEgY2FsbGJhY2sgZnVuY3Rpb24gdG8gYW4gZXZlbnQgdHlwZSBoYW5kbGVkIGJ5IHRoaXMgb2JqZWN0LlxuICpcbiAqIEBtZXRob2QgXCJvblwiXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHR5cGUgZXZlbnQgdHlwZSBrZXkgKGZvciBleGFtcGxlLCAnY2xpY2snKVxuICogQHBhcmFtIHtmdW5jdGlvbihzdHJpbmcsIE9iamVjdCl9IGhhbmRsZXIgY2FsbGJhY2tcbiAqIEByZXR1cm4ge0V2ZW50SGFuZGxlcn0gdGhpc1xuICovXG5FdmVudEhhbmRsZXIucHJvdG90eXBlLm9uID0gZnVuY3Rpb24gb24odHlwZSwgaGFuZGxlcikge1xuICAgIEV2ZW50RW1pdHRlci5wcm90b3R5cGUub24uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICBpZiAoISh0eXBlIGluIHRoaXMudXBzdHJlYW1MaXN0ZW5lcnMpKSB7XG4gICAgICAgIHZhciB1cHN0cmVhbUxpc3RlbmVyID0gdGhpcy50cmlnZ2VyLmJpbmQodGhpcywgdHlwZSk7XG4gICAgICAgIHRoaXMudXBzdHJlYW1MaXN0ZW5lcnNbdHlwZV0gPSB1cHN0cmVhbUxpc3RlbmVyO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMudXBzdHJlYW0ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMudXBzdHJlYW1baV0ub24odHlwZSwgdXBzdHJlYW1MaXN0ZW5lcik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEFsaWFzIGZvciBcIm9uXCJcbiAqIEBtZXRob2QgYWRkTGlzdGVuZXJcbiAqL1xuRXZlbnRIYW5kbGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lciA9IEV2ZW50SGFuZGxlci5wcm90b3R5cGUub247XG5cbi8qKlxuICogTGlzdGVuIGZvciBldmVudHMgZnJvbSBhbiB1cHN0cmVhbSBldmVudCBoYW5kbGVyLlxuICpcbiAqIEBtZXRob2Qgc3Vic2NyaWJlXG4gKlxuICogQHBhcmFtIHtFdmVudEVtaXR0ZXJ9IHNvdXJjZSBzb3VyY2UgZW1pdHRlciBvYmplY3RcbiAqIEByZXR1cm4ge0V2ZW50SGFuZGxlcn0gdGhpc1xuICovXG5FdmVudEhhbmRsZXIucHJvdG90eXBlLnN1YnNjcmliZSA9IGZ1bmN0aW9uIHN1YnNjcmliZShzb3VyY2UpIHtcbiAgICB2YXIgaW5kZXggPSB0aGlzLnVwc3RyZWFtLmluZGV4T2Yoc291cmNlKTtcbiAgICBpZiAoaW5kZXggPCAwKSB7XG4gICAgICAgIHRoaXMudXBzdHJlYW0ucHVzaChzb3VyY2UpO1xuICAgICAgICBmb3IgKHZhciB0eXBlIGluIHRoaXMudXBzdHJlYW1MaXN0ZW5lcnMpIHtcbiAgICAgICAgICAgIHNvdXJjZS5vbih0eXBlLCB0aGlzLnVwc3RyZWFtTGlzdGVuZXJzW3R5cGVdKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogU3RvcCBsaXN0ZW5pbmcgdG8gZXZlbnRzIGZyb20gYW4gdXBzdHJlYW0gZXZlbnQgaGFuZGxlci5cbiAqXG4gKiBAbWV0aG9kIHVuc3Vic2NyaWJlXG4gKlxuICogQHBhcmFtIHtFdmVudEVtaXR0ZXJ9IHNvdXJjZSBzb3VyY2UgZW1pdHRlciBvYmplY3RcbiAqIEByZXR1cm4ge0V2ZW50SGFuZGxlcn0gdGhpc1xuICovXG5FdmVudEhhbmRsZXIucHJvdG90eXBlLnVuc3Vic2NyaWJlID0gZnVuY3Rpb24gdW5zdWJzY3JpYmUoc291cmNlKSB7XG4gICAgdmFyIGluZGV4ID0gdGhpcy51cHN0cmVhbS5pbmRleE9mKHNvdXJjZSk7XG4gICAgaWYgKGluZGV4ID49IDApIHtcbiAgICAgICAgdGhpcy51cHN0cmVhbS5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICBmb3IgKHZhciB0eXBlIGluIHRoaXMudXBzdHJlYW1MaXN0ZW5lcnMpIHtcbiAgICAgICAgICAgIHNvdXJjZS5yZW1vdmVMaXN0ZW5lcih0eXBlLCB0aGlzLnVwc3RyZWFtTGlzdGVuZXJzW3R5cGVdKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRXZlbnRIYW5kbGVyO1xuIiwiLyogVGhpcyBTb3VyY2UgQ29kZSBGb3JtIGlzIHN1YmplY3QgdG8gdGhlIHRlcm1zIG9mIHRoZSBNb3ppbGxhIFB1YmxpY1xuICogTGljZW5zZSwgdi4gMi4wLiBJZiBhIGNvcHkgb2YgdGhlIE1QTCB3YXMgbm90IGRpc3RyaWJ1dGVkIHdpdGggdGhpc1xuICogZmlsZSwgWW91IGNhbiBvYnRhaW4gb25lIGF0IGh0dHA6Ly9tb3ppbGxhLm9yZy9NUEwvMi4wLy5cbiAqXG4gKiBPd25lcnM6IGFkbmFuQGZhbW8udXNcbiAqXG4gKiBAbGljZW5zZSBNUEwgMi4wXG4gKiBAY29weXJpZ2h0IEZhbW91cyBJbmR1c3RyaWVzLCBJbmMuIDIwMTRcbiAqL1xuXG4gJ3VzZSBzdHJpY3QnO1xuXG52YXIgVFJBTlNGT1JNID0gJ3RyYW5zZm9ybSc7XG52YXIgU0laRSA9ICdzaXplJztcbnZhciBPUEFDSVRZID0gJ29wYWNpdHknO1xudmFyIE1BVEVSSUFMUyA9ICdtYXRlcmlhbHMnO1xuXG52YXIgVmVjdG9yID0gcmVxdWlyZSgnLi92ZWN0b3InKTtcbnZhciBJbmRleGVyID0gcmVxdWlyZSgnLi9pbmRleGVyJyk7XG52YXIgRW50aXR5UmVnaXN0cnkgPSByZXF1aXJlKCcuLi9jb3JlL0VudGl0eVJlZ2lzdHJ5Jyk7XG52YXIgVGFyZ2V0ID0gcmVxdWlyZSgnLi4vY29yZS9jb21wb25lbnRzL1RhcmdldCcpO1xuXG4vKipcbiAqIEdlb21ldHJ5IGlzIGEgY29tcG9uZW50IHRoYXQgZGVmaW5lcyB0aGUgZGF0YSB0aGF0IHNob3VsZFxuICogICBiZSBkcmF3biB0byB0aGUgd2ViR0wgY2FudmFzLiBNYW5hZ2VzIHZlcnRleCBkYXRhIGFuZCBhdHRyaWJ1dGVzLlxuICpcbiAqIEBjbGFzcyBHZW9tZXRyeVxuICogQGNvbXBvbmVudFxuICogQGNvbnN0cnVjdG9yXG4gKiBcbiAqIEBwYXJhbSB7RW50aXR5fSBlbnRpdHkgRW50aXR5IHRoYXQgdGhlIEdlb21ldHJ5IGlzIGEgY29tcG9uZW50IG9mXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyBpbnN0YW50aWF0aW9uIG9wdGlvbnNcbiAqL1xuXG5mdW5jdGlvbiBHZW9tZXRyeShlbnRpdHksIG9wdGlvbnMpIHtcbiAgICBUYXJnZXQuY2FsbCh0aGlzLCBlbnRpdHksIHtcbiAgICAgICAgdmVydGljaWVzOiBbbmV3IEZsb2F0MzJBcnJheShbMCwgMCwgMCwgMV0pLFxuICAgICAgICAgICAgICAgICAgICBuZXcgRmxvYXQzMkFycmF5KFswLCAwLCAwLCAxXSksXG4gICAgICAgICAgICAgICAgICAgIG5ldyBGbG9hdDMyQXJyYXkoWzAsIDAsIDAsIDFdKSxcbiAgICAgICAgICAgICAgICAgICAgbmV3IEZsb2F0MzJBcnJheShbMCwgMCwgMCwgMV0pXVxuICAgIH0pO1xuXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgICBFbnRpdHlSZWdpc3RyeS5yZWdpc3RlcihlbnRpdHksICdHZW9tZXRyaWVzJyk7XG4gICAgRW50aXR5UmVnaXN0cnkucmVnaXN0ZXIoZW50aXR5LCAnUmVuZGVyYWJsZXMnKTtcbiAgICBcbiAgICB0aGlzLmVudGl0eSA9IGVudGl0eTtcbiAgICB0aGlzLmNodW5rcyA9IHt9O1xuICAgIHRoaXMudmVydGV4QnVmZmVycyA9IHt9O1xuICAgIHRoaXMuaW5kZXhCdWZmZXJzID0ge307XG4gICAgdGhpcy5hZGRWZXJ0ZXhCdWZmZXIoJ3ZlcnRpY2VzJywgJ2FfcG9zJyk7XG4gICAgdGhpcy5hZGRWZXJ0ZXhCdWZmZXIoJ2Nvb3JkcycsICdhX3RleENvb3JkJyk7XG4gICAgdGhpcy5hZGRWZXJ0ZXhCdWZmZXIoJ25vcm1hbHMnLCAnYV9ub3JtYWwnKTtcbiAgICBpZiAob3B0aW9ucy5jb2xvcnMpIHRoaXMuYWRkVmVydGV4QnVmZmVyKCdjb2xvcnMnLCAnYV9jb2xvcicpO1xuICAgIGlmICghKCd0cmlhbmdsZXMnIGluIG9wdGlvbnMpIHx8IG9wdGlvbnMudHJpYW5nbGVzKSB0aGlzLmFkZEluZGV4QnVmZmVyKCd0cmlhbmdsZXMnKTtcbiAgICBpZiAob3B0aW9ucy5saW5lcykgdGhpcy5hZGRJbmRleEJ1ZmZlcignbGluZXMnKTtcbiAgICB0aGlzLnNwZWMgPSB7XG4gICAgICAgIHByaW1pdGl2ZTogJ3RyaWFuZ2xlcycsXG4gICAgICAgIHJlc29sdXRpb246IFtpbm5lcldpZHRoIC8gMiwgaW5uZXJIZWlnaHQgLyAyXSxcbiAgICAgICAgbW91c2U6IFswLDBdLFxuICAgICAgICBicmlnaHRuZXNzOiAxLCBcbiAgICAgICAgb3BhY2l0eTogMSxcbiAgICAgICAgb3JpZ2luOiBbLjUsIC41XSxcbiAgICAgICAgZ2VvbWV0cnk6IHtcbiAgICAgICAgICAgIHZlcnRleEJ1ZmZlcnM6IHRoaXMudmVydGV4QnVmZmVycyxcbiAgICAgICAgICAgIGluZGV4QnVmZmVyczogdGhpcy5pbmRleEJ1ZmZlcnNcbiAgICAgICAgfVxuICAgIH07XG59XG5cbkdlb21ldHJ5LnRvU3RyaW5nID0gIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gJ2dlb21ldHJ5Jztcbn07XG5cblxuR2VvbWV0cnkucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShUYXJnZXQucHJvdG90eXBlKTtcbkdlb21ldHJ5LnByb3RvdHlwZS5hZGRWZXJ0ZXhCdWZmZXIgPSBmdW5jdGlvbiBhZGRWZXJ0ZXhCdWZmZXIobmFtZSwgYXR0cmlidXRlKSB7XG4gICAgdmFyIGJ1ZmZlciA9IHRoaXMudmVydGV4QnVmZmVyc1thdHRyaWJ1dGVdID0gbmV3IEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIEZsb2F0MzJBcnJheSk7XG4gICAgYnVmZmVyLm5hbWUgPSBuYW1lO1xuICAgIHRoaXNbbmFtZV0gPSBbXTtcbn07XG5cbkdlb21ldHJ5LnByb3RvdHlwZS5hZGRJbmRleEJ1ZmZlciA9IGZ1bmN0aW9uIGFkZEluZGV4QnVmZmVyKG5hbWUpIHtcbiAgICB2YXIgYnVmZmVyID0gdGhpcy5pbmRleEJ1ZmZlcnNbbmFtZV0gPSBuZXcgQnVmZmVyKGdsLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCBVaW50MTZBcnJheSk7XG4gICAgdGhpc1tuYW1lXSA9IFtdO1xufTtcblxuR2VvbWV0cnkucHJvdG90eXBlLmNvbXBpbGUgPSBmdW5jdGlvbiBjb21waWxlKCkge1xuICAgIGZvciAodmFyIGF0dHJpYnV0ZSBpbiB0aGlzLnZlcnRleEJ1ZmZlcnMpIHtcbiAgICAgICAgdmFyIGJ1ZmZlciA9IHRoaXMudmVydGV4QnVmZmVyc1thdHRyaWJ1dGVdO1xuICAgICAgICBidWZmZXIuZGF0YSA9IHRoaXNbYnVmZmVyLm5hbWVdO1xuICAgICAgICBidWZmZXIuY29tcGlsZSgpO1xuICAgIH1cblxuICAgIGZvciAodmFyIG5hbWUgaW4gdGhpcy5pbmRleEJ1ZmZlcnMpIHtcbiAgICAgICAgdmFyIGJ1ZmZlciA9IHRoaXMuaW5kZXhCdWZmZXJzW25hbWVdO1xuICAgICAgICBidWZmZXIuZGF0YSA9IHRoaXNbbmFtZV07XG4gICAgICAgIGJ1ZmZlci5jb21waWxlKCk7XG4gICAgfVxufTtcblxuR2VvbWV0cnkucHJvdG90eXBlLmFkZE5vcm1hbHMgPSBmdW5jdGlvbiBhZGROb3JtYWxzKCkge1xuICAgIGlmICghdGhpcy5ub3JtYWxzKSB0aGlzLmFkZFZlcnRleEJ1ZmZlcignbm9ybWFscycsICdnbF9Ob3JtYWwnKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMudmVydGljZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdGhpcy5ub3JtYWxzW2ldID0gbmV3IFZlY3RvcigpO1xuICAgIH1cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMudHJpYW5nbGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciB0ID0gdGhpcy50cmlhbmdsZXNbaV07XG4gICAgICAgIHZhciBhID0gVmVjdG9yLmZyb21BcnJheSh0aGlzLnZlcnRpY2VzW3RbMF1dKTtcbiAgICAgICAgdmFyIGIgPSBWZWN0b3IuZnJvbUFycmF5KHRoaXMudmVydGljZXNbdFsxXV0pO1xuICAgICAgICB2YXIgYyA9IFZlY3Rvci5mcm9tQXJyYXkodGhpcy52ZXJ0aWNlc1t0WzJdXSk7XG4gICAgICAgIHZhciBub3JtYWwgPSBiLnN1YihhKS5jcm9zcyhjLnN1YihhKSkubm9ybWFsaXplKCk7XG4gICAgICAgIHRoaXMubm9ybWFsc1t0WzBdXSA9IHRoaXMubm9ybWFsc1t0WzBdXS5hZGQobm9ybWFsKTtcbiAgICAgICAgdGhpcy5ub3JtYWxzW3RbMV1dID0gdGhpcy5ub3JtYWxzW3RbMV1dLmFkZChub3JtYWwpO1xuICAgICAgICB0aGlzLm5vcm1hbHNbdFsyXV0gPSB0aGlzLm5vcm1hbHNbdFsyXV0uYWRkKG5vcm1hbCk7XG4gICAgfVxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy52ZXJ0aWNlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB0aGlzLm5vcm1hbHNbaV0gPSB0aGlzLm5vcm1hbHNbaV0ubm9ybWFsaXplKCkudG9BcnJheSgpO1xuICAgIH1cbiAgICB0aGlzLmNvbXBpbGUoKTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbkdlb21ldHJ5LnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IEdlb21ldHJ5O1xuXG5HZW9tZXRyeS5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciB0cmFuc2Zvcm0gPSB0aGlzLmVudGl0eS5nZXRDb21wb25lbnQoVFJBTlNGT1JNKTtcbiAgICB2YXIgb3BhY2l0eSA9IHRoaXMuZW50aXR5LmdldENvbXBvbmVudChPUEFDSVRZKTtcbiAgICB2YXIgc3VyZmFjZSA9IHRoaXMuZW50aXR5LmdldENvbXBvbmVudCgnc3VyZmFjZScpO1xuXG4gICAgdGhpcy5zcGVjLnRyYW5zZm9ybSA9IHRyYW5zZm9ybS5nZXRHbG9iYWxNYXRyaXgoKTtcbiAgICB0aGlzLnNwZWMub3BhY2l0eSA9IG9wYWNpdHkgPyBvcGFjaXR5Ll9nbG9iYWxPcGFjaXR5IDogMTsgXG4gICAgXG4gICAgaWYgKHN1cmZhY2UpIHRoaXMuc3BlYy5vcmlnaW4gPSBzdXJmYWNlLnNwZWMub3JpZ2luO1xuXG4gICAgcmV0dXJuIHRoaXMuc3BlYztcbn07XG5cbkdlb21ldHJ5LnByb3RvdHlwZS5sb2FkRnJvbU9iaiA9IGZ1bmN0aW9uIGxvYWRGcm9tT2JqKHVybCwgb3B0aW9ucykge1xuICAgIHZhciB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbiAgICB4aHIub3BlbignR0VUJywgdXJsKTtcbiAgICB4aHIub25sb2FkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBsb2FkT2JqLmNhbGwodGhpcywgeGhyLnJlc3BvbnNlVGV4dCwgb3B0aW9ucy5zY2FsZSB8fCAuMDA1LCBvcHRpb25zLm9mZnNldCB8fCBbMCwgMCwgMF0pO1xuICAgICAgICB0aGlzLmNvbXBpbGUoKTtcbiAgICB9LmJpbmQodGhpcyk7XG4gICAgeGhyLnNlbmQobnVsbCk7XG5cbiAgICByZXR1cm4gdGhpcztcbn07XG5cbmZ1bmN0aW9uIGxvYWRPYmoob2JqLCBzY2FsZSwgb2Zmc2V0KSB7IFxuICAgICAgICB2YXIgdnRzID0gW107IFxuICAgICAgICB2YXIgbm1sID0gW107IFxuICAgICAgICB2YXIgaW5kdiA9IFtdOyAgICAgICAgIFxuICAgICAgICB2YXIgaW5kdCA9IFtdOyBcbiAgICAgICAgdmFyIGluZG4gPSBbXTsgXG4gICAgICAgIHZhciB0eGMgPSBbXTsgICAgIFxuICAgICAgICB2YXIgbGluZXMgPSBvYmouc3BsaXQoJ1xcbicpOyAgICAgXG4gICAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCBsaW5lcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIGxpbmUgPSBsaW5lc1tpXTsgXG4gICAgICAgICAgICBpZiAobGluZS5pbmRleE9mKCd2ICcpICE9PSAtMSkgeyBcbiAgICAgICAgICAgICAgICB2YXIgdmVydGV4ID0gbGluZS5zcGxpdCgnICcpOyBcbiAgICAgICAgICAgICAgICB2YXIgdnggPSBwYXJzZUZsb2F0KHZlcnRleFsxXSkgKiBzY2FsZSArIG9mZnNldFswXTsgXG4gICAgICAgICAgICAgICAgdmFyIHZ5ID0gcGFyc2VGbG9hdCh2ZXJ0ZXhbMl0pICogc2NhbGUgKyBvZmZzZXRbMV07IFxuICAgICAgICAgICAgICAgIHZhciB2eiA9IHBhcnNlRmxvYXQodmVydGV4WzNdKSAqIHNjYWxlICsgb2Zmc2V0WzJdOyBcbiAgICAgICAgICAgICAgICB2dHMucHVzaChbdngsIHZ5LCB2el0pOyAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICB9ICAgXG4gICAgICAgICAgICBlbHNlIGlmIChsaW5lLmluZGV4T2YoJ3Z0ICcpICE9PSAtMSkgeyAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB2YXIgdGV4Y29vcmQgPSBsaW5lLnNwbGl0KCcgJyk7ICAgICAgIFxuICAgICAgICAgICAgICAgIHZhciB0eCA9IHBhcnNlRmxvYXQodGV4Y29vcmRbMV0pOyBcbiAgICAgICAgICAgICAgICB2YXIgdHkgPSBwYXJzZUZsb2F0KHRleGNvb3JkWzJdKTsgXG4gICAgICAgICAgICAgICAgdHhjLnB1c2goW3R4LCB0eV0pOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAobGluZS5pbmRleE9mKCd2biAnKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICB2YXIgbm9ybWFsID0gbGluZS5zcGxpdCgnICcpOyAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgdmFyIG54ID0gcGFyc2VGbG9hdChub3JtYWxbMV0pOyBcbiAgICAgICAgICAgICAgICB2YXIgbnkgPSBwYXJzZUZsb2F0KG5vcm1hbFsyXSk7IFxuICAgICAgICAgICAgICAgIHZhciBueiA9IHBhcnNlRmxvYXQobm9ybWFsWzNdKTsgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIG5tbC5wdXNoKFtueCwgbnksIG56XSk7ICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChsaW5lLmluZGV4T2YoJ2YgJykgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgdmFyIGluZGV4ID0gbGluZS5zcGxpdCgnICcpOyAgICAgXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgKGluZGV4WzFdLmluZGV4T2YoJy8vJykgIT09IC0xKSB7ICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgdmFyIGkxID0gaW5kZXhbMV0uc3BsaXQoJy8vJyk7IFxuICAgICAgICAgICAgICAgICAgICB2YXIgaTIgPSBpbmRleFsyXS5zcGxpdCgnLy8nKTsgXG4gICAgICAgICAgICAgICAgICAgIHZhciBpMyA9IGluZGV4WzNdLnNwbGl0KCcvLycpOyBcbiAgICAgICAgICAgICAgICAgICAgaW5kdi5wdXNoKHBhcnNlRmxvYXQoaTFbMF0pIC0xLCBwYXJzZUZsb2F0KGkyWzBdKSAtIDEsIHBhcnNlRmxvYXQoaTNbMF0pIC0gMSk7IFxuICAgICAgICAgICAgICAgICAgICBpbmRuLnB1c2gocGFyc2VGbG9hdChpMVsxXSkgLTEsIHBhcnNlRmxvYXQoaTJbMV0pIC0gMSwgcGFyc2VGbG9hdChpM1sxXSkgLSAxKTsgXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGluZGV4WzFdLmluZGV4T2YoJy8nKSAhPT0gLTEpIHsgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICB2YXIgaTEgPSBpbmRleFsxXS5zcGxpdCgnLycpOyBcbiAgICAgICAgICAgICAgICAgICAgdmFyIGkyID0gaW5kZXhbMl0uc3BsaXQoJy8nKTsgXG4gICAgICAgICAgICAgICAgICAgIHZhciBpMyA9IGluZGV4WzNdLnNwbGl0KCcvJyk7ICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBpbmR2LnB1c2gocGFyc2VGbG9hdChpMVswXSkgLSAxLCBwYXJzZUZsb2F0KGkyWzBdKSAtIDEsIHBhcnNlRmxvYXQoaTNbMF0pIC0gMSk7IFxuICAgICAgICAgICAgICAgICAgICBpbmR0LnB1c2gocGFyc2VGbG9hdChpMVsxXSkgLSAxLCBwYXJzZUZsb2F0KGkyWzFdKSAtIDEsIHBhcnNlRmxvYXQoaTNbMV0pIC0gMSk7ICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGluZG4ucHVzaChwYXJzZUZsb2F0KGkxWzJdKSAtIDEsIHBhcnNlRmxvYXQoaTJbMl0pIC0gMSwgcGFyc2VGbG9hdChpM1syXSkgLSAxKTsgXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgeyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgaW5kdi5wdXNoKHBhcnNlRmxvYXQoaW5kZXhbMV0pIC0gMSwgcGFyc2VGbG9hdChpbmRleFsyXSkgLSAxLCBwYXJzZUZsb2F0KGluZGV4WzNdKSAtIDEpOyBcbiAgICAgICAgICAgICAgICB9ICAgIFxuICAgICAgICAgICAgfVxuICAgICAgICB9ICAgICAgICBcblxuICAgIG1ha2VQcm9wZXJBcnJheShpbmR2LCB2dHMpO1xuICAgIHRoaXMudmVydGljZXMgPSB2dHM7XG4gICAgLy90aGlzLm5vcm1hbHMgPSBtYWtlUHJvcGVyQXJyYXkoaW5kbiwgbm1sKTsgXG4gICAgLy90aGlzLmNvb3JkcyA9IG1ha2VQcm9wZXJBcnJheShpbmR0LCB0eGMpOyBcblxufTsgICAgXG5cbmZ1bmN0aW9uIG1ha2VQcm9wZXJBcnJheShpbmRpY2VzLCBhcnJheSkgeyAgICAgICAgICAgIFxuICAgIHZhciBvdXRwdXQgPSBbXTsgXG4gICAgZm9yKHZhciBpID0gMDsgaSA8IGluZGljZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIHRlbXAgPSBhcnJheVtpbmRpY2VzW2ldXTsgXG4gICAgICAgIGZvcih2YXIgaiA9IDA7IGogPCB0ZW1wLmxlbmd0aDsgaisrKVxuICAgICAgICAgICAgb3V0cHV0LnB1c2godGVtcFtqXSk7ICAgICBcbiAgICB9IFxuICAgIHJldHVybiBvdXRwdXQ7IFxufVxuXG4vKipcbiAqIEJ1ZmZlciBpcyBhIHByaXZhdGUgb2JqZWN0IHRoYXQgc3RvcmVzIHJlZmVyZW5jZXMgdG8gcGFzcyBkYXRhIGZyb21cbiAqIGEgdHlwZWQgYXJyYXkgdG8gYSBWQk8uXG4gKlxuICogQGNsYXNzIEdlb21ldHJ5XG4gKiBAY29tcG9uZW50XG4gKiBAY29uc3RydWN0b3JcbiAqIFxuICogQHBhcmFtIHtUYXJnZXR9IExvY2F0aW9uIG9mIHRoZSB2ZXJ0ZXggZGF0YSB0aGF0IGlzIGJlaW5nIHVwbG9hZGVkIHRvIGdsLlxuICogQHBhcmFtIHtUeXBlfSBDb250c3RydWN0b3IgZm9yIHRoZSB0eXBlZCBhcnJheSB3aGljaCB3aWxsIHN0b3JlIGRhdGEgcGFzc2VkIGZyb20gdGhlIGFwcGxpY2F0aW9uLlxuICovXG5cbmZ1bmN0aW9uIEJ1ZmZlcih0YXJnZXQsIHR5cGUpIHtcbiAgICB0aGlzLmJ1ZmZlciA9IG51bGw7XG4gICAgdGhpcy50YXJnZXQgPSB0YXJnZXQ7XG4gICAgdGhpcy50eXBlID0gdHlwZTtcbiAgICB0aGlzLmRhdGEgPSBbXTtcbn1cblxuQnVmZmVyLnByb3RvdHlwZSA9IHtcbiAgICBjb21waWxlOiBmdW5jdGlvbih0eXBlKSB7XG4gICAgICAgIHZhciBkYXRhID0gW107XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBjaHVuayA9IDEwMDAwOyBpIDwgdGhpcy5kYXRhLmxlbmd0aDsgaSArPSBjaHVuaykge1xuICAgICAgICAgICAgZGF0YSA9IEFycmF5LnByb3RvdHlwZS5jb25jYXQuYXBwbHkoZGF0YSwgdGhpcy5kYXRhLnNsaWNlKGksIGkgKyBjaHVuaykpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBzcGFjaW5nID0gdGhpcy5kYXRhLmxlbmd0aCA/IGRhdGEubGVuZ3RoIC8gdGhpcy5kYXRhLmxlbmd0aCA6IDA7XG4gICAgICAgIGlmIChzcGFjaW5nICE9IE1hdGgucm91bmQoc3BhY2luZykpIHRocm93ICdidWZmZXIgZWxlbWVudHMgbm90IG9mIGNvbnNpc3RlbnQgc2l6ZSwgYXZlcmFnZSBzaXplIGlzICcgKyBzcGFjaW5nO1xuICAgICAgICB0aGlzLmJ1ZmZlciA9IHRoaXMuYnVmZmVyIHx8IGdsLmNyZWF0ZUJ1ZmZlcigpO1xuICAgICAgICB0aGlzLmJ1ZmZlci5sZW5ndGggPSBkYXRhLmxlbmd0aDtcbiAgICAgICAgdGhpcy5idWZmZXIuc3BhY2luZyA9IHNwYWNpbmc7XG4gICAgICAgIGdsLmJpbmRCdWZmZXIodGhpcy50YXJnZXQsIHRoaXMuYnVmZmVyKTtcbiAgICAgICAgZ2wuYnVmZmVyRGF0YSh0aGlzLnRhcmdldCwgbmV3IHRoaXMudHlwZShkYXRhKSwgdHlwZSB8fCBnbC5TVEFUSUNfRFJBVyk7XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBHZW9tZXRyeTtcbiIsIi8qIFRoaXMgU291cmNlIENvZGUgRm9ybSBpcyBzdWJqZWN0IHRvIHRoZSB0ZXJtcyBvZiB0aGUgTW96aWxsYSBQdWJsaWNcbiAqIExpY2Vuc2UsIHYuIDIuMC4gSWYgYSBjb3B5IG9mIHRoZSBNUEwgd2FzIG5vdCBkaXN0cmlidXRlZCB3aXRoIHRoaXNcbiAqIGZpbGUsIFlvdSBjYW4gb2J0YWluIG9uZSBhdCBodHRwOi8vbW96aWxsYS5vcmcvTVBMLzIuMC8uXG4gKlxuICogT3duZXJzOiBhZG5hbkBmYW1vLnVzXG4gKlxuICogQGxpY2Vuc2UgTVBMIDIuMFxuICogQGNvcHlyaWdodCBGYW1vdXMgSW5kdXN0cmllcywgSW5jLiAyMDE0XG4gKi9cblxuICd1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gSW5kZXhlcigpIHtcbiAgICB0aGlzLnVuaXF1ZSA9IFtdO1xuICAgIHRoaXMuaW5kaWNlcyA9IFtdO1xuICAgIHRoaXMubWFwID0ge307XG59XG5cbkluZGV4ZXIucHJvdG90eXBlID0ge1xuICAgIGFkZDogZnVuY3Rpb24ob2JqKSB7XG4gICAgICAgIHZhciBrZXkgPSBKU09OLnN0cmluZ2lmeShvYmopO1xuICAgICAgICBpZiAoISAoa2V5IGluIHRoaXMubWFwKSkge1xuICAgICAgICAgICAgdGhpcy5tYXBba2V5XSA9IHRoaXMudW5pcXVlLmxlbmd0aDtcbiAgICAgICAgICAgIHRoaXMudW5pcXVlLnB1c2gob2JqKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5tYXBba2V5XTtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEluZGV4ZXI7XG4iLCIvKiBUaGlzIFNvdXJjZSBDb2RlIEZvcm0gaXMgc3ViamVjdCB0byB0aGUgdGVybXMgb2YgdGhlIE1vemlsbGEgUHVibGljXG4gKiBMaWNlbnNlLCB2LiAyLjAuIElmIGEgY29weSBvZiB0aGUgTVBMIHdhcyBub3QgZGlzdHJpYnV0ZWQgd2l0aCB0aGlzXG4gKiBmaWxlLCBZb3UgY2FuIG9idGFpbiBvbmUgYXQgaHR0cDovL21vemlsbGEub3JnL01QTC8yLjAvLlxuICpcbiAqIE93bmVyczogYWRuYW5AZmFtby51c1xuICpcbiAqIEBsaWNlbnNlIE1QTCAyLjBcbiAqIEBjb3B5cmlnaHQgRmFtb3VzIEluZHVzdHJpZXMsIEluYy4gMjAxNFxuICovXG5cbid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoZ2wpIHtcbiAgICBmdW5jdGlvbiByZWdleE1hcChyZWdleCwgdGV4dCwgY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIHJlc3VsdDtcbiAgICAgICAgd2hpbGUgKChyZXN1bHQgPSByZWdleC5leGVjKHRleHQpKSAhPSBudWxsKSBjYWxsYmFjayhyZXN1bHQpO1xuICAgIH1cbiAgICBcbiAgICBmdW5jdGlvbiBTaGFkZXIodmVydGV4U291cmNlLCBmcmFnbWVudFNvdXJjZSkge1xuICAgICAgICB0aGlzLnZzID0gdmVydGV4U291cmNlO1xuICAgICAgICB0aGlzLmZzID0gZnJhZ21lbnRTb3VyY2U7XG5cbiAgICAgICAgdmFyIGhlYWRlciA9IFsncHJlY2lzaW9uIG1lZGl1bXAgZmxvYXQ7JyxcbiAgICAgICAgICAgICAgICAgICAgICAndW5pZm9ybSBtYXQ0IHRyYW5zZm9ybTsnLFxuICAgICAgICAgICAgICAgICAgICAgICd1bmlmb3JtIG1hdDQgcGVyc3BlY3RpdmU7JyxcbiAgICAgICAgICAgICAgICAgICAgICAndW5pZm9ybSBmbG9hdCBmb2NhbERlcHRoOycsXG4gICAgICAgICAgICAgICAgICAgICAgJ3VuaWZvcm0gdmVjMyBzaXplOycsXG4gICAgICAgICAgICAgICAgICAgICAgJ3VuaWZvcm0gdmVjMyByZXNvbHV0aW9uOycsXG4gICAgICAgICAgICAgICAgICAgICAgJ3VuaWZvcm0gdmVjMiBvcmlnaW47JyxcbiAgICAgICAgICAgICAgICAgICAgICAndW5pZm9ybSBzYW1wbGVyMkQgdGV4dHVyZTsnLFxuICAgICAgICAgICAgICAgICAgICAgICd1bmlmb3JtIGZsb2F0IGJyaWdodG5lc3M7JyxcbiAgICAgICAgICAgICAgICAgICAgICAndW5pZm9ybSBmbG9hdCBvcGFjaXR5OycsXG4gICAgICAgICAgICAgICAgICAgICAgJ3VuaWZvcm0gZmxvYXQgY2xvY2s7JyxcbiAgICAgICAgICAgICAgICAgICAgICAndW5pZm9ybSB2ZWMyIG1vdXNlOycsXG4gICAgICAgICAgICAgICAgICAgICAgJ3ZhcnlpbmcgdmVjMyB2X25vcm1hbDsnXG4gICAgICAgICAgICAgICAgICAgICBdLmpvaW4oJ1xcbicpO1xuICAgICAgICBcbiAgICAgICAgdmFyIHZlcnRleEhlYWRlciA9IGhlYWRlciArIFtcbiAgICAgICAgICAgICdhdHRyaWJ1dGUgdmVjNCBhX3BvczsnLFxuICAgICAgICAgICAgJ2F0dHJpYnV0ZSB2ZWM0IGFfdXY7JyxcbiAgICAgICAgICAgICdhdHRyaWJ1dGUgdmVjMyBhX25vcm1hbDsnLFxuICAgICAgICAgICAgJ2F0dHJpYnV0ZSB2ZWM0IGFfY29sb3I7J1xuICAgICAgICBdLmpvaW4oJ1xcbicpO1xuXG4gICAgICAgIHZhciBmcmFnbWVudEhlYWRlciA9IGhlYWRlciArICcnO1xuICAgICAgICB2ZXJ0ZXhTb3VyY2UgPSB2ZXJ0ZXhIZWFkZXIgICsgdmVydGV4U291cmNlO1xuICAgICAgICBmcmFnbWVudFNvdXJjZSA9IGZyYWdtZW50SGVhZGVyICsgZnJhZ21lbnRTb3VyY2U7XG5cbiAgICAgICAgZnVuY3Rpb24gY29tcGlsZVNvdXJjZSh0eXBlLCBzb3VyY2UpIHtcbiAgICAgICAgICAgIHZhciBzaGFkZXIgPSBnbC5jcmVhdGVTaGFkZXIodHlwZSk7XG4gICAgICAgICAgICBnbC5zaGFkZXJTb3VyY2Uoc2hhZGVyLCBzb3VyY2UpO1xuICAgICAgICAgICAgZ2wuY29tcGlsZVNoYWRlcihzaGFkZXIpO1xuICAgICAgICAgICAgaWYgKCFnbC5nZXRTaGFkZXJQYXJhbWV0ZXIoc2hhZGVyLCBnbC5DT01QSUxFX1NUQVRVUykpIHtcbiAgICAgICAgICAgICAgICB2YXIgaSA9ICAxO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHNvdXJjZS5yZXBsYWNlKC9cXG4vZywgZnVuY3Rpb24gKCkgeyByZXR1cm4gJ1xcbicgKyAoaSsrKSArICc6ICc7IH0pKTtcbiAgICAgICAgICAgICAgICB0aHJvdyAnY29tcGlsZSBlcnJvcjogJyArIGdsLmdldFNoYWRlckluZm9Mb2coc2hhZGVyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBzaGFkZXI7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMucHJvZ3JhbSA9IGdsLmNyZWF0ZVByb2dyYW0oKTtcbiAgICAgICAgZ2wuYXR0YWNoU2hhZGVyKHRoaXMucHJvZ3JhbSwgY29tcGlsZVNvdXJjZShnbC5WRVJURVhfU0hBREVSLCB2ZXJ0ZXhTb3VyY2UpKTtcbiAgICAgICAgZ2wuYXR0YWNoU2hhZGVyKHRoaXMucHJvZ3JhbSwgY29tcGlsZVNvdXJjZShnbC5GUkFHTUVOVF9TSEFERVIsIGZyYWdtZW50U291cmNlKSk7XG4gICAgICAgIGdsLmxpbmtQcm9ncmFtKHRoaXMucHJvZ3JhbSk7XG4gICAgICAgIGlmICghZ2wuZ2V0UHJvZ3JhbVBhcmFtZXRlcih0aGlzLnByb2dyYW0sIGdsLkxJTktfU1RBVFVTKSkge1xuICAgICAgICAgICAgdGhyb3cgJ2xpbmsgZXJyb3I6ICcgKyBnbC5nZXRQcm9ncmFtSW5mb0xvZyh0aGlzLnByb2dyYW0pO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuYXR0cmlidXRlcyA9IHt9O1xuICAgICAgICB0aGlzLnVuaWZvcm1Mb2NhdGlvbnMgPSB7fTtcblxuICAgICAgICB2YXIgaXNTYW1wbGVyID0gdGhpcy5pc1NhbXBsZXIgPSB7fTtcblxuICAgICAgICByZWdleE1hcCgvdW5pZm9ybVxccytzYW1wbGVyKDFEfDJEfDNEfEN1YmUpXFxzKyhcXHcrKVxccyo7L2csIHZlcnRleFNvdXJjZSArIGZyYWdtZW50U291cmNlLFxuICAgICAgICAgICAgICAgICBmdW5jdGlvbihncm91cHMpIHsgaXNTYW1wbGVyW2dyb3Vwc1syXV0gPSAxOyB9XG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaXNOdW1iZXIobikge1xuICAgICAgICByZXR1cm4gISBpc05hTihwYXJzZUZsb2F0KG4pKSAmJiBpc0Zpbml0ZShuKTtcbiAgICB9XG5cbiAgICBTaGFkZXIucHJvdG90eXBlID0ge1xuICAgICAgICB1bmlmb3JtczogZnVuY3Rpb24odW5pZm9ybXMpIHtcbiAgICAgICAgICAgIGdsLnVzZVByb2dyYW0odGhpcy5wcm9ncmFtKTtcblxuICAgICAgICAgICAgZm9yICh2YXIgbmFtZSBpbiB1bmlmb3Jtcykge1xuICAgICAgICAgICAgICAgIHZhciBsb2NhdGlvbiA9IHRoaXMudW5pZm9ybUxvY2F0aW9uc1tuYW1lXSB8fCBnbC5nZXRVbmlmb3JtTG9jYXRpb24odGhpcy5wcm9ncmFtLCBuYW1lKTtcbiAgICAgICAgICAgICAgICBpZiAoIWxvY2F0aW9uKSBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB0aGlzLnVuaWZvcm1Mb2NhdGlvbnNbbmFtZV0gPSBsb2NhdGlvbjtcbiAgICAgICAgICAgICAgICB2YXIgdmFsdWUgPSB1bmlmb3Jtc1tuYW1lXTtcbiAgICAgICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkgfHwgdmFsdWUgaW5zdGFuY2VvZiBGbG9hdDMyQXJyYXkpIHtcbiAgICAgICAgICAgICAgICAgICAgc3dpdGNoICh2YWx1ZS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAxOiBnbC51bmlmb3JtMWZ2KGxvY2F0aW9uLCBuZXcgRmxvYXQzMkFycmF5KHZhbHVlKSk7IGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIDI6IGdsLnVuaWZvcm0yZnYobG9jYXRpb24sIG5ldyBGbG9hdDMyQXJyYXkodmFsdWUpKTsgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgMzogZ2wudW5pZm9ybTNmdihsb2NhdGlvbiwgbmV3IEZsb2F0MzJBcnJheSh2YWx1ZSkpOyBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSA0OiBnbC51bmlmb3JtNGZ2KGxvY2F0aW9uLCBuZXcgRmxvYXQzMkFycmF5KHZhbHVlKSk7IGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIDk6IGdsLnVuaWZvcm1NYXRyaXgzZnYobG9jYXRpb24sIGZhbHNlLCBuZXcgRmxvYXQzMkFycmF5KHZhbHVlKSk7IGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIDE2OiBnbC51bmlmb3JtTWF0cml4NGZ2KGxvY2F0aW9uLCBmYWxzZSwgbmV3IEZsb2F0MzJBcnJheSh2YWx1ZSkpOyBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogdGhyb3cgJ2RvbnQga25vdyBob3cgdG8gbG9hZCB1bmlmb3JtIFwiJyArIG5hbWUgKyAnXCIgb2YgbGVuZ3RoICcgKyB2YWx1ZS5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGlzTnVtYmVyKHZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICAodGhpcy5pc1NhbXBsZXJbbmFtZV0gPyBnbC51bmlmb3JtMWkgOiBnbC51bmlmb3JtMWYpLmNhbGwoZ2wsIGxvY2F0aW9uLCB2YWx1ZSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgJ2F0dGVtcHRlZCB0byBzZXQgdW5pZm9ybSBcIicgKyBuYW1lICsgJ1wiIHRvIGludmFsaWQgdmFsdWUgJyArIHZhbHVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZHJhdzogZnVuY3Rpb24obWVzaCwgbW9kZSkge1xuICAgICAgICAgICAgdGhpcy5kcmF3QnVmZmVycyhtZXNoLnZlcnRleEJ1ZmZlcnMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc2guaW5kZXhCdWZmZXJzW21vZGUgPT0gZ2wuTElORVMgPyAnbGluZXMnIDogJ3RyaWFuZ2xlcyddLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcmd1bWVudHMubGVuZ3RoIDwgMiA/IGdsLlRSSUFOR0xFUyA6IG1vZGUpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGRyYXdCdWZmZXJzOiBmdW5jdGlvbih2ZXJ0ZXhCdWZmZXJzLCBpbmRleEJ1ZmZlciwgbW9kZSkge1xuICAgICAgICAgICAgdmFyIGxlbmd0aCA9IDA7XG4gICAgICAgICAgICBmb3IgKHZhciBhdHRyaWJ1dGUgaW4gdmVydGV4QnVmZmVycykge1xuICAgICAgICAgICAgICAgIHZhciBidWZmZXIgPSB2ZXJ0ZXhCdWZmZXJzW2F0dHJpYnV0ZV07XG4gICAgICAgICAgICAgICAgdmFyIGxvY2F0aW9uID0gdGhpcy5hdHRyaWJ1dGVzW2F0dHJpYnV0ZV0gfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIGdsLmdldEF0dHJpYkxvY2F0aW9uKHRoaXMucHJvZ3JhbSwgYXR0cmlidXRlKTtcbiAgICAgICAgICAgICAgICBpZiAobG9jYXRpb24gPT0gLTEgfHwgIWJ1ZmZlci5idWZmZXIpIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIHRoaXMuYXR0cmlidXRlc1thdHRyaWJ1dGVdID0gbG9jYXRpb247XG4gICAgICAgICAgICAgICAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIGJ1ZmZlci5idWZmZXIpO1xuICAgICAgICAgICAgICAgIGdsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KGxvY2F0aW9uKTtcbiAgICAgICAgICAgICAgICBnbC52ZXJ0ZXhBdHRyaWJQb2ludGVyKGxvY2F0aW9uLCBidWZmZXIuYnVmZmVyLnNwYWNpbmcsIGdsLkZMT0FULCBnbC5GQUxTRSwgMCwgMCk7XG4gICAgICAgICAgICAgICAgbGVuZ3RoID0gYnVmZmVyLmJ1ZmZlci5sZW5ndGggLyBidWZmZXIuYnVmZmVyLnNwYWNpbmc7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZvciAodmFyIGF0dHJpYnV0ZSBpbiB0aGlzLmF0dHJpYnV0ZXMpIHtcbiAgICAgICAgICAgICAgICBpZiAoIShhdHRyaWJ1dGUgaW4gdmVydGV4QnVmZmVycykpXG4gICAgICAgICAgICAgICAgICAgIGdsLmRpc2FibGVWZXJ0ZXhBdHRyaWJBcnJheSh0aGlzLmF0dHJpYnV0ZXNbYXR0cmlidXRlXSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChsZW5ndGggJiYgKCFpbmRleEJ1ZmZlciB8fCBpbmRleEJ1ZmZlci5idWZmZXIpKSB7XG4gICAgICAgICAgICAgICAgaWYgKGluZGV4QnVmZmVyKSB7XG4gICAgICAgICAgICAgICAgICAgIGdsLmJpbmRCdWZmZXIoZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIGluZGV4QnVmZmVyLmJ1ZmZlcik7XG4gICAgICAgICAgICAgICAgICAgIGdsLmRyYXdFbGVtZW50cyhtb2RlLCBpbmRleEJ1ZmZlci5idWZmZXIubGVuZ3RoLCBnbC5VTlNJR05FRF9TSE9SVCwgMCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZ2wuZHJhd0FycmF5cyhtb2RlLCAwLCBsZW5ndGgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIHJldHVybiBTaGFkZXI7XG59O1xuIiwiLyogVGhpcyBTb3VyY2UgQ29kZSBGb3JtIGlzIHN1YmplY3QgdG8gdGhlIHRlcm1zIG9mIHRoZSBNb3ppbGxhIFB1YmxpY1xuICogTGljZW5zZSwgdi4gMi4wLiBJZiBhIGNvcHkgb2YgdGhlIE1QTCB3YXMgbm90IGRpc3RyaWJ1dGVkIHdpdGggdGhpc1xuICogZmlsZSwgWW91IGNhbiBvYnRhaW4gb25lIGF0IGh0dHA6Ly9tb3ppbGxhLm9yZy9NUEwvMi4wLy5cbiAqXG4gKiBPd25lcjogZGF2aWRAZmFtby51c1xuICpcbiAqIEBsaWNlbnNlIE1QTCAyLjBcbiAqIEBjb3B5cmlnaHQgRmFtb3VzIEluZHVzdHJpZXMsIEluYy4gMjAxNFxuICovXG5cbid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBUaHJlZS1lbGVtZW50IGZsb2F0aW5nIHBvaW50IHZlY3Rvci5cbiAqXG4gKiBAY2xhc3MgVmVjdG9yXG4gKiBAY29uc3RydWN0b3JcbiAqXG4gKiBAcGFyYW0ge251bWJlcn0geCB4IGVsZW1lbnQgdmFsdWVcbiAqIEBwYXJhbSB7bnVtYmVyfSB5IHkgZWxlbWVudCB2YWx1ZVxuICogQHBhcmFtIHtudW1iZXJ9IHogeiBlbGVtZW50IHZhbHVlXG4gKi9cblxuZnVuY3Rpb24gVmVjdG9yKHgseSx6KSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDEpIHRoaXMuc2V0KHgpO1xuICAgIGVsc2Uge1xuICAgICAgICB0aGlzLnggPSB4IHx8IDA7XG4gICAgICAgIHRoaXMueSA9IHkgfHwgMDtcbiAgICAgICAgdGhpcy56ID0geiB8fCAwO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn1cbnZhciBfcmVnaXN0ZXIgPSBuZXcgVmVjdG9yKDAsMCwwKTtcblxuLyoqXG4gKiBBZGQgdGhpcyBlbGVtZW50LXdpc2UgdG8gYW5vdGhlciBWZWN0b3IsIGVsZW1lbnQtd2lzZS5cbiAqICAgTm90ZTogVGhpcyBzZXRzIHRoZSBpbnRlcm5hbCByZXN1bHQgcmVnaXN0ZXIsIHNvIG90aGVyIHJlZmVyZW5jZXMgdG8gdGhhdCB2ZWN0b3Igd2lsbCBjaGFuZ2UuXG4gKlxuICogQG1ldGhvZCBhZGRcbiAqIEBwYXJhbSB7VmVjdG9yfSB2IGFkZGVuZFxuICogQHJldHVybiB7VmVjdG9yfSB2ZWN0b3Igc3VtXG4gKi9cblZlY3Rvci5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24gYWRkKHYpIHtcbiAgICByZXR1cm4gX3NldFhZWi5jYWxsKF9yZWdpc3RlcixcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMueCArIHYueCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMueSArIHYueSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMueiArIHYuelxuICAgICAgICAgICAgICAgICAgICAgICApO1xufTtcblxuLyoqXG4gKiBTdWJ0cmFjdCBhbm90aGVyIHZlY3RvciBmcm9tIHRoaXMgdmVjdG9yLCBlbGVtZW50LXdpc2UuXG4gKiAgIE5vdGU6IFRoaXMgc2V0cyB0aGUgaW50ZXJuYWwgcmVzdWx0IHJlZ2lzdGVyLCBzbyBvdGhlciByZWZlcmVuY2VzIHRvIHRoYXQgdmVjdG9yIHdpbGwgY2hhbmdlLlxuICpcbiAqIEBtZXRob2Qgc3ViXG4gKiBAcGFyYW0ge1ZlY3Rvcn0gdiBzdWJ0cmFoZW5kXG4gKiBAcmV0dXJuIHtWZWN0b3J9IHZlY3RvciBkaWZmZXJlbmNlXG4gKi9cblZlY3Rvci5wcm90b3R5cGUuc3ViID0gZnVuY3Rpb24gc3ViKHYpIHtcbiAgICByZXR1cm4gX3NldFhZWi5jYWxsKF9yZWdpc3RlcixcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMueCAtIHYueCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMueSAtIHYueSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMueiAtIHYuelxuICAgICAgICAgICAgICAgICAgICAgICApO1xufTtcblxuLyoqXG4gKiBTY2FsZSBWZWN0b3IgYnkgZmxvYXRpbmcgcG9pbnQgci5cbiAqICAgTm90ZTogVGhpcyBzZXRzIHRoZSBpbnRlcm5hbCByZXN1bHQgcmVnaXN0ZXIsIHNvIG90aGVyIHJlZmVyZW5jZXMgdG8gdGhhdCB2ZWN0b3Igd2lsbCBjaGFuZ2UuXG4gKlxuICogQG1ldGhvZCBtdWx0XG4gKlxuICogQHBhcmFtIHtudW1iZXJ9IHIgc2NhbGFyXG4gKiBAcmV0dXJuIHtWZWN0b3J9IHZlY3RvciByZXN1bHRcbiAqL1xuVmVjdG9yLnByb3RvdHlwZS5tdWx0ID0gZnVuY3Rpb24gbXVsdChyKSB7XG4gICAgcmV0dXJuIF9zZXRYWVouY2FsbChfcmVnaXN0ZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICByICogdGhpcy54LFxuICAgICAgICAgICAgICAgICAgICAgICAgciAqIHRoaXMueSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHIgKiB0aGlzLnpcbiAgICAgICAgICAgICAgICAgICAgICAgKTtcbn07XG5cbi8qKlxuICogU2NhbGUgVmVjdG9yIGJ5IGZsb2F0aW5nIHBvaW50IDEvci5cbiAqICAgTm90ZTogVGhpcyBzZXRzIHRoZSBpbnRlcm5hbCByZXN1bHQgcmVnaXN0ZXIsIHNvIG90aGVyIHJlZmVyZW5jZXMgdG8gdGhhdCB2ZWN0b3Igd2lsbCBjaGFuZ2UuXG4gKlxuICogQG1ldGhvZCBkaXZcbiAqXG4gKiBAcGFyYW0ge251bWJlcn0gciBzY2FsYXJcbiAqIEByZXR1cm4ge1ZlY3Rvcn0gdmVjdG9yIHJlc3VsdFxuICovXG5WZWN0b3IucHJvdG90eXBlLmRpdiA9IGZ1bmN0aW9uIGRpdihyKSB7XG4gICAgcmV0dXJuIHRoaXMubXVsdCgxIC8gcik7XG59O1xuXG4vKipcbiAqIEdpdmVuIGFub3RoZXIgdmVjdG9yIHYsIHJldHVybiBjcm9zcyBwcm9kdWN0ICh2KXgodGhpcykuXG4gKiAgIE5vdGU6IFRoaXMgc2V0cyB0aGUgaW50ZXJuYWwgcmVzdWx0IHJlZ2lzdGVyLCBzbyBvdGhlciByZWZlcmVuY2VzIHRvIHRoYXQgdmVjdG9yIHdpbGwgY2hhbmdlLlxuICpcbiAqIEBtZXRob2QgY3Jvc3NcbiAqIEBwYXJhbSB7VmVjdG9yfSB2IExlZnQgSGFuZCBWZWN0b3JcbiAqIEByZXR1cm4ge1ZlY3Rvcn0gdmVjdG9yIHJlc3VsdFxuICovXG5WZWN0b3IucHJvdG90eXBlLmNyb3NzID0gZnVuY3Rpb24gY3Jvc3Modikge1xuICAgIHZhciB4ID0gdGhpcy54O1xuICAgIHZhciB5ID0gdGhpcy55O1xuICAgIHZhciB6ID0gdGhpcy56O1xuICAgIHZhciB2eCA9IHYueDtcbiAgICB2YXIgdnkgPSB2Lnk7XG4gICAgdmFyIHZ6ID0gdi56O1xuXG4gICAgcmV0dXJuIF9zZXRYWVouY2FsbChfcmVnaXN0ZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICB6ICogdnkgLSB5ICogdnosXG4gICAgICAgICAgICAgICAgICAgICAgICB4ICogdnogLSB6ICogdngsXG4gICAgICAgICAgICAgICAgICAgICAgICB5ICogdnggLSB4ICogdnlcbiAgICAgICAgICAgICAgICAgICAgICAgKTtcbn07XG5cbi8qKlxuICogQ29tcG9uZW50LXdpc2UgZXF1YWxpdHkgdGVzdCBiZXR3ZWVuIHRoaXMgYW5kIFZlY3RvciB2LlxuICogQG1ldGhvZCBlcXVhbHNcbiAqIEBwYXJhbSB7VmVjdG9yfSB2IHZlY3RvciB0byBjb21wYXJlXG4gKiBAcmV0dXJuIHtib29sZWFufVxuICovXG5WZWN0b3IucHJvdG90eXBlLmVxdWFscyA9IGZ1bmN0aW9uIGVxdWFscyh2KSB7XG4gICAgcmV0dXJuICh2LnggPT09IHRoaXMueCAmJiB2LnkgPT09IHRoaXMueSAmJiB2LnogPT09IHRoaXMueik7XG59O1xuXG4vKipcbiAqIFJvdGF0ZSBjbG9ja3dpc2UgYXJvdW5kIHgtYXhpcyBieSB0aGV0YSByYWRpYW5zLlxuICogICBOb3RlOiBUaGlzIHNldHMgdGhlIGludGVybmFsIHJlc3VsdCByZWdpc3Rlciwgc28gb3RoZXIgcmVmZXJlbmNlcyB0byB0aGF0IHZlY3RvciB3aWxsIGNoYW5nZS5cbiAqIEBtZXRob2Qgcm90YXRlWFxuICogQHBhcmFtIHtudW1iZXJ9IHRoZXRhIHJhZGlhbnNcbiAqIEByZXR1cm4ge1ZlY3Rvcn0gcm90YXRlZCB2ZWN0b3JcbiAqL1xuVmVjdG9yLnByb3RvdHlwZS5yb3RhdGVYID0gZnVuY3Rpb24gcm90YXRlWCh0aGV0YSkge1xuICAgIHZhciB4ID0gdGhpcy54O1xuICAgIHZhciB5ID0gdGhpcy55O1xuICAgIHZhciB6ID0gdGhpcy56O1xuXG4gICAgdmFyIGNvc1RoZXRhID0gTWF0aC5jb3ModGhldGEpO1xuICAgIHZhciBzaW5UaGV0YSA9IE1hdGguc2luKHRoZXRhKTtcblxuICAgIHJldHVybiBfc2V0WFlaLmNhbGwoX3JlZ2lzdGVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgeCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHkgKiBjb3NUaGV0YSAtIHogKiBzaW5UaGV0YSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHkgKiBzaW5UaGV0YSArIHogKiBjb3NUaGV0YVxuICAgICAgICAgICAgICAgICAgICAgICApO1xufTtcblxuLyoqXG4gKiBSb3RhdGUgY2xvY2t3aXNlIGFyb3VuZCB5LWF4aXMgYnkgdGhldGEgcmFkaWFucy5cbiAqICAgTm90ZTogVGhpcyBzZXRzIHRoZSBpbnRlcm5hbCByZXN1bHQgcmVnaXN0ZXIsIHNvIG90aGVyIHJlZmVyZW5jZXMgdG8gdGhhdCB2ZWN0b3Igd2lsbCBjaGFuZ2UuXG4gKiBAbWV0aG9kIHJvdGF0ZVlcbiAqIEBwYXJhbSB7bnVtYmVyfSB0aGV0YSByYWRpYW5zXG4gKiBAcmV0dXJuIHtWZWN0b3J9IHJvdGF0ZWQgdmVjdG9yXG4gKi9cblZlY3Rvci5wcm90b3R5cGUucm90YXRlWSA9IGZ1bmN0aW9uIHJvdGF0ZVkodGhldGEpIHtcbiAgICB2YXIgeCA9IHRoaXMueDtcbiAgICB2YXIgeSA9IHRoaXMueTtcbiAgICB2YXIgeiA9IHRoaXMuejtcblxuICAgIHZhciBjb3NUaGV0YSA9IE1hdGguY29zKHRoZXRhKTtcbiAgICB2YXIgc2luVGhldGEgPSBNYXRoLnNpbih0aGV0YSk7XG5cbiAgICByZXR1cm4gX3NldFhZWi5jYWxsKF9yZWdpc3RlcixcbiAgICAgICAgICAgICAgICAgICAgICAgIHogKiBzaW5UaGV0YSArIHggKiBjb3NUaGV0YSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHksXG4gICAgICAgICAgICAgICAgICAgICAgICB6ICogY29zVGhldGEgLSB4ICogc2luVGhldGFcbiAgICAgICAgICAgICAgICAgICAgICAgKTtcbn07XG5cbi8qKlxuICogUm90YXRlIGNsb2Nrd2lzZSBhcm91bmQgei1heGlzIGJ5IHRoZXRhIHJhZGlhbnMuXG4gKiAgIE5vdGU6IFRoaXMgc2V0cyB0aGUgaW50ZXJuYWwgcmVzdWx0IHJlZ2lzdGVyLCBzbyBvdGhlciByZWZlcmVuY2VzIHRvIHRoYXQgdmVjdG9yIHdpbGwgY2hhbmdlLlxuICogQG1ldGhvZCByb3RhdGVaXG4gKiBAcGFyYW0ge251bWJlcn0gdGhldGEgcmFkaWFuc1xuICogQHJldHVybiB7VmVjdG9yfSByb3RhdGVkIHZlY3RvclxuICovXG5WZWN0b3IucHJvdG90eXBlLnJvdGF0ZVogPSBmdW5jdGlvbiByb3RhdGVaKHRoZXRhKSB7XG4gICAgdmFyIHggPSB0aGlzLng7XG4gICAgdmFyIHkgPSB0aGlzLnk7XG4gICAgdmFyIHogPSB0aGlzLno7XG5cbiAgICB2YXIgY29zVGhldGEgPSBNYXRoLmNvcyh0aGV0YSk7XG4gICAgdmFyIHNpblRoZXRhID0gTWF0aC5zaW4odGhldGEpO1xuXG4gICAgcmV0dXJuIF9zZXRYWVouY2FsbChfcmVnaXN0ZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICB4ICogY29zVGhldGEgLSB5ICogc2luVGhldGEsXG4gICAgICAgICAgICAgICAgICAgICAgICB4ICogc2luVGhldGEgKyB5ICogY29zVGhldGEsXG4gICAgICAgICAgICAgICAgICAgICAgICB6XG4gICAgICAgICAgICAgICAgICAgICAgICk7XG59O1xuXG4vKipcbiAqIFJldHVybiBkb3QgcHJvZHVjdCBvZiB0aGlzIHdpdGggYSBzZWNvbmQgVmVjdG9yXG4gKiBAbWV0aG9kIGRvdFxuICogQHBhcmFtIHtWZWN0b3J9IHYgc2Vjb25kIHZlY3RvclxuICogQHJldHVybiB7bnVtYmVyfSBkb3QgcHJvZHVjdFxuICovXG5WZWN0b3IucHJvdG90eXBlLmRvdCA9IGZ1bmN0aW9uIGRvdCh2KSB7XG4gICAgcmV0dXJuIHRoaXMueCAqIHYueCArIHRoaXMueSAqIHYueSArIHRoaXMueiAqIHYuejtcbn07XG5cbi8qKlxuICogUmV0dXJuIHNxdWFyZWQgbGVuZ3RoIG9mIHRoaXMgdmVjdG9yXG4gKiBAbWV0aG9kIG5vcm1TcXVhcmVkXG4gKiBAcmV0dXJuIHtudW1iZXJ9IHNxdWFyZWQgbGVuZ3RoXG4gKi9cblZlY3Rvci5wcm90b3R5cGUubm9ybVNxdWFyZWQgPSBmdW5jdGlvbiBub3JtU3F1YXJlZCgpIHtcbiAgICByZXR1cm4gdGhpcy5kb3QodGhpcyk7XG59O1xuXG4vKipcbiAqIFJldHVybiBsZW5ndGggb2YgdGhpcyB2ZWN0b3JcbiAqIEBtZXRob2Qgbm9ybVxuICogQHJldHVybiB7bnVtYmVyfSBsZW5ndGhcbiAqL1xuVmVjdG9yLnByb3RvdHlwZS5ub3JtID0gZnVuY3Rpb24gbm9ybSgpIHtcbiAgICByZXR1cm4gTWF0aC5zcXJ0KHRoaXMubm9ybVNxdWFyZWQoKSk7XG59O1xuXG4vKipcbiAqIFNjYWxlIFZlY3RvciB0byBzcGVjaWZpZWQgbGVuZ3RoLlxuICogICBJZiBsZW5ndGggaXMgbGVzcyB0aGFuIGludGVybmFsIHRvbGVyYW5jZSwgc2V0IHZlY3RvciB0byBbbGVuZ3RoLCAwLCAwXS5cbiAqICAgTm90ZTogVGhpcyBzZXRzIHRoZSBpbnRlcm5hbCByZXN1bHQgcmVnaXN0ZXIsIHNvIG90aGVyIHJlZmVyZW5jZXMgdG8gdGhhdCB2ZWN0b3Igd2lsbCBjaGFuZ2UuXG4gKiBAbWV0aG9kIG5vcm1hbGl6ZVxuICpcbiAqIEBwYXJhbSB7bnVtYmVyfSBsZW5ndGggdGFyZ2V0IGxlbmd0aCwgZGVmYXVsdCAxLjBcbiAqIEByZXR1cm4ge1ZlY3Rvcn1cbiAqL1xuVmVjdG9yLnByb3RvdHlwZS5ub3JtYWxpemUgPSBmdW5jdGlvbiBub3JtYWxpemUobGVuZ3RoKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIGxlbmd0aCA9IDE7XG4gICAgdmFyIG5vcm0gPSB0aGlzLm5vcm0oKTtcblxuICAgIGlmIChub3JtID4gMWUtNykgcmV0dXJuIF9zZXRGcm9tVmVjdG9yLmNhbGwoX3JlZ2lzdGVyLCB0aGlzLm11bHQobGVuZ3RoIC8gbm9ybSkpO1xuICAgIGVsc2UgcmV0dXJuIF9zZXRYWVouY2FsbChfcmVnaXN0ZXIsIGxlbmd0aCwgMCwgMCk7XG59O1xuXG4vKipcbiAqIE1ha2UgYSBzZXBhcmF0ZSBjb3B5IG9mIHRoZSBWZWN0b3IuXG4gKlxuICogQG1ldGhvZCBjbG9uZVxuICpcbiAqIEByZXR1cm4ge1ZlY3Rvcn1cbiAqL1xuVmVjdG9yLnByb3RvdHlwZS5jbG9uZSA9IGZ1bmN0aW9uIGNsb25lKCkge1xuICAgIHJldHVybiBuZXcgVmVjdG9yKHRoaXMpO1xufTtcblxuLyoqXG4gKiBUcnVlIGlmIGFuZCBvbmx5IGlmIGV2ZXJ5IHZhbHVlIGlzIDAgKG9yIGZhbHN5KVxuICpcbiAqIEBtZXRob2QgaXNaZXJvXG4gKlxuICogQHJldHVybiB7Ym9vbGVhbn1cbiAqL1xuVmVjdG9yLnByb3RvdHlwZS5pc1plcm8gPSBmdW5jdGlvbiBpc1plcm8oKSB7XG4gICAgcmV0dXJuICEodGhpcy54IHx8IHRoaXMueSB8fCB0aGlzLnopO1xufTtcblxuZnVuY3Rpb24gX3NldFhZWih4LHkseikge1xuICAgIHRoaXMueCA9IHg7XG4gICAgdGhpcy55ID0geTtcbiAgICB0aGlzLnogPSB6O1xuICAgIHJldHVybiB0aGlzO1xufVxuXG5mdW5jdGlvbiBfc2V0RnJvbUFycmF5KHYpIHtcbiAgICByZXR1cm4gX3NldFhZWi5jYWxsKHRoaXMsdlswXSx2WzFdLHZbMl0gfHwgMCk7XG59XG5cbmZ1bmN0aW9uIF9zZXRGcm9tVmVjdG9yKHYpIHtcbiAgICByZXR1cm4gX3NldFhZWi5jYWxsKHRoaXMsIHYueCwgdi55LCB2LnopO1xufVxuXG5mdW5jdGlvbiBfc2V0RnJvbU51bWJlcih4KSB7XG4gICAgcmV0dXJuIF9zZXRYWVouY2FsbCh0aGlzLHgsMCwwKTtcbn1cblxuLyoqXG4gKiBTZXQgdGhpcyBWZWN0b3IgdG8gdGhlIHZhbHVlcyBpbiB0aGUgcHJvdmlkZWQgQXJyYXkgb3IgVmVjdG9yLlxuICpcbiAqIEBtZXRob2Qgc2V0XG4gKiBAcGFyYW0ge29iamVjdH0gdiBhcnJheSwgVmVjdG9yLCBvciBudW1iZXJcbiAqIEByZXR1cm4ge1ZlY3Rvcn0gdGhpc1xuICovXG5WZWN0b3IucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uIHNldCh2KSB7XG4gICAgaWYgKHYgaW5zdGFuY2VvZiBBcnJheSkgICAgcmV0dXJuIF9zZXRGcm9tQXJyYXkuY2FsbCh0aGlzLCB2KTtcbiAgICBpZiAodiBpbnN0YW5jZW9mIFZlY3RvcikgICByZXR1cm4gX3NldEZyb21WZWN0b3IuY2FsbCh0aGlzLCB2KTtcbiAgICBpZiAodHlwZW9mIHYgPT09ICdudW1iZXInKSByZXR1cm4gX3NldEZyb21OdW1iZXIuY2FsbCh0aGlzLCB2KTtcbn07XG5cblZlY3Rvci5wcm90b3R5cGUuc2V0WFlaID0gZnVuY3Rpb24oeCx5LHopIHtcbiAgICByZXR1cm4gX3NldFhZWi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xufTtcblxuVmVjdG9yLnByb3RvdHlwZS5zZXQxRCA9IGZ1bmN0aW9uKHgpIHtcbiAgICByZXR1cm4gX3NldEZyb21OdW1iZXIuY2FsbCh0aGlzLCB4KTtcbn07XG5cbi8qKlxuICogUHV0IHJlc3VsdCBvZiBsYXN0IGludGVybmFsIHJlZ2lzdGVyIGNhbGN1bGF0aW9uIGluIHNwZWNpZmllZCBvdXRwdXQgdmVjdG9yLlxuICpcbiAqIEBtZXRob2QgcHV0XG4gKiBAcGFyYW0ge1ZlY3Rvcn0gdiBkZXN0aW5hdGlvbiB2ZWN0b3JcbiAqIEByZXR1cm4ge1ZlY3Rvcn0gZGVzdGluYXRpb24gdmVjdG9yXG4gKi9cblxuVmVjdG9yLnByb3RvdHlwZS5wdXQgPSBmdW5jdGlvbiBwdXQodikge1xuICAgIGlmICh0aGlzID09PSBfcmVnaXN0ZXIpIF9zZXRGcm9tVmVjdG9yLmNhbGwodiwgX3JlZ2lzdGVyKTtcbiAgICBlbHNlIF9zZXRGcm9tVmVjdG9yLmNhbGwodiwgdGhpcyk7XG59O1xuXG4vKipcbiAqIFNldCB0aGlzIHZlY3RvciB0byBbMCwwLDBdXG4gKlxuICogQG1ldGhvZCBjbGVhclxuICovXG5WZWN0b3IucHJvdG90eXBlLmNsZWFyID0gZnVuY3Rpb24gY2xlYXIoKSB7XG4gICAgcmV0dXJuIF9zZXRYWVouY2FsbCh0aGlzLDAsMCwwKTtcbn07XG5cbi8qKlxuICogU2NhbGUgdGhpcyBWZWN0b3IgZG93biB0byBzcGVjaWZpZWQgXCJjYXBcIiBsZW5ndGguXG4gKiAgIElmIFZlY3RvciBzaG9ydGVyIHRoYW4gY2FwLCBvciBjYXAgaXMgSW5maW5pdHksIGRvIG5vdGhpbmcuXG4gKiAgIE5vdGU6IFRoaXMgc2V0cyB0aGUgaW50ZXJuYWwgcmVzdWx0IHJlZ2lzdGVyLCBzbyBvdGhlciByZWZlcmVuY2VzIHRvIHRoYXQgdmVjdG9yIHdpbGwgY2hhbmdlLlxuICpcbiAqIEBtZXRob2QgY2FwXG4gKiBAcmV0dXJuIHtWZWN0b3J9IGNhcHBlZCB2ZWN0b3JcbiAqL1xuVmVjdG9yLnByb3RvdHlwZS5jYXAgPSBmdW5jdGlvbiB2ZWN0b3JDYXAoY2FwKSB7XG4gICAgaWYgKGNhcCA9PT0gSW5maW5pdHkpIHJldHVybiBfc2V0RnJvbVZlY3Rvci5jYWxsKF9yZWdpc3RlciwgdGhpcyk7XG4gICAgdmFyIG5vcm0gPSB0aGlzLm5vcm0oKTtcbiAgICBpZiAobm9ybSA+IGNhcCkgcmV0dXJuIF9zZXRGcm9tVmVjdG9yLmNhbGwoX3JlZ2lzdGVyLCB0aGlzLm11bHQoY2FwIC8gbm9ybSkpO1xuICAgIGVsc2UgcmV0dXJuIF9zZXRGcm9tVmVjdG9yLmNhbGwoX3JlZ2lzdGVyLCB0aGlzKTtcbn07XG5cbi8qKlxuICogUmV0dXJuIHByb2plY3Rpb24gb2YgdGhpcyBWZWN0b3Igb250byBhbm90aGVyLlxuICogICBOb3RlOiBUaGlzIHNldHMgdGhlIGludGVybmFsIHJlc3VsdCByZWdpc3Rlciwgc28gb3RoZXIgcmVmZXJlbmNlcyB0byB0aGF0IHZlY3RvciB3aWxsIGNoYW5nZS5cbiAqXG4gKiBAbWV0aG9kIHByb2plY3RcbiAqIEBwYXJhbSB7VmVjdG9yfSBuIHZlY3RvciB0byBwcm9qZWN0IHVwb25cbiAqIEByZXR1cm4ge1ZlY3Rvcn0gcHJvamVjdGVkIHZlY3RvclxuICovXG5WZWN0b3IucHJvdG90eXBlLnByb2plY3QgPSBmdW5jdGlvbiBwcm9qZWN0KG4pIHtcbiAgICByZXR1cm4gbi5tdWx0KHRoaXMuZG90KG4pKTtcbn07XG5cbi8qKlxuICogUmVmbGVjdCB0aGlzIFZlY3RvciBhY3Jvc3MgcHJvdmlkZWQgdmVjdG9yLlxuICogICBOb3RlOiBUaGlzIHNldHMgdGhlIGludGVybmFsIHJlc3VsdCByZWdpc3Rlciwgc28gb3RoZXIgcmVmZXJlbmNlcyB0byB0aGF0IHZlY3RvciB3aWxsIGNoYW5nZS5cbiAqXG4gKiBAbWV0aG9kIHJlZmxlY3RBY3Jvc3NcbiAqIEBwYXJhbSB7VmVjdG9yfSBuIHZlY3RvciB0byByZWZsZWN0IGFjcm9zc1xuICogQHJldHVybiB7VmVjdG9yfSByZWZsZWN0ZWQgdmVjdG9yXG4gKi9cblZlY3Rvci5wcm90b3R5cGUucmVmbGVjdEFjcm9zcyA9IGZ1bmN0aW9uIHJlZmxlY3RBY3Jvc3Mobikge1xuICAgIG4ubm9ybWFsaXplKCkucHV0KG4pO1xuICAgIHJldHVybiBfc2V0RnJvbVZlY3RvcihfcmVnaXN0ZXIsIHRoaXMuc3ViKHRoaXMucHJvamVjdChuKS5tdWx0KDIpKSk7XG59O1xuXG4vKipcbiAqIENvbnZlcnQgVmVjdG9yIHRvIHRocmVlLWVsZW1lbnQgYXJyYXkuXG4gKlxuICogQG1ldGhvZCBnZXRcbiAqIEByZXR1cm4ge2FycmF5PG51bWJlcj59IHRocmVlLWVsZW1lbnQgYXJyYXlcbiAqL1xuVmVjdG9yLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbiBnZXQoKSB7XG4gICAgcmV0dXJuIFt0aGlzLngsIHRoaXMueSwgdGhpcy56XTtcbn07XG5cblZlY3Rvci5wcm90b3R5cGUuZ2V0MUQgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy54O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBWZWN0b3I7XG5cblxuVmVjdG9yLnByb3RvdHlwZS50aW1lcyA9IGZ1bmN0aW9uIHRpbWVzKHYpIHtcbiAgICByZXR1cm4gX3NldFhZWi5jYWxsKF9yZWdpc3RlcixcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMueCAqIHYueCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMueSAqIHYueSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMueiAqIHYuelxuICAgICAgICAgICAgICAgICAgICAgICApO1xufVxuXG5cblZlY3Rvci5wcm90b3R5cGUudG9BcnJheSA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gW3RoaXMueCwgdGhpcy55LCB0aGlzLnpdXG59XG5cblZlY3Rvci5mcm9tQXJyYXkgPSBmdW5jdGlvbiAoYSkge1xuICAgIHJldHVybiBuZXcgVmVjdG9yKGFbMF0sIGFbMV0sIGFbMl0pO1xufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG5mdW5jdGlvbiBtdWx0aXBseShvdXRwdXRBcnJheSwgbGVmdCwgcmlnaHQpIHtcbiAgICB2YXIgYTAwID0gbGVmdFswXSwgIGEwMSA9IGxlZnRbMV0sICBhMDIgPSBsZWZ0WzJdLCAgYTAzID0gbGVmdFszXSxcbiAgICAgICAgYTEwID0gbGVmdFs0XSwgIGExMSA9IGxlZnRbNV0sICBhMTIgPSBsZWZ0WzZdLCAgYTEzID0gbGVmdFs3XSxcbiAgICAgICAgYTIwID0gbGVmdFs4XSwgIGEyMSA9IGxlZnRbOV0sICBhMjIgPSBsZWZ0WzEwXSwgYTIzID0gbGVmdFsxMV0sXG4gICAgICAgIGEzMCA9IGxlZnRbMTJdLCBhMzEgPSBsZWZ0WzEzXSwgYTMyID0gbGVmdFsxNF0sIGEzMyA9IGxlZnRbMTVdO1xuICAgIFxuICAgIHZhciBiMCA9IHJpZ2h0WzBdLCBiMSA9IHJpZ2h0WzFdLCBiMiA9IHJpZ2h0WzJdLCBiMyA9IHJpZ2h0WzNdOyBcblxuICAgIG91dHB1dEFycmF5WzBdID0gYjAqYTAwICsgYjEqYTEwICsgYjIqYTIwICsgYjMqYTMwO1xuICAgIG91dHB1dEFycmF5WzFdID0gYjAqYTAxICsgYjEqYTExICsgYjIqYTIxICsgYjMqYTMxO1xuICAgIG91dHB1dEFycmF5WzJdID0gYjAqYTAyICsgYjEqYTEyICsgYjIqYTIyICsgYjMqYTMyO1xuICAgIG91dHB1dEFycmF5WzNdID0gYjAqYTAzICsgYjEqYTEzICsgYjIqYTIzICsgYjMqYTMzO1xuICAgIFxuICAgIGIwID0gcmlnaHRbNF07IGIxID0gcmlnaHRbNV07IGIyID0gcmlnaHRbNl07IGIzID0gcmlnaHRbN107XG5cbiAgICBvdXRwdXRBcnJheVs0XSA9IGIwKmEwMCArIGIxKmExMCArIGIyKmEyMCArIGIzKmEzMDtcbiAgICBvdXRwdXRBcnJheVs1XSA9IGIwKmEwMSArIGIxKmExMSArIGIyKmEyMSArIGIzKmEzMTtcbiAgICBvdXRwdXRBcnJheVs2XSA9IGIwKmEwMiArIGIxKmExMiArIGIyKmEyMiArIGIzKmEzMjtcbiAgICBvdXRwdXRBcnJheVs3XSA9IGIwKmEwMyArIGIxKmExMyArIGIyKmEyMyArIGIzKmEzMztcbiAgICBcbiAgICBiMCA9IHJpZ2h0WzhdOyBiMSA9IHJpZ2h0WzldOyBiMiA9IHJpZ2h0WzEwXTsgYjMgPSByaWdodFsxMV07XG5cbiAgICBvdXRwdXRBcnJheVs4XSAgPSBiMCphMDAgKyBiMSphMTAgKyBiMiphMjAgKyBiMyphMzA7XG4gICAgb3V0cHV0QXJyYXlbOV0gID0gYjAqYTAxICsgYjEqYTExICsgYjIqYTIxICsgYjMqYTMxO1xuICAgIG91dHB1dEFycmF5WzEwXSA9IGIwKmEwMiArIGIxKmExMiArIGIyKmEyMiArIGIzKmEzMjtcbiAgICBvdXRwdXRBcnJheVsxMV0gPSBiMCphMDMgKyBiMSphMTMgKyBiMiphMjMgKyBiMyphMzM7XG4gICAgXG4gICAgYjAgPSByaWdodFsxMl07IGIxID0gcmlnaHRbMTNdOyBiMiA9IHJpZ2h0WzE0XTsgYjMgPSByaWdodFsxNV07XG5cbiAgICBvdXRwdXRBcnJheVsxMl0gPSBiMCphMDAgKyBiMSphMTAgKyBiMiphMjAgKyBiMyphMzA7XG4gICAgb3V0cHV0QXJyYXlbMTNdID0gYjAqYTAxICsgYjEqYTExICsgYjIqYTIxICsgYjMqYTMxO1xuICAgIG91dHB1dEFycmF5WzE0XSA9IGIwKmEwMiArIGIxKmExMiArIGIyKmEyMiArIGIzKmEzMjtcbiAgICBvdXRwdXRBcnJheVsxNV0gPSBiMCphMDMgKyBiMSphMTMgKyBiMiphMjMgKyBiMyphMzM7XG4gICAgcmV0dXJuIG91dHB1dEFycmF5O1xufVxuXG5cbmZ1bmN0aW9uIGdldFRyYW5zbGF0aW9uRnJvbU11bHRpcGxpY2F0aW9uKG91dHB1dEFycmF5LCBsZWZ0LCByaWdodCkge1xuICAgIHZhciBhMDAgPSBsZWZ0WzBdLCAgYTAxID0gbGVmdFsxXSxcbiAgICAgICAgYTEwID0gbGVmdFs0XSwgIGExMSA9IGxlZnRbNV0sXG4gICAgICAgIGEyMCA9IGxlZnRbOF0sICBhMjEgPSBsZWZ0WzldLFxuICAgICAgICBhMzAgPSBsZWZ0WzEyXSwgYTMxID0gbGVmdFsxM107XG5cbiAgICB2YXIgYjAgPSByaWdodFsxMl0sXG4gICAgICAgIGIxID0gcmlnaHRbMTNdLFxuICAgICAgICBiMiA9IHJpZ2h0WzE0XSxcbiAgICAgICAgYjMgPSByaWdodFsxNV07XG5cbiAgICBvdXRwdXRBcnJheVswXSA9IGIwKmEwMCArIGIxKmExMCArIGIyKmEyMCArIGIzKmEzMDtcbiAgICBvdXRwdXRBcnJheVsxXSA9IGIwKmEwMSArIGIxKmExMSArIGIyKmEyMSArIGIzKmEzMTtcbiAgICByZXR1cm4gb3V0cHV0QXJyYXk7XG59XG5cbmZ1bmN0aW9uIGludmVydChvdXRwdXRBcnJheSwgbWF0cml4KSB7XG4gICAgdmFyIGEwMCA9IG1hdHJpeFswXSwgIGEwMSA9IG1hdHJpeFsxXSwgIGEwMiA9IG1hdHJpeFsyXSwgIGEwMyA9IG1hdHJpeFszXSxcbiAgICAgICAgYTEwID0gbWF0cml4WzRdLCAgYTExID0gbWF0cml4WzVdLCAgYTEyID0gbWF0cml4WzZdLCAgYTEzID0gbWF0cml4WzddLFxuICAgICAgICBhMjAgPSBtYXRyaXhbOF0sICBhMjEgPSBtYXRyaXhbOV0sICBhMjIgPSBtYXRyaXhbMTBdLCBhMjMgPSBtYXRyaXhbMTFdLFxuICAgICAgICBhMzAgPSBtYXRyaXhbMTJdLCBhMzEgPSBtYXRyaXhbMTNdLCBhMzIgPSBtYXRyaXhbMTRdLCBhMzMgPSBtYXRyaXhbMTVdLFxuXG4gICAgICAgIGIwMCA9IGEwMCAqIGExMSAtIGEwMSAqIGExMCxcbiAgICAgICAgYjAxID0gYTAwICogYTEyIC0gYTAyICogYTEwLFxuICAgICAgICBiMDIgPSBhMDAgKiBhMTMgLSBhMDMgKiBhMTAsXG4gICAgICAgIGIwMyA9IGEwMSAqIGExMiAtIGEwMiAqIGExMSxcbiAgICAgICAgYjA0ID0gYTAxICogYTEzIC0gYTAzICogYTExLFxuICAgICAgICBiMDUgPSBhMDIgKiBhMTMgLSBhMDMgKiBhMTIsXG4gICAgICAgIGIwNiA9IGEyMCAqIGEzMSAtIGEyMSAqIGEzMCxcbiAgICAgICAgYjA3ID0gYTIwICogYTMyIC0gYTIyICogYTMwLFxuICAgICAgICBiMDggPSBhMjAgKiBhMzMgLSBhMjMgKiBhMzAsXG4gICAgICAgIGIwOSA9IGEyMSAqIGEzMiAtIGEyMiAqIGEzMSxcbiAgICAgICAgYjEwID0gYTIxICogYTMzIC0gYTIzICogYTMxLFxuICAgICAgICBiMTEgPSBhMjIgKiBhMzMgLSBhMjMgKiBhMzIsXG5cbiAgICAgICAgLy8gQ2FsY3VsYXRlIHRoZSBkZXRlcm1pbmFudFxuICAgICAgICBkZXQgPSBiMDAgKiBiMTEgLSBiMDEgKiBiMTAgKyBiMDIgKiBiMDkgKyBiMDMgKiBiMDggLSBiMDQgKiBiMDcgKyBiMDUgKiBiMDY7XG5cbiAgICBpZiAoIWRldCkgcmV0dXJuIG51bGw7XG4gICAgZGV0ID0gMS4wIC8gZGV0O1xuXG4gICAgb3V0cHV0QXJyYXlbMF0gID0gKGExMSAqIGIxMSAtIGExMiAqIGIxMCArIGExMyAqIGIwOSkgKiBkZXQ7XG4gICAgb3V0cHV0QXJyYXlbMV0gID0gKGEwMiAqIGIxMCAtIGEwMSAqIGIxMSAtIGEwMyAqIGIwOSkgKiBkZXQ7XG4gICAgb3V0cHV0QXJyYXlbMl0gID0gKGEzMSAqIGIwNSAtIGEzMiAqIGIwNCArIGEzMyAqIGIwMykgKiBkZXQ7XG4gICAgb3V0cHV0QXJyYXlbM10gID0gKGEyMiAqIGIwNCAtIGEyMSAqIGIwNSAtIGEyMyAqIGIwMykgKiBkZXQ7XG4gICAgb3V0cHV0QXJyYXlbNF0gID0gKGExMiAqIGIwOCAtIGExMCAqIGIxMSAtIGExMyAqIGIwNykgKiBkZXQ7XG4gICAgb3V0cHV0QXJyYXlbNV0gID0gKGEwMCAqIGIxMSAtIGEwMiAqIGIwOCArIGEwMyAqIGIwNykgKiBkZXQ7XG4gICAgb3V0cHV0QXJyYXlbNl0gID0gKGEzMiAqIGIwMiAtIGEzMCAqIGIwNSAtIGEzMyAqIGIwMSkgKiBkZXQ7XG4gICAgb3V0cHV0QXJyYXlbN10gID0gKGEyMCAqIGIwNSAtIGEyMiAqIGIwMiArIGEyMyAqIGIwMSkgKiBkZXQ7XG4gICAgb3V0cHV0QXJyYXlbOF0gID0gKGExMCAqIGIxMCAtIGExMSAqIGIwOCArIGExMyAqIGIwNikgKiBkZXQ7XG4gICAgb3V0cHV0QXJyYXlbOV0gID0gKGEwMSAqIGIwOCAtIGEwMCAqIGIxMCAtIGEwMyAqIGIwNikgKiBkZXQ7XG4gICAgb3V0cHV0QXJyYXlbMTBdID0gKGEzMCAqIGIwNCAtIGEzMSAqIGIwMiArIGEzMyAqIGIwMCkgKiBkZXQ7XG4gICAgb3V0cHV0QXJyYXlbMTFdID0gKGEyMSAqIGIwMiAtIGEyMCAqIGIwNCAtIGEyMyAqIGIwMCkgKiBkZXQ7XG4gICAgb3V0cHV0QXJyYXlbMTJdID0gKGExMSAqIGIwNyAtIGExMCAqIGIwOSAtIGExMiAqIGIwNikgKiBkZXQ7XG4gICAgb3V0cHV0QXJyYXlbMTNdID0gKGEwMCAqIGIwOSAtIGEwMSAqIGIwNyArIGEwMiAqIGIwNikgKiBkZXQ7XG4gICAgb3V0cHV0QXJyYXlbMTRdID0gKGEzMSAqIGIwMSAtIGEzMCAqIGIwMyAtIGEzMiAqIGIwMCkgKiBkZXQ7XG4gICAgb3V0cHV0QXJyYXlbMTVdID0gKGEyMCAqIGIwMyAtIGEyMSAqIGIwMSArIGEyMiAqIGIwMCkgKiBkZXQ7XG4gICAgcmV0dXJuIG91dHB1dEFycmF5O1xufVxuXG5mdW5jdGlvbiBnZXRXZnJvbU11bHRpcGxpY2F0aW9uKGxlZnQsIHJpZ2h0KSB7XG4gICAgdmFyIGEwMCA9IGxlZnRbMF0sICBhMDEgPSBsZWZ0WzFdLCAgYTAyID0gbGVmdFsyXSwgIGEwMyA9IGxlZnRbM10sXG4gICAgICAgIGExMCA9IGxlZnRbNF0sICBhMTEgPSBsZWZ0WzVdLCAgYTEyID0gbGVmdFs2XSwgIGExMyA9IGxlZnRbN10sXG4gICAgICAgIGEyMCA9IGxlZnRbOF0sICBhMjEgPSBsZWZ0WzldLCAgYTIyID0gbGVmdFsxMF0sIGEyMyA9IGxlZnRbMTFdLFxuICAgICAgICBhMzAgPSBsZWZ0WzEyXSwgYTMxID0gbGVmdFsxM10sIGEzMiA9IGxlZnRbMTRdLCBhMzMgPSBsZWZ0WzE1XTtcblxuICAgIHZhciBiMCA9IHJpZ2h0WzEyXSwgYjEgPSByaWdodFsxM10sIGIyID0gcmlnaHRbMTRdLCBiMyA9IHJpZ2h0WzE1XTtcblxuICAgIHJldHVybiBiMCphMDAgKyBiMSphMTAgKyBiMiphMjAgKyBiMyphMzAgKyBiMCphMDEgKyBiMSphMTEgKyBiMiphMjEgKyBiMyphMzEgKyBiMCphMDIgKyBiMSphMTIgKyBiMiphMjIgKyBiMyphMzIgKyBiMCphMDMgKyBiMSphMTMgKyBiMiphMjMgKyBiMyphMzM7XG59XG5cbmZ1bmN0aW9uIGFwcGx5VG9WZWN0b3Iob3V0cHV0LCBtYXRyaXgsIHZlY3Rvcikge1xuICAgIHZhciBhMDAgPSBtYXRyaXhbMF0sICBhMDEgPSBtYXRyaXhbMV0sICBhMDIgPSBtYXRyaXhbMl0sICBhMDMgPSBtYXRyaXhbM10sXG4gICAgICAgIGExMCA9IG1hdHJpeFs0XSwgIGExMSA9IG1hdHJpeFs1XSwgIGExMiA9IG1hdHJpeFs2XSwgIGExMyA9IG1hdHJpeFs3XSxcbiAgICAgICAgYTIwID0gbWF0cml4WzhdLCAgYTIxID0gbWF0cml4WzldLCAgYTIyID0gbWF0cml4WzEwXSwgYTIzID0gbWF0cml4WzExXSxcbiAgICAgICAgYTMwID0gbWF0cml4WzEyXSwgYTMxID0gbWF0cml4WzEzXSwgYTMyID0gbWF0cml4WzE0XSwgYTMzID0gbWF0cml4WzE1XTtcblxuICAgIHZhciB2MCA9IHZlY3RvclswXSwgdjEgPSB2ZWN0b3JbMV0sIHYyID0gdmVjdG9yWzJdLCB2MyA9IHZlY3RvclszXTtcblxuICAgIG91dHB1dFswXSA9IGEwMCAqIHYwICsgYTEwICogdjEgKyBhMjAgKiB2MiArIGEzMCAqIHYzO1xuICAgIG91dHB1dFsxXSA9IGEwMSAqIHYwICsgYTExICogdjEgKyBhMjEgKiB2MiArIGEzMSAqIHYzO1xuICAgIG91dHB1dFsyXSA9IGEwMiAqIHYwICsgYTEyICogdjEgKyBhMjIgKiB2MiArIGEzMiAqIHYzO1xuICAgIG91dHB1dFszXSA9IGEwMyAqIHYwICsgYTEzICogdjEgKyBhMjMgKiB2MiArIGEzMyAqIHYzO1xuXG4gICAgcmV0dXJuIG91dHB1dDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgbXVsdGlwbHkgICAgICAgICAgICAgICAgICAgICAgICAgOiBtdWx0aXBseSxcbiAgICBnZXRUcmFuc2xhdGlvbkZyb21NdWx0aXBsaWNhdGlvbiA6IGdldFRyYW5zbGF0aW9uRnJvbU11bHRpcGxpY2F0aW9uLFxuICAgIGludmVydCAgICAgICAgICAgICAgICAgICAgICAgICAgIDogaW52ZXJ0LFxuICAgIElERU5USVRZICAgICAgICAgICAgICAgICAgICAgICAgIDogbmV3IEZsb2F0MzJBcnJheShbMSwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMV0pLFxuICAgIGdldFdmcm9tTXVsdGlwbGljYXRpb24gICAgICAgICAgIDogZ2V0V2Zyb21NdWx0aXBsaWNhdGlvbixcbiAgICBhcHBseVRvVmVjdG9yICAgICAgICAgICAgICAgICAgICA6IGFwcGx5VG9WZWN0b3Jcbn07IiwiLyogVGhpcyBTb3VyY2UgQ29kZSBGb3JtIGlzIHN1YmplY3QgdG8gdGhlIHRlcm1zIG9mIHRoZSBNb3ppbGxhIFB1YmxpY1xuICogTGljZW5zZSwgdi4gMi4wLiBJZiBhIGNvcHkgb2YgdGhlIE1QTCB3YXMgbm90IGRpc3RyaWJ1dGVkIHdpdGggdGhpc1xuICogZmlsZSwgWW91IGNhbiBvYnRhaW4gb25lIGF0IGh0dHA6Ly9tb3ppbGxhLm9yZy9NUEwvMi4wLy5cbiAqXG4gKiBPd25lcnM6IGRhbkBmYW1vLnVzXG4gKiAgICAgICAgIGZlbGl4QGZhbW8udXNcbiAqICAgICAgICAgbWlrZUBmYW1vLnVzXG4gKlxuICogQGxpY2Vuc2UgTVBMIDIuMFxuICogQGNvcHlyaWdodCBGYW1vdXMgSW5kdXN0cmllcywgSW5jLiAyMDE0XG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgRW50aXR5UmVnaXN0cnkgPSByZXF1aXJlKCcuLi9jb3JlL0VudGl0eVJlZ2lzdHJ5Jyk7XG52YXIgbGlmdFJvb3RzICAgICAgPSBFbnRpdHlSZWdpc3RyeS5hZGRMYXllcignTGlmdCcpO1xuXG4vKipcbiAqIExpZnRTeXN0ZW0gaXMgcmVzcG9uc2libGUgZm9yIHRyYXZlcnNpbmcgdGhlIHNjZW5lIGdyYXBoIGFuZFxuICogICB1cGRhdGluZyB0aGUgVHJhbnNmb3JtcywgU2l6ZXMsIGFuZCBPcGFjaXRpZXMgb2YgdGhlIGVudGl0aWVzLlxuICpcbiAqIEBjbGFzcyAgTGlmdFN5c3RlbVxuICogQHN5c3RlbVxuICogQHNpbmdsZXRvblxuICovXG52YXIgTGlmdFN5c3RlbSA9IHt9O1xuXG4vKipcbiAqIHVwZGF0ZSBpdGVyYXRlcyBvdmVyIGVhY2ggb2YgdGhlIENvbnRleHRzIHRoYXQgd2VyZSByZWdpc3RlcmVkIGFuZFxuICogICBraWNrcyBvZiB0aGUgcmVjdXJzaXZlIHVwZGF0aW5nIG9mIHRoZWlyIGVudGl0aWVzLlxuICpcbiAqIEBtZXRob2QgdXBkYXRlXG4gKi9cbnZhciB0ZXN0ID0gW107XG5MaWZ0U3lzdGVtLnVwZGF0ZSA9IGZ1bmN0aW9uIHVwZGF0ZSgpIHtcbiAgICB2YXIgcm9vdFBhcmFtcztcbiAgICB2YXIgY2xlYW51cCA9IFtdO1xuICAgIHZhciBsaWZ0O1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaWZ0Um9vdHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgbGlmdCA9IGxpZnRSb290c1tpXS5nZXRDb21wb25lbnQoJ0xpZnRDb21wb25lbnQnKTtcbiAgICAgICAgcm9vdFBhcmFtcyA9IGxpZnQuX3VwZGF0ZSgpO1xuICAgICAgICByb290UGFyYW1zLnVuc2hpZnQobGlmdFJvb3RzW2ldKTtcbiAgICAgICAgY29yZVVwZGF0ZUFuZEZlZWQuYXBwbHkobnVsbCwgcm9vdFBhcmFtcyk7XG5cbiAgICAgICAgaWYgKGxpZnQuZG9uZSkge1xuICAgICAgICAgICAgbGlmdFJvb3RzW2ldLnJlbW92ZUNvbXBvbmVudCgnTGlmdENvbXBvbmVudCcpO1xuICAgICAgICAgICAgRW50aXR5UmVnaXN0cnkuZGVyZWdpc3RlcihsaWZ0Um9vdHNbaV0sICdMaWZ0Jyk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbi8qKlxuICogY29yZVVwZGF0ZUFuZEZlZWQgZmVlZHMgcGFyZW50IGluZm9ybWF0aW9uIHRvIGFuIGVudGl0eSBhbmQgc28gdGhhdFxuICogICBlYWNoIGVudGl0eSBjYW4gdXBkYXRlIHRoZWlyIHRyYW5zZm9ybS4gIEl0IFxuICogICB3aWxsIHRoZW4gcGFzcyBkb3duIGludmFsaWRhdGlvbiBzdGF0ZXMgYW5kIHZhbHVlcyB0byBhbnkgY2hpbGRyZW4uXG4gKlxuICogQG1ldGhvZCBjb3JlVXBkYXRlQW5kRmVlZFxuICogQHByaXZhdGVcbiAqICAgXG4gKiBAcGFyYW0gIHtFbnRpdHl9ICBlbnRpdHkgICAgICAgICAgIEVudGl0eSBpbiB0aGUgc2NlbmUgZ3JhcGhcbiAqIEBwYXJhbSAge051bWJlcn0gIHRyYW5zZm9ybVJlcG9ydCAgYml0U2NoZW1lIHJlcG9ydCBvZiB0cmFuc2Zvcm0gaW52YWxpZGF0aW9uc1xuICogQHBhcmFtICB7QXJyYXl9ICAgaW5jb21pbmdNYXRyaXggICBwYXJlbnQgdHJhbnNmb3JtIGFzIGEgRmxvYXQzMiBBcnJheVxuICovXG5mdW5jdGlvbiBjb3JlVXBkYXRlQW5kRmVlZChlbnRpdHksIHRyYW5zZm9ybVJlcG9ydCwgaW5jb21pbmdNYXRyaXgpIHtcbiAgICBpZiAoIWVudGl0eSkgcmV0dXJuO1xuICAgIHZhciB0cmFuc2Zvcm0gPSBlbnRpdHkuZ2V0Q29tcG9uZW50KCd0cmFuc2Zvcm0nKTtcbiAgICB2YXIgaSAgICAgICAgID0gZW50aXR5Ll9jaGlsZHJlbi5sZW5ndGg7XG5cbiAgICB0cmFuc2Zvcm1SZXBvcnQgPSB0cmFuc2Zvcm0uX3VwZGF0ZSh0cmFuc2Zvcm1SZXBvcnQsIGluY29taW5nTWF0cml4KTtcblxuICAgIHdoaWxlIChpLS0pIFxuICAgICAgICBjb3JlVXBkYXRlQW5kRmVlZChcbiAgICAgICAgICAgIGVudGl0eS5fY2hpbGRyZW5baV0sXG4gICAgICAgICAgICB0cmFuc2Zvcm1SZXBvcnQsXG4gICAgICAgICAgICB0cmFuc2Zvcm0uX21hdHJpeCk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gTGlmdFN5c3RlbTtcbiIsIi8qIFRoaXMgU291cmNlIENvZGUgRm9ybSBpcyBzdWJqZWN0IHRvIHRoZSB0ZXJtcyBvZiB0aGUgTW96aWxsYSBQdWJsaWNcbiogTGljZW5zZSwgdi4gMi4wLiBJZiBhIGNvcHkgb2YgdGhlIE1QTCB3YXMgbm90IGRpc3RyaWJ1dGVkIHdpdGggdGhpc1xuKiBmaWxlLCBZb3UgY2FuIG9idGFpbiBvbmUgYXQgaHR0cDovL21vemlsbGEub3JnL01QTC8yLjAvLlxuKlxuKiBPd25lcjogbWFya0BmYW1vLnVzXG4qIEBsaWNlbnNlIE1QTCAyLjBcbiogQGNvcHlyaWdodCBGYW1vdXMgSW5kdXN0cmllcywgSW5jLiAyMDE0XG4qL1xuXG4vKipcbiAqIEV2ZW50RW1pdHRlciByZXByZXNlbnRzIGEgY2hhbm5lbCBmb3IgZXZlbnRzLlxuICpcbiAqIEBjbGFzcyBFdmVudEVtaXR0ZXJcbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBFdmVudEVtaXR0ZXIoKSB7XG4gICAgdGhpcy5saXN0ZW5lcnMgPSB7fTtcbiAgICB0aGlzLl9vd25lciA9IHRoaXM7XG59XG5cbi8qKlxuICogVHJpZ2dlciBhbiBldmVudCwgc2VuZGluZyB0byBhbGwgZG93bnN0cmVhbSBoYW5kbGVyc1xuICogICBsaXN0ZW5pbmcgZm9yIHByb3ZpZGVkICd0eXBlJyBrZXkuXG4gKlxuICogQG1ldGhvZCBlbWl0XG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHR5cGUgZXZlbnQgdHlwZSBrZXkgKGZvciBleGFtcGxlLCAnY2xpY2snKVxuICogQHBhcmFtIHtPYmplY3R9IGV2ZW50IGV2ZW50IGRhdGFcbiAqIEByZXR1cm4ge0V2ZW50SGFuZGxlcn0gdGhpc1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbiBlbWl0KHR5cGUsIGV2ZW50KSB7XG4gICAgdmFyIGhhbmRsZXJzID0gdGhpcy5saXN0ZW5lcnNbdHlwZV07XG4gICAgaWYgKGhhbmRsZXJzKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgaGFuZGxlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGhhbmRsZXJzW2ldLmNhbGwodGhpcy5fb3duZXIsIGV2ZW50KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQmluZCBhIGNhbGxiYWNrIGZ1bmN0aW9uIHRvIGFuIGV2ZW50IHR5cGUgaGFuZGxlZCBieSB0aGlzIG9iamVjdC5cbiAqXG4gKiBAbWV0aG9kIFwib25cIlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSB0eXBlIGV2ZW50IHR5cGUga2V5IChmb3IgZXhhbXBsZSwgJ2NsaWNrJylcbiAqIEBwYXJhbSB7ZnVuY3Rpb24oc3RyaW5nLCBPYmplY3QpfSBoYW5kbGVyIGNhbGxiYWNrXG4gKiBAcmV0dXJuIHtFdmVudEhhbmRsZXJ9IHRoaXNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbiA9IGZ1bmN0aW9uIG9uKHR5cGUsIGhhbmRsZXIpIHtcbiAgICBpZiAoISh0eXBlIGluIHRoaXMubGlzdGVuZXJzKSkgdGhpcy5saXN0ZW5lcnNbdHlwZV0gPSBbXTtcbiAgICB2YXIgaW5kZXggPSB0aGlzLmxpc3RlbmVyc1t0eXBlXS5pbmRleE9mKGhhbmRsZXIpO1xuICAgIGlmIChpbmRleCA8IDApIHRoaXMubGlzdGVuZXJzW3R5cGVdLnB1c2goaGFuZGxlcik7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEFsaWFzIGZvciBcIm9uXCIuXG4gKiBAbWV0aG9kIGFkZExpc3RlbmVyXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXIgPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uO1xuXG4vKipcbiAqIFVuYmluZCBhbiBldmVudCBieSB0eXBlIGFuZCBoYW5kbGVyLlxuICogICBUaGlzIHVuZG9lcyB0aGUgd29yayBvZiBcIm9uXCIuXG4gKlxuICogQG1ldGhvZCByZW1vdmVMaXN0ZW5lclxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSB0eXBlIGV2ZW50IHR5cGUga2V5IChmb3IgZXhhbXBsZSwgJ2NsaWNrJylcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGhhbmRsZXIgZnVuY3Rpb24gb2JqZWN0IHRvIHJlbW92ZVxuICogQHJldHVybiB7RXZlbnRFbWl0dGVyfSB0aGlzXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXIgPSBmdW5jdGlvbiByZW1vdmVMaXN0ZW5lcih0eXBlLCBoYW5kbGVyKSB7XG4gICAgdmFyIGluZGV4ID0gdGhpcy5saXN0ZW5lcnNbdHlwZV0uaW5kZXhPZihoYW5kbGVyKTtcbiAgICBpZiAoaW5kZXggPj0gMCkgdGhpcy5saXN0ZW5lcnNbdHlwZV0uc3BsaWNlKGluZGV4LCAxKTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQ2FsbCBldmVudCBoYW5kbGVycyB3aXRoIHRoaXMgc2V0IHRvIG93bmVyLlxuICpcbiAqIEBtZXRob2QgYmluZFRoaXNcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb3duZXIgb2JqZWN0IHRoaXMgRXZlbnRFbWl0dGVyIGJlbG9uZ3MgdG9cbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5iaW5kVGhpcyA9IGZ1bmN0aW9uIGJpbmRUaGlzKG93bmVyKSB7XG4gICAgdGhpcy5fb3duZXIgPSBvd25lcjtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRXZlbnRFbWl0dGVyOyIsIi8qIFRoaXMgU291cmNlIENvZGUgRm9ybSBpcyBzdWJqZWN0IHRvIHRoZSB0ZXJtcyBvZiB0aGUgTW96aWxsYSBQdWJsaWNcbiogTGljZW5zZSwgdi4gMi4wLiBJZiBhIGNvcHkgb2YgdGhlIE1QTCB3YXMgbm90IGRpc3RyaWJ1dGVkIHdpdGggdGhpc1xuKiBmaWxlLCBZb3UgY2FuIG9idGFpbiBvbmUgYXQgaHR0cDovL21vemlsbGEub3JnL01QTC8yLjAvLlxuKlxuKiBPd25lcjogbWFya0BmYW1vLnVzXG4qIEBsaWNlbnNlIE1QTCAyLjBcbiogQGNvcHlyaWdodCBGYW1vdXMgSW5kdXN0cmllcywgSW5jLiAyMDE0XG4qL1xuXG52YXIgRXZlbnRFbWl0dGVyID0gcmVxdWlyZSgnLi9FdmVudEVtaXR0ZXInKTtcblxuLyoqXG4gKiBFdmVudEhhbmRsZXIgZm9yd2FyZHMgcmVjZWl2ZWQgZXZlbnRzIHRvIGEgc2V0IG9mIHByb3ZpZGVkIGNhbGxiYWNrIGZ1bmN0aW9ucy5cbiAqIEl0IGFsbG93cyBldmVudHMgdG8gYmUgY2FwdHVyZWQsIHByb2Nlc3NlZCwgYW5kIG9wdGlvbmFsbHkgcGlwZWQgdGhyb3VnaCB0byBvdGhlciBldmVudCBoYW5kbGVycy5cbiAqXG4gKiBAY2xhc3MgRXZlbnRIYW5kbGVyXG4gKiBAZXh0ZW5kcyBFdmVudEVtaXR0ZXJcbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBFdmVudEhhbmRsZXIoKSB7XG4gICAgRXZlbnRFbWl0dGVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cbiAgICB0aGlzLmRvd25zdHJlYW0gPSBbXTsgLy8gZG93bnN0cmVhbSBldmVudCBoYW5kbGVyc1xuICAgIHRoaXMuZG93bnN0cmVhbUZuID0gW107IC8vIGRvd25zdHJlYW0gZnVuY3Rpb25zXG5cbiAgICB0aGlzLnVwc3RyZWFtID0gW107IC8vIHVwc3RyZWFtIGV2ZW50IGhhbmRsZXJzXG4gICAgdGhpcy51cHN0cmVhbUxpc3RlbmVycyA9IHt9OyAvLyB1cHN0cmVhbSBsaXN0ZW5lcnNcbn1cbkV2ZW50SGFuZGxlci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEV2ZW50RW1pdHRlci5wcm90b3R5cGUpO1xuRXZlbnRIYW5kbGVyLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IEV2ZW50SGFuZGxlcjtcblxuLyoqXG4gKiBBc3NpZ24gYW4gZXZlbnQgaGFuZGxlciB0byByZWNlaXZlIGFuIG9iamVjdCdzIGlucHV0IGV2ZW50cy5cbiAqXG4gKiBAbWV0aG9kIHNldElucHV0SGFuZGxlclxuICogQHN0YXRpY1xuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3Qgb2JqZWN0IHRvIG1peCB0cmlnZ2VyLCBzdWJzY3JpYmUsIGFuZCB1bnN1YnNjcmliZSBmdW5jdGlvbnMgaW50b1xuICogQHBhcmFtIHtFdmVudEhhbmRsZXJ9IGhhbmRsZXIgYXNzaWduZWQgZXZlbnQgaGFuZGxlclxuICovXG5FdmVudEhhbmRsZXIuc2V0SW5wdXRIYW5kbGVyID0gZnVuY3Rpb24gc2V0SW5wdXRIYW5kbGVyKG9iamVjdCwgaGFuZGxlcikge1xuICAgIG9iamVjdC50cmlnZ2VyID0gaGFuZGxlci50cmlnZ2VyLmJpbmQoaGFuZGxlcik7XG4gICAgaWYgKGhhbmRsZXIuc3Vic2NyaWJlICYmIGhhbmRsZXIudW5zdWJzY3JpYmUpIHtcbiAgICAgICAgb2JqZWN0LnN1YnNjcmliZSA9IGhhbmRsZXIuc3Vic2NyaWJlLmJpbmQoaGFuZGxlcik7XG4gICAgICAgIG9iamVjdC51bnN1YnNjcmliZSA9IGhhbmRsZXIudW5zdWJzY3JpYmUuYmluZChoYW5kbGVyKTtcbiAgICB9XG59O1xuXG4vKipcbiAqIEFzc2lnbiBhbiBldmVudCBoYW5kbGVyIHRvIHJlY2VpdmUgYW4gb2JqZWN0J3Mgb3V0cHV0IGV2ZW50cy5cbiAqXG4gKiBAbWV0aG9kIHNldE91dHB1dEhhbmRsZXJcbiAqIEBzdGF0aWNcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IG9iamVjdCB0byBtaXggcGlwZSwgdW5waXBlLCBvbiwgYWRkTGlzdGVuZXIsIGFuZCByZW1vdmVMaXN0ZW5lciBmdW5jdGlvbnMgaW50b1xuICogQHBhcmFtIHtFdmVudEhhbmRsZXJ9IGhhbmRsZXIgYXNzaWduZWQgZXZlbnQgaGFuZGxlclxuICovXG5FdmVudEhhbmRsZXIuc2V0T3V0cHV0SGFuZGxlciA9IGZ1bmN0aW9uIHNldE91dHB1dEhhbmRsZXIob2JqZWN0LCBoYW5kbGVyKSB7XG4gICAgaWYgKGhhbmRsZXIgaW5zdGFuY2VvZiBFdmVudEhhbmRsZXIpIGhhbmRsZXIuYmluZFRoaXMob2JqZWN0KTtcbiAgICBvYmplY3QucGlwZSA9IGhhbmRsZXIucGlwZS5iaW5kKGhhbmRsZXIpO1xuICAgIG9iamVjdC51bnBpcGUgPSBoYW5kbGVyLnVucGlwZS5iaW5kKGhhbmRsZXIpO1xuICAgIG9iamVjdC5vbiA9IGhhbmRsZXIub24uYmluZChoYW5kbGVyKTtcbiAgICBvYmplY3QuYWRkTGlzdGVuZXIgPSBvYmplY3Qub247XG4gICAgb2JqZWN0LnJlbW92ZUxpc3RlbmVyID0gaGFuZGxlci5yZW1vdmVMaXN0ZW5lci5iaW5kKGhhbmRsZXIpO1xufTtcblxuLyoqXG4gKiBUcmlnZ2VyIGFuIGV2ZW50LCBzZW5kaW5nIHRvIGFsbCBkb3duc3RyZWFtIGhhbmRsZXJzXG4gKiAgIGxpc3RlbmluZyBmb3IgcHJvdmlkZWQgJ3R5cGUnIGtleS5cbiAqXG4gKiBAbWV0aG9kIGVtaXRcbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gdHlwZSBldmVudCB0eXBlIGtleSAoZm9yIGV4YW1wbGUsICdjbGljaycpXG4gKiBAcGFyYW0ge09iamVjdH0gZXZlbnQgZXZlbnQgZGF0YVxuICogQHJldHVybiB7RXZlbnRIYW5kbGVyfSB0aGlzXG4gKi9cbkV2ZW50SGFuZGxlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uIGVtaXQodHlwZSwgZXZlbnQpIHtcbiAgICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXQuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB2YXIgaSA9IDA7XG4gICAgZm9yIChpID0gMDsgaSA8IHRoaXMuZG93bnN0cmVhbS5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAodGhpcy5kb3duc3RyZWFtW2ldLnRyaWdnZXIpIHRoaXMuZG93bnN0cmVhbVtpXS50cmlnZ2VyKHR5cGUsIGV2ZW50KTtcbiAgICB9XG4gICAgZm9yIChpID0gMDsgaSA8IHRoaXMuZG93bnN0cmVhbUZuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHRoaXMuZG93bnN0cmVhbUZuW2ldKHR5cGUsIGV2ZW50KTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEFsaWFzIGZvciBlbWl0XG4gKiBAbWV0aG9kIGFkZExpc3RlbmVyXG4gKi9cbkV2ZW50SGFuZGxlci5wcm90b3R5cGUudHJpZ2dlciA9IEV2ZW50SGFuZGxlci5wcm90b3R5cGUuZW1pdDtcblxuLyoqXG4gKiBBZGQgZXZlbnQgaGFuZGxlciBvYmplY3QgdG8gc2V0IG9mIGRvd25zdHJlYW0gaGFuZGxlcnMuXG4gKlxuICogQG1ldGhvZCBwaXBlXG4gKlxuICogQHBhcmFtIHtFdmVudEhhbmRsZXJ9IHRhcmdldCBldmVudCBoYW5kbGVyIHRhcmdldCBvYmplY3RcbiAqIEByZXR1cm4ge0V2ZW50SGFuZGxlcn0gcGFzc2VkIGV2ZW50IGhhbmRsZXJcbiAqL1xuRXZlbnRIYW5kbGVyLnByb3RvdHlwZS5waXBlID0gZnVuY3Rpb24gcGlwZSh0YXJnZXQpIHtcbiAgICBpZiAodGFyZ2V0LnN1YnNjcmliZSBpbnN0YW5jZW9mIEZ1bmN0aW9uKSByZXR1cm4gdGFyZ2V0LnN1YnNjcmliZSh0aGlzKTtcblxuICAgIHZhciBkb3duc3RyZWFtQ3R4ID0gKHRhcmdldCBpbnN0YW5jZW9mIEZ1bmN0aW9uKSA/IHRoaXMuZG93bnN0cmVhbUZuIDogdGhpcy5kb3duc3RyZWFtO1xuICAgIHZhciBpbmRleCA9IGRvd25zdHJlYW1DdHguaW5kZXhPZih0YXJnZXQpO1xuICAgIGlmIChpbmRleCA8IDApIGRvd25zdHJlYW1DdHgucHVzaCh0YXJnZXQpO1xuXG4gICAgaWYgKHRhcmdldCBpbnN0YW5jZW9mIEZ1bmN0aW9uKSB0YXJnZXQoJ3BpcGUnLCBudWxsKTtcbiAgICBlbHNlIGlmICh0YXJnZXQudHJpZ2dlcikgdGFyZ2V0LnRyaWdnZXIoJ3BpcGUnLCBudWxsKTtcblxuICAgIHJldHVybiB0YXJnZXQ7XG59O1xuXG4vKipcbiAqIFJlbW92ZSBoYW5kbGVyIG9iamVjdCBmcm9tIHNldCBvZiBkb3duc3RyZWFtIGhhbmRsZXJzLlxuICogICBVbmRvZXMgd29yayBvZiBcInBpcGVcIi5cbiAqXG4gKiBAbWV0aG9kIHVucGlwZVxuICpcbiAqIEBwYXJhbSB7RXZlbnRIYW5kbGVyfSB0YXJnZXQgdGFyZ2V0IGhhbmRsZXIgb2JqZWN0XG4gKiBAcmV0dXJuIHtFdmVudEhhbmRsZXJ9IHByb3ZpZGVkIHRhcmdldFxuICovXG5FdmVudEhhbmRsZXIucHJvdG90eXBlLnVucGlwZSA9IGZ1bmN0aW9uIHVucGlwZSh0YXJnZXQpIHtcbiAgICBpZiAodGFyZ2V0LnVuc3Vic2NyaWJlIGluc3RhbmNlb2YgRnVuY3Rpb24pIHJldHVybiB0YXJnZXQudW5zdWJzY3JpYmUodGhpcyk7XG5cbiAgICB2YXIgZG93bnN0cmVhbUN0eCA9ICh0YXJnZXQgaW5zdGFuY2VvZiBGdW5jdGlvbikgPyB0aGlzLmRvd25zdHJlYW1GbiA6IHRoaXMuZG93bnN0cmVhbTtcbiAgICB2YXIgaW5kZXggPSBkb3duc3RyZWFtQ3R4LmluZGV4T2YodGFyZ2V0KTtcbiAgICBpZiAoaW5kZXggPj0gMCkge1xuICAgICAgICBkb3duc3RyZWFtQ3R4LnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgIGlmICh0YXJnZXQgaW5zdGFuY2VvZiBGdW5jdGlvbikgdGFyZ2V0KCd1bnBpcGUnLCBudWxsKTtcbiAgICAgICAgZWxzZSBpZiAodGFyZ2V0LnRyaWdnZXIpIHRhcmdldC50cmlnZ2VyKCd1bnBpcGUnLCBudWxsKTtcbiAgICAgICAgcmV0dXJuIHRhcmdldDtcbiAgICB9XG4gICAgZWxzZSByZXR1cm4gZmFsc2U7XG59O1xuXG4vKipcbiAqIEJpbmQgYSBjYWxsYmFjayBmdW5jdGlvbiB0byBhbiBldmVudCB0eXBlIGhhbmRsZWQgYnkgdGhpcyBvYmplY3QuXG4gKlxuICogQG1ldGhvZCBcIm9uXCJcbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gdHlwZSBldmVudCB0eXBlIGtleSAoZm9yIGV4YW1wbGUsICdjbGljaycpXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKHN0cmluZywgT2JqZWN0KX0gaGFuZGxlciBjYWxsYmFja1xuICogQHJldHVybiB7RXZlbnRIYW5kbGVyfSB0aGlzXG4gKi9cbkV2ZW50SGFuZGxlci5wcm90b3R5cGUub24gPSBmdW5jdGlvbiBvbih0eXBlLCBoYW5kbGVyKSB7XG4gICAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIGlmICghKHR5cGUgaW4gdGhpcy51cHN0cmVhbUxpc3RlbmVycykpIHtcbiAgICAgICAgdmFyIHVwc3RyZWFtTGlzdGVuZXIgPSB0aGlzLnRyaWdnZXIuYmluZCh0aGlzLCB0eXBlKTtcbiAgICAgICAgdGhpcy51cHN0cmVhbUxpc3RlbmVyc1t0eXBlXSA9IHVwc3RyZWFtTGlzdGVuZXI7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy51cHN0cmVhbS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdGhpcy51cHN0cmVhbVtpXS5vbih0eXBlLCB1cHN0cmVhbUxpc3RlbmVyKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQWxpYXMgZm9yIFwib25cIlxuICogQG1ldGhvZCBhZGRMaXN0ZW5lclxuICovXG5FdmVudEhhbmRsZXIucHJvdG90eXBlLmFkZExpc3RlbmVyID0gRXZlbnRIYW5kbGVyLnByb3RvdHlwZS5vbjtcblxuLyoqXG4gKiBMaXN0ZW4gZm9yIGV2ZW50cyBmcm9tIGFuIHVwc3RyZWFtIGV2ZW50IGhhbmRsZXIuXG4gKlxuICogQG1ldGhvZCBzdWJzY3JpYmVcbiAqXG4gKiBAcGFyYW0ge0V2ZW50RW1pdHRlcn0gc291cmNlIHNvdXJjZSBlbWl0dGVyIG9iamVjdFxuICogQHJldHVybiB7RXZlbnRIYW5kbGVyfSB0aGlzXG4gKi9cbkV2ZW50SGFuZGxlci5wcm90b3R5cGUuc3Vic2NyaWJlID0gZnVuY3Rpb24gc3Vic2NyaWJlKHNvdXJjZSkge1xuICAgIHZhciBpbmRleCA9IHRoaXMudXBzdHJlYW0uaW5kZXhPZihzb3VyY2UpO1xuICAgIGlmIChpbmRleCA8IDApIHtcbiAgICAgICAgdGhpcy51cHN0cmVhbS5wdXNoKHNvdXJjZSk7XG4gICAgICAgIGZvciAodmFyIHR5cGUgaW4gdGhpcy51cHN0cmVhbUxpc3RlbmVycykge1xuICAgICAgICAgICAgc291cmNlLm9uKHR5cGUsIHRoaXMudXBzdHJlYW1MaXN0ZW5lcnNbdHlwZV0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBTdG9wIGxpc3RlbmluZyB0byBldmVudHMgZnJvbSBhbiB1cHN0cmVhbSBldmVudCBoYW5kbGVyLlxuICpcbiAqIEBtZXRob2QgdW5zdWJzY3JpYmVcbiAqXG4gKiBAcGFyYW0ge0V2ZW50RW1pdHRlcn0gc291cmNlIHNvdXJjZSBlbWl0dGVyIG9iamVjdFxuICogQHJldHVybiB7RXZlbnRIYW5kbGVyfSB0aGlzXG4gKi9cbkV2ZW50SGFuZGxlci5wcm90b3R5cGUudW5zdWJzY3JpYmUgPSBmdW5jdGlvbiB1bnN1YnNjcmliZShzb3VyY2UpIHtcbiAgICB2YXIgaW5kZXggPSB0aGlzLnVwc3RyZWFtLmluZGV4T2Yoc291cmNlKTtcbiAgICBpZiAoaW5kZXggPj0gMCkge1xuICAgICAgICB0aGlzLnVwc3RyZWFtLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgIGZvciAodmFyIHR5cGUgaW4gdGhpcy51cHN0cmVhbUxpc3RlbmVycykge1xuICAgICAgICAgICAgc291cmNlLnJlbW92ZUxpc3RlbmVyKHR5cGUsIHRoaXMudXBzdHJlYW1MaXN0ZW5lcnNbdHlwZV0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBFdmVudEhhbmRsZXI7IiwidmFyIEV2ZW50SGFuZGxlciAgICAgICA9IHJlcXVpcmUoJy4uL0V2ZW50cy9FdmVudEhhbmRsZXInKTtcblxudmFyIEVuZ2luZSAgICAgICAgICA9IHt9O1xuXG5FbmdpbmUuZXZlbnRJbnB1dCAgICAgID0gbmV3IEV2ZW50SGFuZGxlcigpO1xuRW5naW5lLmV2ZW50T3V0cHV0ICAgICA9IG5ldyBFdmVudEhhbmRsZXIoKTtcblxuRXZlbnRIYW5kbGVyLnNldElucHV0SGFuZGxlcihFbmdpbmUsIEVuZ2luZS5ldmVudElucHV0KTtcbkV2ZW50SGFuZGxlci5zZXRPdXRwdXRIYW5kbGVyKEVuZ2luZSwgRW5naW5lLmV2ZW50T3V0cHV0KTtcblxuRW5naW5lLmN1cnJlbnRTdGF0ZSA9IG51bGw7XG5cbkVuZ2luZS5zZXRTdGF0ZSAgICAgPSBmdW5jdGlvbiBzZXRTdGF0ZShzdGF0ZSlcbntcblx0aWYgKHN0YXRlLmluaXRpYWxpemUpIHN0YXRlLmluaXRpYWxpemUoKTtcblx0XG5cdGlmICh0aGlzLmN1cnJlbnRTdGF0ZSlcblx0e1xuXHRcdHRoaXMuY3VycmVudFN0YXRlLnVucGlwZShFbmdpbmUuZXZlbnRJbnB1dCk7XG5cdFx0dGhpcy5jdXJyZW50U3RhdGUuaGlkZSgpO1xuXHR9XG5cblx0c3RhdGUucGlwZSh0aGlzLmV2ZW50SW5wdXQpO1xuXHRzdGF0ZS5zaG93KCk7XG5cblx0dGhpcy5jdXJyZW50U3RhdGUgPSBzdGF0ZTtcbn07XG5cbkVuZ2luZS5zdGVwICAgICAgICAgPSBmdW5jdGlvbiBzdGVwKHRpbWUpXG57XG5cdHZhciBzdGF0ZSA9IEVuZ2luZS5jdXJyZW50U3RhdGU7XG5cdGlmIChzdGF0ZSlcblx0e1xuXHRcdGlmIChzdGF0ZS51cGRhdGUpIHN0YXRlLnVwZGF0ZSgpO1xuXHR9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEVuZ2luZTsiLCJ2YXIgQVNTRVRfVFlQRSA9ICdpbWFnZSc7XG5cbnZhciBFdmVudEhhbmRsZXIgICAgICAgPSByZXF1aXJlKCcuLi9FdmVudHMvRXZlbnRIYW5kbGVyJyk7XG5cbnZhciBJbWFnZUxvYWRlciAgPSB7fTtcbnZhciBJbWFnZXMgICAgICAgPSB7fTtcblxuSW1hZ2VMb2FkZXIuZXZlbnRJbnB1dCAgICAgID0gbmV3IEV2ZW50SGFuZGxlcigpO1xuSW1hZ2VMb2FkZXIuZXZlbnRPdXRwdXQgICAgID0gbmV3IEV2ZW50SGFuZGxlcigpO1xuXG5FdmVudEhhbmRsZXIuc2V0SW5wdXRIYW5kbGVyKEltYWdlTG9hZGVyLCBJbWFnZUxvYWRlci5ldmVudElucHV0KTtcbkV2ZW50SGFuZGxlci5zZXRPdXRwdXRIYW5kbGVyKEltYWdlTG9hZGVyLCBJbWFnZUxvYWRlci5ldmVudE91dHB1dCk7XG5cbkltYWdlTG9hZGVyLmxvYWQgPSBmdW5jdGlvbiBsb2FkKGFzc2V0KVxue1xuICAgIHZhciBzb3VyY2UgPSBhc3NldC5zb3VyY2U7XG4gICAgaWYgKCFJbWFnZXNbc291cmNlXSlcbiAgICB7XG4gICAgICAgIHZhciBpbWFnZSA9IG5ldyBJbWFnZSgpO1xuICAgICAgICBpbWFnZS5zcmMgPSBzb3VyY2U7XG4gICAgICAgIGltYWdlLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgZmluaXNoZWRMb2FkaW5nKHNvdXJjZSk7XG4gICAgICAgIH07XG4gICAgICAgIEltYWdlc1tzb3VyY2VdID0gaW1hZ2U7XG4gICAgfVxufTtcblxuSW1hZ2VMb2FkZXIuZ2V0ICA9IGZ1bmN0aW9uIGdldChzb3VyY2UpXG57XG4gICAgcmV0dXJuIEltYWdlc1tzb3VyY2VdO1xufTtcblxuSW1hZ2VMb2FkZXIudG9TdHJpbmcgPSBmdW5jdGlvbiB0b1N0cmluZygpXG57XG4gICAgcmV0dXJuIEFTU0VUX1RZUEU7XG59O1xuXG5mdW5jdGlvbiBmaW5pc2hlZExvYWRpbmcoc291cmNlKVxue1xuICAgIEltYWdlTG9hZGVyLmV2ZW50T3V0cHV0LmVtaXQoJ2RvbmVMb2FkaW5nJywge3NvdXJjZTogc291cmNlLCB0eXBlOiBBU1NFVF9UWVBFfSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gSW1hZ2VMb2FkZXI7IiwidmFyIEV2ZW50SGFuZGxlciAgICAgICA9IHJlcXVpcmUoJy4uL0V2ZW50cy9FdmVudEhhbmRsZXInKTtcblxudmFyIFZpZXdwb3J0ID0ge307XG5cblZpZXdwb3J0LmV2ZW50SW5wdXQgICAgICA9IG5ldyBFdmVudEhhbmRsZXIoKTtcblZpZXdwb3J0LmV2ZW50T3V0cHV0ICAgICA9IG5ldyBFdmVudEhhbmRsZXIoKTtcblxuRXZlbnRIYW5kbGVyLnNldElucHV0SGFuZGxlcihWaWV3cG9ydCwgVmlld3BvcnQuZXZlbnRJbnB1dCk7XG5FdmVudEhhbmRsZXIuc2V0T3V0cHV0SGFuZGxlcihWaWV3cG9ydCwgVmlld3BvcnQuZXZlbnRPdXRwdXQpO1xuXG53aW5kb3cub25yZXNpemUgPSBoYW5kbGVSZXNpemU7XG5cbmZ1bmN0aW9uIGhhbmRsZVJlc2l6ZSgpXG57XG5cdFZpZXdwb3J0LmV2ZW50T3V0cHV0LmVtaXQoJ3Jlc2l6ZScpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFZpZXdwb3J0OyIsInZhciBDT01QTEVURSA9IFwiY29tcGxldGVcIjtcbnZhciBMT0FEX1NUQVJURUQgPSBcInN0YXJ0TG9hZGluZ1wiO1xudmFyIExPQURfQ09NUExFVEVEID0gXCJkb25lTG9hZGluZ1wiO1xudmFyIE5PTkUgPSAnbm9uZSc7XG52YXIgVklTSUJMRSA9ICdpbmxpbmUnO1xuXG52YXIgRXZlbnRIYW5kbGVyICAgICAgID0gcmVxdWlyZSgnLi4vRXZlbnRzL0V2ZW50SGFuZGxlcicpO1xuXG52YXIgTG9hZGluZyAgICAgICAgICA9IHt9O1xudmFyIGJvZHlSZWFkeSAgICAgICAgPSBmYWxzZTtcbnZhciBhc3NldFN0YWNrICAgICAgID0gW107XG52YXIgbG9hZGVyUmVnaXN0cnkgICA9IHt9O1xudmFyIGNvbnRhaW5lciAgICAgICAgPSBudWxsO1xudmFyIHNwbGFzaFNjcmVlbiAgICAgPSBuZXcgSW1hZ2UoKTtcbnNwbGFzaFNjcmVlbi5zcmMgICAgID0gJy4uLy4uL0Fzc2V0cy9Mb2FkaW5nLi4uLnBuZyc7XG5zcGxhc2hTY3JlZW4ud2lkdGggICA9IHNwbGFzaFdpZHRoID0gNTAwO1xuc3BsYXNoU2NyZWVuLmhlaWdodCAgPSBzcGxhc2hIZWlnaHQgPSAxNjA7XG5Mb2FkaW5nLmV2ZW50SW5wdXQgICAgICA9IG5ldyBFdmVudEhhbmRsZXIoKTtcbkxvYWRpbmcuZXZlbnRPdXRwdXQgICAgID0gbmV3IEV2ZW50SGFuZGxlcigpO1xuXG5FdmVudEhhbmRsZXIuc2V0SW5wdXRIYW5kbGVyKExvYWRpbmcsIExvYWRpbmcuZXZlbnRJbnB1dCk7XG5FdmVudEhhbmRsZXIuc2V0T3V0cHV0SGFuZGxlcihMb2FkaW5nLCBMb2FkaW5nLmV2ZW50T3V0cHV0KTtcblxuTG9hZGluZy5ldmVudElucHV0Lm9uKExPQURfQ09NUExFVEVELCBoYW5kbGVDb21wbGV0ZWRMb2FkKTtcbkxvYWRpbmcuZXZlbnRJbnB1dC5vbigncmVzaXplJywgaGFuZGxlUmVzaXplKTtcblxuTG9hZGluZy5pbml0aWFsaXplID0gZnVuY3Rpb24gaW5pdGlhbGl6ZSgpXG57XG4gICAgaWYgKCFjb250YWluZXIpXG4gICAge1xuICAgICAgICBjb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbG9hZGluZycpO1xuICAgICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQoc3BsYXNoU2NyZWVuKTtcbiAgICAgICAgc3BsYXNoU2NyZWVuLnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgICAgICAgc3BsYXNoU2NyZWVuLnN0eWxlLnRvcCA9ICh3aW5kb3cuaW5uZXJIZWlnaHQgKiAwLjUpIC0gKHNwbGFzaEhlaWdodCAqIDAuNSkgKyAncHgnO1xuICAgICAgICBzcGxhc2hTY3JlZW4uc3R5bGUubGVmdCA9ICh3aW5kb3cuaW5uZXJXaWR0aCAqIDAuNSkgLSAoc3BsYXNoV2lkdGgqIDAuNSkgKyAncHgnO1xuICAgIH1cbiAgICBpZiAoYXNzZXRTdGFjay5sZW5ndGgpXG4gICAge1xuICAgICAgICB0aGlzLmV2ZW50T3V0cHV0LmVtaXQoTE9BRF9TVEFSVEVEKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhc3NldFN0YWNrLmxlbmd0aDsgaSsrKVxuICAgICAgICB7XG4gICAgICAgICAgICB2YXIgYXNzZXQgID0gYXNzZXRTdGFja1tpXTtcbiAgICAgICAgICAgIHZhciBsb2FkZXIgPSBhc3NldC50eXBlO1xuICAgICAgICAgICAgbG9hZGVyUmVnaXN0cnlbbG9hZGVyXS5sb2FkKGFzc2V0KTtcbiAgICAgICAgfVxuICAgIH1cbn07XG5cbkxvYWRpbmcubG9hZCAgICAgICA9IGZ1bmN0aW9uIGxvYWQoYXNzZXQpXG57XG4gICAgYXNzZXRTdGFjay5wdXNoKGFzc2V0KTtcbn07XG5cbkxvYWRpbmcuc2hvdyAgICAgICA9IGZ1bmN0aW9uIHNob3coKVxue1xuICAgIGNvbnRhaW5lci5zdHlsZS5kaXNwbGF5ID0gVklTSUJMRTtcbn07XG5cbkxvYWRpbmcuaGlkZSAgICAgICA9IGZ1bmN0aW9uIGhpZGUoKVxue1xuICAgIGNvbnRhaW5lci5zdHlsZS5kaXNwbGF5ID0gTk9ORTtcbn07XG5cbkxvYWRpbmcucmVnaXN0ZXIgICA9IGZ1bmN0aW9uIHJlZ2lzdGVyKGxvYWRlcilcbntcbiAgICB2YXIgbG9hZGVyTmFtZSAgICAgICAgICAgICA9IGxvYWRlci50b1N0cmluZygpO1xuICAgIGxvYWRlclJlZ2lzdHJ5W2xvYWRlck5hbWVdID0gbG9hZGVyO1xuICAgIGxvYWRlci5waXBlKHRoaXMuZXZlbnRJbnB1dCk7XG59O1xuXG5mdW5jdGlvbiBoYW5kbGVDb21wbGV0ZWRMb2FkKGRhdGEpXG57XG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpXG4gICAge1xuICAgICAgICB2YXIgc291cmNlID0gZGF0YS5zb3VyY2U7XG4gICAgICAgIHZhciBsb2NhdGlvbiA9IGFzc2V0U3RhY2suaW5kZXhPZihzb3VyY2UpO1xuICAgICAgICBpZiAobG9jYXRpb24pIGFzc2V0U3RhY2suc3BsaWNlKGxvY2F0aW9uLCAxKTtcbiAgICAgICAgaWYgKCFhc3NldFN0YWNrLmxlbmd0aCkgTG9hZGluZy5ldmVudE91dHB1dC5lbWl0KExPQURfQ09NUExFVEVEKTtcbiAgICB9LCAxMDAwKTtcbn1cblxuZnVuY3Rpb24gaGFuZGxlUmVzaXplKClcbntcbiAgICBzcGxhc2hTY3JlZW4uc3R5bGUudG9wID0gKHdpbmRvdy5pbm5lckhlaWdodCAqIDAuNSkgLSAoc3BsYXNoSGVpZ2h0ICogMC41KSArICdweCc7XG4gICAgc3BsYXNoU2NyZWVuLnN0eWxlLmxlZnQgPSAod2luZG93LmlubmVyV2lkdGggKiAwLjUpIC0gKHNwbGFzaFdpZHRoKiAwLjUpICsgJ3B4Jztcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBMb2FkaW5nOyIsInZhciBOT05FID0gJ25vbmUnO1xudmFyIFZJU0lCTEUgPSAnaW5saW5lJztcblxudmFyIEV2ZW50SGFuZGxlciAgICAgICA9IHJlcXVpcmUoJy4uL0V2ZW50cy9FdmVudEhhbmRsZXInKTtcblxudmFyIE1lbnUgICAgICAgICAgPSB7fTtcblxuTWVudS5ldmVudElucHV0ICAgICAgPSBuZXcgRXZlbnRIYW5kbGVyKCk7XG5NZW51LmV2ZW50T3V0cHV0ICAgICA9IG5ldyBFdmVudEhhbmRsZXIoKTtcblxuRXZlbnRIYW5kbGVyLnNldElucHV0SGFuZGxlcihNZW51LCBNZW51LmV2ZW50SW5wdXQpO1xuRXZlbnRIYW5kbGVyLnNldE91dHB1dEhhbmRsZXIoTWVudSwgTWVudS5ldmVudE91dHB1dCk7XG5cbk1lbnUuZXZlbnRJbnB1dC5vbigncmVzaXplJywgaGFuZGxlUmVzaXplKTtcblxudmFyIG1lbnVFbGVtZW50ID0gbnVsbCxcbmNvbnRhaW5lciAgICAgICA9IG51bGwsXG5uZXdHYW1lICAgICAgICAgPSBudWxsO1xuXG5NZW51LmluaXRpYWxpemUgPSBmdW5jdGlvbiBpbml0aWFsaXplKClcbntcbiAgICBjb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWVudScpO1xuICAgIG1lbnVFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgbWVudUVsZW1lbnQuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICAgIG5ld0dhbWUgICAgID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgbmV3R2FtZS5vbmNsaWNrID0gc3RhcnROZXdHYW1lO1xuICAgIG5ld0dhbWUuaW5uZXJIVE1MID0gJ05ldyBHYW1lJztcbiAgICBuZXdHYW1lLnN0eWxlLmZvbnRTaXplID0gJzUwcHgnO1xuICAgIG5ld0dhbWUuc3R5bGUuZm9udEZhbWlseSA9ICdIZWx2ZXRpY2EnO1xuICAgIG5ld0dhbWUuc3R5bGUuY29sb3IgPSAnI0ZGRic7XG4gICAgbWVudUVsZW1lbnQuYXBwZW5kQ2hpbGQobmV3R2FtZSk7XG4gICAgY29udGFpbmVyLmFwcGVuZENoaWxkKG1lbnVFbGVtZW50KTtcbiAgICBtZW51RWxlbWVudC5zdHlsZS50b3AgID0gKHdpbmRvdy5pbm5lckhlaWdodCAqIDAuNSkgLSAoNTggKiAwLjUpICsgJ3B4JztcbiAgICBtZW51RWxlbWVudC5zdHlsZS5sZWZ0ID0gKHdpbmRvdy5pbm5lcldpZHRoICogMC41KSAtICgyNTEgKiAwLjUpICsgJ3B4Jztcbn07XG5cbk1lbnUuc2hvdyAgICAgICA9IGZ1bmN0aW9uIHNob3coKVxue1xuICAgIGNvbnRhaW5lci5zdHlsZS5kaXNwbGF5ID0gVklTSUJMRTtcbn07XG5cbk1lbnUuaGlkZSAgICAgICA9IGZ1bmN0aW9uIGhpZGUoKVxue1xuICAgIGNvbnRhaW5lci5zdHlsZS5kaXNwbGF5ID0gTk9ORTtcbn07XG5cbmZ1bmN0aW9uIGhhbmRsZVJlc2l6ZSgpXG57XG4gICAgbWVudUVsZW1lbnQuc3R5bGUudG9wID0gKHdpbmRvdy5pbm5lckhlaWdodCAqIDAuNSkgLSAoNTggKiAwLjUpICsgJ3B4JztcbiAgICBtZW51RWxlbWVudC5zdHlsZS5sZWZ0ID0gKHdpbmRvdy5pbm5lcldpZHRoICogMC41KSAtICgyNTEgKiAwLjUpICsgJ3B4Jztcbn1cblxuZnVuY3Rpb24gc3RhcnROZXdHYW1lKClcbntcbiAgICBNZW51LmV2ZW50T3V0cHV0LmVtaXQoJ25ld0dhbWUnKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBNZW51OyIsInZhciBOT05FID0gJ25vbmUnO1xudmFyIFZJU0lCTEUgPSAnaW5saW5lJztcblxudmFyIEV2ZW50SGFuZGxlciAgICAgICA9IHJlcXVpcmUoJy4uL0V2ZW50cy9FdmVudEhhbmRsZXInKTtcbnZhciBGYW1vdXNFbmdpbmUgICAgICAgPSByZXF1aXJlKCcuLi8uLi9MaWJyYXJpZXMvTWl4ZWRNb2RlL3NyYy9mYW1vdXMvY29yZS9FbmdpbmUnKTtcblxudmFyIFBsYXlpbmcgICAgICAgICAgPSB7fTtcblxuUGxheWluZy5ldmVudElucHV0ICAgICAgPSBuZXcgRXZlbnRIYW5kbGVyKCk7XG5QbGF5aW5nLmV2ZW50T3V0cHV0ICAgICA9IG5ldyBFdmVudEhhbmRsZXIoKTtcblxuRXZlbnRIYW5kbGVyLnNldElucHV0SGFuZGxlcihQbGF5aW5nLCBQbGF5aW5nLmV2ZW50SW5wdXQpO1xuRXZlbnRIYW5kbGVyLnNldE91dHB1dEhhbmRsZXIoUGxheWluZywgUGxheWluZy5ldmVudE91dHB1dCk7XG5cblBsYXlpbmcuaW5pdGlhbGl6ZSA9IGZ1bmN0aW9uIGluaXRpYWxpemUoKVxue1xuXHRjb25zb2xlLmxvZygxKVxuIFx0RmFtb3VzRW5naW5lLmNyZWF0ZUNvbnRleHQoeyBoYXNDYW1lcmE6IGZhbHNlIH0pO1xufTtcblxuUGxheWluZy51cGRhdGUgICAgID0gZnVuY3Rpb24gdXBkYXRlKClcbntcblx0RmFtb3VzRW5naW5lLnN0ZXAoKTtcbn07XG5cblBsYXlpbmcuc2hvdyAgICAgICA9IGZ1bmN0aW9uIHNob3coKVxue1xufTtcblxuUGxheWluZy5oaWRlICAgICAgID0gZnVuY3Rpb24gaGlkZSgpXG57XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFBsYXlpbmc7IiwidmFyIEVuZ2luZSAgPSByZXF1aXJlKCcuL0dhbWUvRW5naW5lJyk7XG52YXIgTG9hZGluZyA9IHJlcXVpcmUoJy4vU3RhdGVzL0xvYWRpbmcnKTtcbnZhciBNZW51ICAgID0gcmVxdWlyZSgnLi9TdGF0ZXMvTWVudScpO1xudmFyIFBsYXlpbmcgPSByZXF1aXJlKCcuL1N0YXRlcy9QbGF5aW5nJyk7XG52YXIgRXZlbnRIYW5kbGVyID0gcmVxdWlyZSgnLi9FdmVudHMvRXZlbnRIYW5kbGVyJyk7XG52YXIgSW1hZ2VMb2FkZXIgID0gcmVxdWlyZSgnLi9HYW1lL0ltYWdlTG9hZGVyJyk7XG52YXIgVmlld3BvcnQgICAgID0gcmVxdWlyZSgnLi9HYW1lL1ZpZXdwb3J0Jyk7XG5cbnZhciBDb250cm9sbGVyID0gbmV3IEV2ZW50SGFuZGxlcigpO1xuXG5WaWV3cG9ydC5waXBlKE1lbnUpO1xuVmlld3BvcnQucGlwZShMb2FkaW5nKTtcblZpZXdwb3J0LnBpcGUoUGxheWluZyk7XG5cbkVuZ2luZS5waXBlKENvbnRyb2xsZXIpO1xuTWVudS5waXBlKENvbnRyb2xsZXIpO1xuTG9hZGluZy5waXBlKENvbnRyb2xsZXIpO1xuXG5Db250cm9sbGVyLm9uKCdkb25lTG9hZGluZycsIGdvVG9NZW51KTtcbkNvbnRyb2xsZXIub24oJ25ld0dhbWUnLCBzdGFydEdhbWUpO1xuXG52YXIgc3ByaXRlc2hlZXQgPSB7XG5cdHR5cGU6ICdpbWFnZScsXG5cdHNvdXJjZTogJy4uL0Fzc2V0cy9jcmF0ZS5naWYnLFxuXHRkYXRhOiB7fVxufTtcblxuTG9hZGluZy5yZWdpc3RlcihJbWFnZUxvYWRlcik7XG5Mb2FkaW5nLmxvYWQoc3ByaXRlc2hlZXQpO1xuXG5FbmdpbmUuc2V0U3RhdGUoTG9hZGluZyk7XG5cbmZ1bmN0aW9uIGdvVG9NZW51KClcbntcbiAgICBFbmdpbmUuc2V0U3RhdGUoTWVudSk7XG59XG5cbmZ1bmN0aW9uIHN0YXJ0R2FtZSgpXG57XG5cdEVuZ2luZS5zZXRTdGF0ZShQbGF5aW5nKTtcbn1cblxucmVxdWVzdEFuaW1hdGlvbkZyYW1lKEVuZ2luZS5zdGVwKTsiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChjc3MsIGN1c3RvbURvY3VtZW50KSB7XG4gIHZhciBkb2MgPSBjdXN0b21Eb2N1bWVudCB8fCBkb2N1bWVudDtcbiAgaWYgKGRvYy5jcmVhdGVTdHlsZVNoZWV0KSB7XG4gICAgZG9jLmNyZWF0ZVN0eWxlU2hlZXQoKS5jc3NUZXh0ID0gY3NzO1xuICB9IGVsc2Uge1xuICAgIHZhciBoZWFkID0gZG9jLmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoZWFkJylbMF0sXG4gICAgICAgIHN0eWxlID0gZG9jLmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7XG5cbiAgICBzdHlsZS50eXBlID0gJ3RleHQvY3NzJztcbiAgXG4gICAgaWYgKHN0eWxlLnN0eWxlU2hlZXQpIHtcbiAgICAgIHN0eWxlLnN0eWxlU2hlZXQuY3NzVGV4dCA9IGNzcztcbiAgICB9IGVsc2Uge1xuICAgICAgc3R5bGUuYXBwZW5kQ2hpbGQoZG9jLmNyZWF0ZVRleHROb2RlKGNzcykpO1xuICAgIH1cbiAgICBcbiAgICBoZWFkLmFwcGVuZENoaWxkKHN0eWxlKTsgXG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzLmJ5VXJsID0gZnVuY3Rpb24odXJsKSB7XG4gIGlmIChkb2N1bWVudC5jcmVhdGVTdHlsZVNoZWV0KSB7XG4gICAgZG9jdW1lbnQuY3JlYXRlU3R5bGVTaGVldCh1cmwpO1xuICB9IGVsc2Uge1xuICAgIHZhciBoZWFkID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2hlYWQnKVswXSxcbiAgICAgICAgbGluayA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpbmsnKTtcblxuICAgIGxpbmsucmVsID0gJ3N0eWxlc2hlZXQnO1xuICAgIGxpbmsuaHJlZiA9IHVybDtcbiAgXG4gICAgaGVhZC5hcHBlbmRDaGlsZChsaW5rKTsgXG4gIH1cbn07XG4iXX0=
