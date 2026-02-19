// content.js — dual trigger buttons + floating popups on x.com / twitter.com

(() => {
    if (window.__axrgInjected) return;
    window.__axrgInjected = true;

    let triggerContainer = null;
    let activePopup = null;
    let activeOverlay = null;

    // ——— selection trigger buttons ———

    document.addEventListener("mouseup", (e) => {
        if (e.target.closest("#axrg-trigger-wrap") || e.target.closest("#axrg-popup") || e.target.closest("#axrg-overlay")) return;

        setTimeout(() => {
            const selection = window.getSelection();
            const selectedText = selection?.toString().trim();

            if (!selectedText || selectedText.length < 2) {
                destroyTrigger();
                return;
            }

            destroyTrigger();
            showTrigger(e.clientX, e.clientY, selectedText);
        }, 10);
    });

    document.addEventListener("mousedown", (e) => {
        if (e.target.closest("#axrg-trigger-wrap")) return;
        destroyTrigger();
    });

    function showTrigger(x, y, selectedText) {
        triggerContainer = document.createElement("div");
        triggerContainer.id = "axrg-trigger-wrap";
        triggerContainer.style.left = (x + 8) + "px";
        triggerContainer.style.top = (y - 12) + "px";

        // ✦ generate reply button
        const replyBtn = document.createElement("button");
        replyBtn.className = "axrg-trigger-btn";
        replyBtn.textContent = "✦";
        replyBtn.title = "generate reply";
        replyBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            handleTriggerClick("generate-replies", selectedText);
        });

        // ⟡ translate button
        const translateBtn = document.createElement("button");
        translateBtn.className = "axrg-trigger-btn";
        translateBtn.textContent = "⟡";
        translateBtn.title = "translate to english";
        translateBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            handleTriggerClick("translate-text", selectedText);
        });

        triggerContainer.appendChild(replyBtn);
        triggerContainer.appendChild(translateBtn);
        document.body.appendChild(triggerContainer);
    }

    function handleTriggerClick(action, selectedText) {
        const posX = parseInt(triggerContainer.style.left);
        const posY = parseInt(triggerContainer.style.top);

        destroyTrigger();
        destroyPopup();
        showLoading(posX, posY);

        chrome.runtime.sendMessage(
            { action: action, text: selectedText },
            (response) => {
                destroyPopup();

                if (response?.error) {
                    createErrorPopup(posX, posY, response.error);
                } else if (response?.data) {
                    if (action === "generate-replies") {
                        createReplyPopup(posX, posY, response.data);
                    } else if (action === "translate-text") {
                        createTranslatePopup(posX, posY, response.data);
                    }
                }
            }
        );
    }

    function destroyTrigger() {
        if (triggerContainer) {
            triggerContainer.remove();
            triggerContainer = null;
        }
    }

    // ——— loading state ———

    function showLoading(posX, posY) {
        createOverlay();

        activePopup = document.createElement("div");
        activePopup.id = "axrg-popup";
        Object.assign(activePopup.style, calcPosition(posX, posY));

        const header = buildHeader("loading");
        activePopup.appendChild(header);

        const loading = document.createElement("div");
        loading.className = "axrg-loading";
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement("span");
            dot.className = "axrg-loading-dot";
            loading.appendChild(dot);
        }
        activePopup.appendChild(loading);

        document.body.appendChild(activePopup);
    }

    // ——— reply popup ———

    function createReplyPopup(posX, posY, data) {
        createOverlay();

        activePopup = document.createElement("div");
        activePopup.id = "axrg-popup";
        Object.assign(activePopup.style, calcPosition(posX, posY));

        const header = buildHeader("replies");
        activePopup.appendChild(header);

        // turkish translation of original text
        if (data.original_tr) {
            const translationBlock = document.createElement("div");
            translationBlock.id = "axrg-translation";
            translationBlock.textContent = data.original_tr;
            activePopup.appendChild(translationBlock);
        }

        // divider
        const divider = document.createElement("div");
        divider.className = "axrg-divider";
        activePopup.appendChild(divider);

        // reply options
        if (data.replies && data.replies.length > 0) {
            data.replies.forEach((reply) => {
                const btn = document.createElement("button");
                btn.className = "axrg-reply-option";

                // persona type badge
                if (reply.type) {
                    const typeSpan = document.createElement("span");
                    typeSpan.className = "axrg-reply-type";
                    typeSpan.textContent = reply.type;
                    btn.appendChild(typeSpan);
                }

                const enSpan = document.createElement("span");
                enSpan.className = "axrg-reply-en";
                enSpan.textContent = reply.en;

                const trSpan = document.createElement("span");
                trSpan.className = "axrg-reply-tr";
                trSpan.textContent = reply.tr;

                btn.appendChild(enSpan);
                btn.appendChild(trSpan);

                btn.addEventListener("click", () => handleCopy(btn, reply.en));
                activePopup.appendChild(btn);
            });
        }

        // copied feedback
        const copiedMsg = document.createElement("div");
        copiedMsg.id = "axrg-copied-msg";
        copiedMsg.textContent = "copied to clipboard";
        activePopup.appendChild(copiedMsg);

        document.body.appendChild(activePopup);
    }

    // ——— translate popup ———

    function createTranslatePopup(posX, posY, data) {
        createOverlay();

        activePopup = document.createElement("div");
        activePopup.id = "axrg-popup";
        Object.assign(activePopup.style, calcPosition(posX, posY));

        const header = buildHeader("translation");
        activePopup.appendChild(header);

        if (data.translated_text) {
            const textBlock = document.createElement("div");
            textBlock.id = "axrg-translate-result";
            textBlock.textContent = data.translated_text;
            textBlock.title = "click to copy";
            textBlock.addEventListener("click", () => handleCopy(textBlock, data.translated_text));
            activePopup.appendChild(textBlock);
        }

        // copied feedback
        const copiedMsg = document.createElement("div");
        copiedMsg.id = "axrg-copied-msg";
        copiedMsg.textContent = "copied to clipboard";
        activePopup.appendChild(copiedMsg);

        document.body.appendChild(activePopup);
    }

    // ——— error popup ———

    function createErrorPopup(posX, posY, errorMsg) {
        createOverlay();

        activePopup = document.createElement("div");
        activePopup.id = "axrg-popup";
        Object.assign(activePopup.style, calcPosition(posX, posY));

        const header = buildHeader("error");
        activePopup.appendChild(header);

        const errorEl = document.createElement("div");
        errorEl.id = "axrg-error-msg";
        errorEl.textContent = errorMsg;
        activePopup.appendChild(errorEl);

        document.body.appendChild(activePopup);
    }

    // ——— helpers ———

    function buildHeader(titleText) {
        const header = document.createElement("div");
        header.id = "axrg-popup-header";

        const title = document.createElement("span");
        title.id = "axrg-popup-title";
        title.textContent = titleText;

        const closeBtn = document.createElement("button");
        closeBtn.id = "axrg-popup-close";
        closeBtn.textContent = "×";
        closeBtn.addEventListener("click", destroyPopup);

        header.appendChild(title);
        header.appendChild(closeBtn);
        return header;
    }

    function createOverlay() {
        if (activeOverlay) activeOverlay.remove();
        activeOverlay = document.createElement("div");
        activeOverlay.id = "axrg-overlay";
        activeOverlay.addEventListener("click", destroyPopup);
        document.body.appendChild(activeOverlay);
    }

    function calcPosition(x, y) {
        const popupW = 340;
        const popupH = 280;
        let left = x;
        let top = y + 12;

        if (left + popupW > window.innerWidth - 12) {
            left = window.innerWidth - popupW - 12;
        }
        if (left < 12) left = 12;

        if (top + popupH > window.innerHeight - 12) {
            top = y - popupH - 12;
            if (top < 12) top = 12;
        }

        return { left: left + "px", top: top + "px" };
    }

    async function handleCopy(element, text) {
        try {
            await navigator.clipboard.writeText(text);

            const copiedMsg = document.getElementById("axrg-copied-msg");
            if (copiedMsg) copiedMsg.classList.add("visible");

            element.style.borderColor = "#4a7a5a";
            element.style.color = "#4a7a5a";

            setTimeout(() => destroyPopup(), 600);
        } catch (err) {
            console.error("axrg: clipboard write failed", err);
            const textarea = document.createElement("textarea");
            textarea.value = text;
            textarea.style.position = "fixed";
            textarea.style.opacity = "0";
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);

            setTimeout(() => destroyPopup(), 400);
        }
    }

    function destroyPopup() {
        if (activeOverlay) { activeOverlay.remove(); activeOverlay = null; }
        if (activePopup) { activePopup.remove(); activePopup = null; }
    }

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            destroyTrigger();
            destroyPopup();
        }
    });
})();
