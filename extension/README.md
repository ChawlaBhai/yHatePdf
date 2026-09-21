# yHatePDF Chrome Extension

Manifest V3 quick-tools launcher for yHatePDF.

## Test locally

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Choose **Load unpacked**.
4. Select this `extension` directory.
5. Pin the extension and open its toolbar popup.

The extension requests only `contextMenus` and `storage`. It does not request browsing history, downloads, file-system, active-tab, or all-sites access.

## Chrome Web Store upload

Upload the generated `yhatepdf-chrome-extension-v1.0.0.zip`. The archive has `manifest.json` at its root, as required by Chrome Web Store. Increment the manifest version before each update.

