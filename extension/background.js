const BASE = "https://yhatepdf.sahajsadhu.chatgpt.site";
const open = (path) => chrome.tabs.create({ url: BASE + path });

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: "yhatepdf-studio", title: "Open yHatePDF PDF Studio", contexts: ["page", "link"] });
    chrome.contextMenus.create({ id: "yhatepdf-tools", title: "Browse all yHatePDF tools", contexts: ["page", "link"] });
  });
});

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === "yhatepdf-studio") open("/tools/studio");
  if (info.menuItemId === "yhatepdf-tools") open("/#tools");
});

chrome.commands.onCommand.addListener((command) => {
  if (command === "open-pdf-studio") open("/tools/studio");
});

