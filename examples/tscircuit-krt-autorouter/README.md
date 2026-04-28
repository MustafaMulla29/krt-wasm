# tscircuit KRT Autorouter Example

This project uses the vendored KRT WASM npm module from
`@kicad-routing-tools/tscircuit-autorouter` and passes it to the board through
`autorouter.algorithmFn`. The package is vendored inside this example so
`tsci dev` does not need to import from a parent directory.

The vendored package under `vendor/krt-autorouter` contains the generated
`wasm-pack` nodejs build and calls the real Rust KRT `GridRouter` core.

```bash
bun install
tsci build
tsci dev
```

The board uses an SOIC-8, a TSSOP-16, and three 3-pin headers. Nine traces
connect 18 of the 33 component/header pins.
