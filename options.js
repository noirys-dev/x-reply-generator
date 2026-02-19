// options.js — handles groq api key storage

const input = document.getElementById("api-key-input");
const saveBtn = document.getElementById("save-btn");
const statusMsg = document.getElementById("status-msg");

// load existing key on page open
chrome.storage.local.get("groqApiKey", (result) => {
    if (result.groqApiKey) {
        input.value = result.groqApiKey;
    }
});

// save key
saveBtn.addEventListener("click", () => {
    const key = input.value.trim();

    if (!key) {
        showStatus("please enter a valid api key.", "error");
        return;
    }

    chrome.storage.local.set({ groqApiKey: key }, () => {
        showStatus("key saved successfully.", "success");
    });
});

function showStatus(message, type) {
    statusMsg.textContent = message;
    statusMsg.className = "status-msg visible " + type;

    setTimeout(() => {
        statusMsg.className = "status-msg";
    }, 2500);
}
