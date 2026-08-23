# 🦎 Chameleon

**Serve your JavaScript freshly obfuscated on every request, straight from your Cloudflare Worker.**

A single-file [Cloudflare Worker](https://developers.cloudflare.com/workers/) that hosts your scripts and re-encodes them with new randomness on every request. The behaviour never changes, but no two responses are byte-for-byte alike. It serves ordinary client-side JavaScript for a `<script src="...">` tag.

![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?logo=cloudflare&logoColor=white)
![Dependencies](https://img.shields.io/badge/dependencies-none-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)

| Setup Worker | 1. Worker Response | 2. Worker Response |
| :---: | :---: | :---: |
| <img width="612" height="393" alt="image" src="https://github.com/user-attachments/assets/5416c707-2f8b-4b47-93df-6493e21b1ee0" /> | <img width="565" height="374" alt="{AEC7B49A-39A5-4884-A9F2-9435FAF900DB}" src="https://github.com/user-attachments/assets/22717ce0-c4c4-4588-817f-d60f3d9c0fcb" /> | <img width="590" height="373" alt="{9AEBB836-0526-4017-BD6A-7627236B4AF3}" src="https://github.com/user-attachments/assets/5ed79a44-27c0-45c3-89b9-68352118bcd9" /> |

---

## ✨ Features

- 🔀 **Different every time**: fresh XOR key, randomised names and junk padding per request.
- 🧬 **Behaviour-preserving**: your source is packed and run verbatim, never parsed or rewritten.
- 🗂️ **Multiple scripts**: pick one by URL path, with an optional `.js` suffix.
- 🪶 **Zero dependencies**: one file, no build step.

---

## 🚀 Quick start

1. In the [Cloudflare dashboard](https://dash.cloudflare.com/), go to **Workers & Pages → Create → Create Worker** and **Deploy** the starter.
2. Click **Edit code**, replace the sample with [`worker.js`](worker.js), and **Deploy**.

Live at `https://chameleon.<your-subdomain>.workers.dev/consolelog`.

---

## 🔧 Configuration

Add scripts to the `SCRIPTS` dictionary at the top of `worker.js`, keyed by name, with base64-encoded source as the value:

```js
const SCRIPTS = {
  consolelog: "Y29uc29sZS5sb2coIkhlbGxvIFdvcmxkIik7", // → Base64 = console.log("Hello World");
  consolelog1:  "...your base64 here...",
};
```

Encode a file (minify it first if you want it minified):

```bash
base64 -w0 script.js            # Linux
base64 script.js | tr -d '\n'   # macOS
```
```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("script.js"))   # Windows
```

---

## 🌐 Usage

The last path segment picks the script; a trailing `.js` is optional and any leading path is ignored, so the URL can look like an ordinary asset:

```html
<script src="https://your-domain.local/assets/js/consolelog.js"></script>
```

| Request | Result |
| --- | --- |
| Known key (with or without `.js`) | `200`, freshly obfuscated JavaScript |
| Unknown key or empty path | `404` |
| Blank or undecodable base64 | `500` |
| Method other than `GET` / `HEAD` | `405` |

---

## 🛣️ Custom route *(optional)*

To serve from your own domain (an active, proxied Cloudflare zone), go to **Settings → Domains & Routes → Add → Route** and enter a pattern like `your-domain.local/assets/js/*`. The `/*` wildcard routes those paths to the Worker; everything else serves your normal site, and no extra DNS is needed.

---

## 🧠 How it works

Chameleon decodes your source, XOR-masks it with a random key, and wraps it in a tiny self-decoding loader that rebuilds the exact original at runtime and runs it with an indirect `eval`. Served with `Cache-Control: no-store`, so every visitor gets a fresh mutation.

---

## ⚠️ Limitations

Obfuscation is **not encryption**. It raises the effort and defeats naive signature matching, but a determined reader can still recover the source.

---
