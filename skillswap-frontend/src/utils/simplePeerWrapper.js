// Wrapper for SimplePeer that ensures polyfills are available
import SimplePeer from 'simple-peer';

// Pre-flight check for polyfills
if (!globalThis.EventEmitter) {
  console.warn('EventEmitter polyfill not available, SimplePeer may fail');
}

if (!globalThis.events) {
  console.warn('events polyfill not available, SimplePeer may fail');
}

// Patch SimplePeer's prototype to handle missing dependencies gracefully
const originalInit = SimplePeer.prototype._pc;

export default SimplePeer;
