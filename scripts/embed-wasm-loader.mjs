import { readFile, writeFile } from "node:fs/promises"
import { join } from "node:path"

const pkgDir = new URL("../pkg-node/", import.meta.url)
const jsPath = join(pkgDir.pathname, "grid_router.js")
const wasmPath = join(pkgDir.pathname, "grid_router_bg.wasm")

const js = await readFile(jsPath, "utf8")
const wasmBase64 = Buffer.from(await readFile(wasmPath)).toString("base64")

const marker = "const wasmPath = `${__dirname}/grid_router_bg.wasm`;"
const markerIndex = js.indexOf(marker)

if (markerIndex < 0) {
  throw new Error("Could not find wasm-pack nodejs loader footer")
}

const browserSafeFooter = `const wasmBase64 = "${wasmBase64}";

function decodeWasmBase64(base64) {
    if (typeof Buffer !== "undefined") {
        return new Uint8Array(Buffer.from(base64, "base64"));
    }

    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

const wasmModule = new WebAssembly.Module(decodeWasmBase64(wasmBase64));
let wasmInstance = new WebAssembly.Instance(wasmModule, __wbg_get_imports());
let wasm = wasmInstance.exports;
wasm.__wbindgen_start();
`

await writeFile(jsPath, js.slice(0, markerIndex) + browserSafeFooter)
