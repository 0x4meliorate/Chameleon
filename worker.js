const SCRIPTS = {
  consolelog: "Y29uc29sZS5sb2coIkhlbGxvIFdvcmxkIik7",
};

const NO_STORE = "no-store";
const HEX = "0123456789abcdef";

function base64ToBytes(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function bytesToBase64(bytes) {
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

function randInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function randName() {
  let s = "_0x";
  const n = randInt(4, 8);
  for (let i = 0; i < n; i++) s += HEX[Math.floor(Math.random() * 16)];
  return s;
}

function randHex(n) {
  let s = "";
  for (let i = 0; i < n; i++) s += HEX[Math.floor(Math.random() * 16)];
  return s;
}

function junkStatements() {
  let out = "";
  const count = randInt(1, 3);
  for (let i = 0; i < count; i++) {
    out += `var ${randName()}="${randHex(randInt(6, 20))}";`;
  }
  return out;
}

function schemeArrayXor(srcBytes) {
  const key = randInt(1, 255);
  const a = randName(), k = randName(), u = randName(), i = randName();
  const ints = Array.from(srcBytes, (b) => "0x" + (b ^ key).toString(16).padStart(2, "0")).join(",");
  return (
    "(function(){" +
    junkStatements() +
    `var ${a}=[${ints}],${k}=${key},${u}=new Uint8Array(${a}.length);` +
    `for(var ${i}=0;${i}<${a}.length;${i}++)${u}[${i}]=${a}[${i}]^${k};` +
    `(0,eval)(new TextDecoder().decode(${u}));` +
    "})();"
  );
}

function schemeBase64Xor(srcBytes) {
  const key = randInt(1, 255);
  const d = randName(), b = randName(), k = randName(), n = randName(), u = randName(), i = randName();
  const xored = new Uint8Array(srcBytes.length);
  for (let j = 0; j < srcBytes.length; j++) xored[j] = srcBytes[j] ^ key;
  const payload = bytesToBase64(xored);
  return (
    "(function(){" +
    junkStatements() +
    `var ${d}="${payload}",${b}=atob(${d}),${k}=${key},${n}=${b}.length,${u}=new Uint8Array(${n});` +
    `for(var ${i}=0;${i}<${n};${i}++)${u}[${i}]=${b}.charCodeAt(${i})^${k};` +
    `(0,eval)(new TextDecoder().decode(${u}));` +
    "})();"
  );
}

function obfuscate(srcBytes) {
  if (srcBytes.length > 20000) return schemeBase64Xor(srcBytes);
  return Math.random() < 0.5 ? schemeArrayXor(srcBytes) : schemeBase64Xor(srcBytes);
}

function jsResponse(body, status) {
  return new Response(body, {
    status,
    headers: {
      "Content-Type": "text/javascript; charset=utf-8",
      "Cache-Control": NO_STORE,
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export default {
  async fetch(request) {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method Not Allowed", {
        status: 405,
        headers: { "Cache-Control": NO_STORE },
      });
    }

    const { pathname } = new URL(request.url);
    const segments = pathname.split("/").filter(Boolean);
    let key = segments[segments.length - 1];
    if (key?.endsWith(".js")) key = key.slice(0, -3);

    if (!key || !Object.hasOwn(SCRIPTS, key)) {
      return new Response("Not Found", {
        status: 404,
        headers: { "Cache-Control": NO_STORE },
      });
    }

    if (!SCRIPTS[key]) {
      return jsResponse(`// No script embedded for "${key}".`, 500);
    }

    let src;
    try {
      src = base64ToBytes(SCRIPTS[key]);
    } catch {
      return jsResponse(`// Invalid base64 for "${key}".`, 500);
    }

    if (request.method === "HEAD") {
      return jsResponse(null, 200);
    }

    return jsResponse(obfuscate(src), 200);
  },
};
