// background.js — service worker (manifest v3)
// handles groq api communication via message passing.

// listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const selectedText = message.text;
  if (!selectedText) return true;

  // handle async response
  (async () => {
    // retrieve api key from storage
    const { groqApiKey } = await chrome.storage.local.get("groqApiKey");

    if (!groqApiKey) {
      chrome.notifications.create({
        type: "basic",
        title: "api key missing",
        message: "please set your groq api key in the extension options."
      });
      sendResponse({ error: "api key missing" });
      return;
    }

    try {
      switch (message.action) {
        case "generate-replies": {
          const result = await fetchGroqReplies(selectedText, groqApiKey);
          sendResponse({ data: result });
          break;
        }

        case "translate-text": {
          const result = await fetchGroqTranslation(selectedText, groqApiKey);
          sendResponse({ data: result });
          break;
        }

        default:
          sendResponse({ error: "unknown action." });
      }
    } catch (error) {
      console.error("groq api error:", error);
      sendResponse({ error: error.message || "unknown error occurred." });
    }
  })();

  // return true to keep the message channel open for async sendResponse
  return true;
});

// ——— groq api calls ———

async function callGroqAPI(systemPrompt, userText, apiKey) {
  const endpoint = "https://api.groq.com/openai/v1/chat/completions";

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userText }
      ],
      temperature: 0.9,
      max_tokens: 512,
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("groq api response:", response.status, errorBody);
    throw new Error(`api returned ${response.status}`);
  }

  const data = await response.json();
  const raw = data.choices[0].message.content;

  console.log("groq raw response:", raw);

  return safeJsonParse(raw);
}

// robust json parser — handles common llm output issues
function safeJsonParse(str) {
  // step 1: try parsing as-is first (fastest path)
  try {
    return JSON.parse(str);
  } catch (e) {
    // continue to sanitization
  }

  // step 2: strip control characters
  let cleaned = str.replace(/[\x00-\x1F\x7F]/g, (ch) => {
    if (ch === '\n') return '\\n';
    if (ch === '\r') return '\\r';
    if (ch === '\t') return '\\t';
    return '';
  });

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    // continue to more aggressive fixes
  }

  // step 3: remove trailing commas before } or ]
  cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');

  // step 4: fix unescaped quotes inside string values
  // replace single quotes used as json delimiters (not apostrophes inside words)
  // pattern: single quote at start/end of key or value position
  cleaned = cleaned.replace(/:\s*'([^']*)'/g, ': "$1"');
  cleaned = cleaned.replace(/{\s*'([^']*)'\s*:/g, '{ "$1":');
  cleaned = cleaned.replace(/,\s*'([^']*)'\s*:/g, ', "$1":');

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("json parse failed. cleaned string:", cleaned);
    throw new Error("could not parse json: " + e.message);
  }
}

// generate replies
async function fetchGroqReplies(text, apiKey) {
  const prompt = 'act as a minimal tech girl with a goth/pinterest aesthetic. you will receive a text. 1. translate it to turkish (original_tr). 2. generate exactly 3 tweet replies in english with strictly different personas. reply 1: minimal and supportive. reply 2: wise, highly technical, and directive. reply 3: sarcastic, condescending, slight ragebait. rules: strictly lowercase, no emojis, short sentences, professional but careless vibe. 3. translate these 3 replies to turkish. output format: strictly json: {"original_tr": "...", "replies": [{"en": "...", "tr": "...", "type": "supportive"}, {"en": "...", "tr": "...", "type": "technical"}, {"en": "...", "tr": "...", "type": "sarcastic"}]}';

  return callGroqAPI(prompt, text, apiKey);
}

// translate text
async function fetchGroqTranslation(text, apiKey) {
  const prompt = 'act as a minimal tech girl with a goth/pinterest aesthetic. translate the given turkish text to english. rules: strictly lowercase, no emojis, professional but sarcastic/cool tone, minimalist language. output format: strictly a json object: {"translated_text": "..."}';

  return callGroqAPI(prompt, text, apiKey);
}
