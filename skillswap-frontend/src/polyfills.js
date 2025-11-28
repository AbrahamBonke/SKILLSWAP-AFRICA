// Polyfills for Node.js modules used by SimplePeer in browser environment

// EventEmitter polyfill
class EventEmitter {
  constructor() {
    this.events = {};
    this._events = {};
  }

  on(event, listener) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    if (!this._events[event]) {
      this._events[event] = [];
    }
    this.events[event].push(listener);
    this._events[event].push(listener);
    return this;
  }

  once(event, listener) {
    const onceWrapper = (...args) => {
      listener.apply(this, args);
      this.off(event, onceWrapper);
    };
    return this.on(event, onceWrapper);
  }

  off(event, listenerToRemove) {
    if (!this.events[event]) return this;
    this.events[event] = this.events[event].filter(listener => listener !== listenerToRemove);
    if (this._events[event]) {
      this._events[event] = this._events[event].filter(listener => listener !== listenerToRemove);
    }
    return this;
  }

  emit(event, ...args) {
    if (!this.events[event]) return false;
    this.events[event].forEach(listener => {
      try {
        listener.apply(this, args);
      } catch (err) {
        console.error('EventEmitter error:', err);
      }
    });
    return true;
  }

  removeAllListeners(event) {
    if (event) {
      delete this.events[event];
      delete this._events[event];
    } else {
      this.events = {};
      this._events = {};
    }
    return this;
  }

  listenerCount(event) {
    if (!this.events[event]) return 0;
    return this.events[event].length;
  }

  addListener(event, listener) {
    return this.on(event, listener);
  }

  removeListener(event, listener) {
    return this.off(event, listener);
  }
}

// Util polyfill with all commonly used functions
const util = {
  debuglog: (section) => {
    return function() {};
  },
  inspect: (value, opts) => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  },
  format: (f, ...args) => {
    let i = 0;
    return f.replace(/%[sdj%]/g, (x) => {
      if (x === '%%') return '%';
      return args[i++];
    });
  },
  inherits: (ctor, superCtor) => {
    ctor.super_ = superCtor;
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: { value: ctor, enumerable: false, writable: true, configurable: true }
    });
  },
  isArray: Array.isArray,
  isBoolean: (arg) => typeof arg === 'boolean',
  isBuffer: (arg) => arg && typeof arg.constructor !== 'undefined' && typeof arg.constructor.isBuffer === 'function' && arg.constructor.isBuffer(arg),
  isDate: (arg) => arg instanceof Date,
  isError: (arg) => arg instanceof Error,
  isFunction: (arg) => typeof arg === 'function',
  isNull: (arg) => arg === null,
  isNumber: (arg) => typeof arg === 'number',
  isObject: (arg) => typeof arg === 'object',
  isPrimitive: (arg) => arg === null || typeof arg !== 'object',
  isRegExp: (arg) => arg instanceof RegExp,
  isString: (arg) => typeof arg === 'string',
  isSymbol: (arg) => typeof arg === 'symbol',
  isUndefined: (arg) => arg === undefined
};

// Events module that SimplePeer tries to require
const events = {
  EventEmitter,
  __esModule: true,
  default: EventEmitter
};

// Stream module stubs
const stream = {
  Readable: EventEmitter,
  Writable: EventEmitter,
  Duplex: EventEmitter,
  Transform: EventEmitter
};

// Set up globals
if (typeof globalThis !== 'undefined') {
  globalThis.EventEmitter = EventEmitter;
  globalThis.events = events;
  globalThis.util = util;
  globalThis.stream = stream;
  
  // Fallback require for modules
  if (!globalThis.require) {
    globalThis.require = function(module) {
      if (module === 'events') return events;
      if (module === 'util') return util;
      if (module === 'stream') return stream;
      console.warn(`Module not found: ${module}`);
      return {};
    };
  }
}

// Export for ES modules
export { EventEmitter, events, util, stream };
export default { EventEmitter, events, util, stream };

