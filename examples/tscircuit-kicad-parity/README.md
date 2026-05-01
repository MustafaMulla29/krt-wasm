# KiCad Parity Fixture for tscircuit KRT Autorouter

This fixture is generated from `kicad_files/haasoscope_pro_max_test.kicad_pcb`.
It preserves selected KiCad pad coordinates, pad sizes, component/pad ids,
board bounds, and 14 U2A/U3 data nets from the original board.

Run:

```sh
bun install
tsci build
```

The parity goal is not visual similarity to a hand-written tscircuit design; it
is to feed the tscircuit custom autorouter a KiCad-derived pad/net problem that
can be compared with KRT runs on the original board.

The source KiCad board has 10 copper layers. This fixture uses 4 tscircuit
layers because the current tscircuit core build only reports 1, 2, or 4 layers
to custom autorouters.
