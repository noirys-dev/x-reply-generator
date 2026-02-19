# project: aesthetic x reply generator (chrome extension)

## architecture & tech stack
- manifest v3
- vanilla javascript, html, css
- google gemini api (free tier)
- strict focus on performance, minimal dom manipulation.

## core flow (selection-based)
1. background script handles context menu (right-click on selected text).
2. user selects text, clicks "generate reply".
3. background script sends selected text to gemini api via chrome.storage stored api key.
4. content script injects a minimal floating ui near the selection to display 3 generated options.
5. clicking an option copies it to the clipboard and closes the floating ui.

## design & ui aesthetic (critical)
- vibe: dark mode, minimalist tech.
- colors: pure black (#000000), dark grays (#111111, #222222), muted silver.
- typography: sans-serif, lowercase text only, small font sizes, high letter-spacing.
- ui elements: sharp edges or very subtle rounding (2px), thin borders (1px solid #333), blurred backgrounds (backdrop-filter: blur).
- no flashy animations. just simple, quick fade-ins.

## ai prompt instructions
when writing the fetch call to gemini api, use this exact system instruction:
"act as a minimal tech girl with a goth/pinterest aesthetic. task: generate 3 short tweet replies based on the provided text. rules: strictly lowercase, no emojis, professional but sarcastic/cool tone, minimalist language. output format: strictly a json array of 3 strings."

## security & rules
- never hardcode api keys. create an options page for the user to input the gemini api key.
- use chrome.storage.local for storing the key.
- do not use setinterval or auto-refresh mechanisms. user triggers everything manually to avoid bot detection and shadow bans.