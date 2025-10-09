// Compatibility shim for hosts that try to run src/index.js directly
// It will load the compiled output from dist/index.js
try {
  require('../dist/index.js');
} catch (e) {
  console.error('Failed to load compiled dist/index.js from src/index.js shim:', e && e.stack ? e.stack : e);
  // rethrow to preserve original behavior
  throw e;
}
