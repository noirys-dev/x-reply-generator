# aesthetic x reply generator

a minimalist, persona-driven chrome extension for x (twitter). 
built for users who want to maintain a specific aesthetic without wasting time typing. powered by groq api.

## what it does
it intercepts selected text on x, translates context if necessary, and generates three distinct reply personas in strictly lowercase, emoji-free english. it also translates your own thoughts into the same aesthetic.

## features
- **persona engine:** generates three types of replies simultaneously (supportive, technical, sarcastic).
- **stealth operation:** relies on native browser selection. zero dom manipulation. safe from shadow bans.
- **floating ui:** minimal dark mode interface. backdrop blur, pure black background, thin borders.
- **bilingual context:** understands turkish context, translates to english, and provides turkish sub-labels for generated english replies.
- **one-click copy:** clicks copy the english text directly to your clipboard.

## stack
- vanilla javascript
- vanilla css
- chrome extensions api (manifest v3)
- groq api (llama-3.3-70b-versatile)

## setup
1. clone this repository.
2. get a free api key from groq console.
3. open chrome and navigate to `chrome://extensions/`.
4. enable "developer mode" in the top right corner.
5. click "load unpacked" and select the cloned directory.
6. click the extension icon in your toolbar, enter your groq api key, and save.

## usage
select any text on x.com. a minimal `✦` or `⟡` trigger will appear next to your cursor. click to generate. 

## license
mit