Frontend source lives in the numbered files under [frontend/src](/C:/Users/pc/Desktop/cspapp/colorsource-plugin-clean/frontend/src).

Build flow:

- `npm run build`
- source files are concatenated recursively by numeric prefix
- core pieces now live in [00-core](/C:/Users/pc/Desktop/cspapp/colorsource-plugin-clean/frontend/src/00-core)
- reusable UI pieces now live in [01-components](/C:/Users/pc/Desktop/cspapp/colorsource-plugin-clean/frontend/src/01-components)
- auth and app root now live in [06-auth](/C:/Users/pc/Desktop/cspapp/colorsource-plugin-clean/frontend/src/06-auth)
- output goes to [assets/js/app.js](/C:/Users/pc/Desktop/cspapp/colorsource-plugin-clean/assets/js/app.js)

Notes:

- `app.legacy.js` is kept as a parity reference only and is not part of the build
- `_00-runtime.legacy.js`, `_01-ui-kit.legacy.js`, and `_06-auth-root.legacy.js` are chunk references only and are not part of the build
- the plugin enqueues the built file from `assets/js/app.js`
