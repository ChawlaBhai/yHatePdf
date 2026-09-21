const BASE = "https://yhatepdf.sahajsadhu.chatgpt.site";
const tools = [
  ["01", "MERGE PDF", "Combine files and mix pages.", "/tools/merge"],
  ["02", "SPLIT PDF", "Pick individual pages or ranges.", "/tools/split"],
  ["03", "PDF STUDIO", "Run several edits in one session.", "/tools/studio"],
  ["04", "COMPRESS PDF", "Optimize a PDF locally.", "/tools/compress"],
  ["05", "SIGN PDF", "Add a visible signature.", "/tools/sign"],
  ["06", "ORGANIZE", "Reorder, rotate, or remove pages.", "/tools/organize"]
];
const open = (path) => chrome.tabs.create({ url: BASE + path });
const root = document.querySelector("#tools");
for (const [index, name, copy, path] of tools) {
  const button = document.createElement("button");
  button.className = "tool";
  button.innerHTML = `<span>${index}</span><strong>${name}</strong><small>${copy}</small>`;
  button.addEventListener("click", () => open(path));
  root.appendChild(button);
}
document.querySelector("#all-tools").addEventListener("click", () => open("/#tools"));

