// Root compatibility shim for hosts that attempt to run index.js directly
// Loads the compiled server entry (dist/index.js)
try {
  require('./dist/index.js');
} catch (e) {
  console.error('Failed to load compiled dist/index.js from root index.js shim:', e && e.stack ? e.stack : e);
  throw e;
}
