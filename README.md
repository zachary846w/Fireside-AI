# Fireside AI

Fireside AI is a free AI-style chat website that runs in the browser.

## Open it

Use the local preview link:

http://localhost:4173/index.html

You can also open `index.html` directly in a browser.

## Make it public

To let everybody access Fireside AI, upload these files to a free static website host such as GitHub Pages, Netlify, or Vercel:

- `index.html`
- `styles.css`
- `script.js`

## What is included

- Public Fireside AI branding
- ChatGPT-style chat screen
- Example prompts
- Browser-saved chat history
- Animated AI-style background
- Free local demo responses
- Optional real AI answers through a Netlify function

## Turn on real AI answers

In Netlify, add an environment variable named `OPENAI_API_KEY` with your OpenAI API key, then redeploy the site.

Without that key, Fireside AI uses the free local demo answers. With that key, it sends questions to a real AI model through `netlify/functions/chat.js`.

This uses OpenAI's Responses API. OpenAI's quickstart shows server-side JavaScript calling `client.responses.create` with a model and input, and the API reference describes `POST /v1/responses` as the endpoint for creating model responses.
