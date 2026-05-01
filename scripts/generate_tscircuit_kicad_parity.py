#!/usr/bin/env python3
"""Generate a tscircuit parity fixture from a KiCad board in this repo."""

from __future__ import annotations

import json
import math
import shutil
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from kicad_parser import Pad, parse_kicad_pcb

SOURCE_BOARD = ROOT / "kicad_files" / "haasoscope_pro_max_test.kicad_pcb"
OUT_DIR = ROOT / "examples" / "tscircuit-kicad-parity"
VENDOR_SRC = ROOT / "examples" / "tscircuit-krt-autorouter" / "vendor" / "krt-autorouter"
SELECTED_COMPONENTS = {"U2", "U3", "U1", "IC1", "R1", "R2", "R3", "R4"}
NET_PATTERNS = (
    "Net-(U2A-DATA_",
    "Net-(U2A-~{RD})",
    "Net-(U2A-~{WR})",
    "Net-(U2A-CLK)",
    "Net-(U2A-GPIO",
    "Net-(U2A-BE_",
)


def sanitize(value: str) -> str:
    safe = []
    for char in value:
        if char.isalnum():
            safe.append(char)
        else:
            safe.append("_")
    result = "".join(safe).strip("_")
    while "__" in result:
        result = result.replace("__", "_")
    return result or "unnamed"


def pad_id(pad: Pad) -> str:
    return f"P_{sanitize(pad.component_ref)}_{sanitize(pad.pad_number)}"


def pin_name(pad_number: str) -> str:
    return f"pin{sanitize(pad_number)}"


def layer_name(pad: Pad) -> str:
    if "B.Cu" in pad.layers and "F.Cu" not in pad.layers:
        return "bottom"
    return "top"


def as_tscircuit_xy(pad: Pad, center_x: float, center_y: float) -> tuple[float, float]:
    return (round(pad.global_x - center_x, 3), round(center_y - pad.global_y, 3))


def as_component_xy(footprint, center_x: float, center_y: float) -> tuple[float, float]:
    return (round(footprint.x - center_x, 3), round(center_y - footprint.y, 3))


def as_footprint_local_xy(pad: Pad, footprint) -> tuple[float, float]:
    return (round(pad.global_x - footprint.x, 3), round(footprint.y - pad.global_y, 3))


def select_nets(pcb) -> list[tuple[int, str, list[Pad]]]:
    candidates = []
    for net_id, net in sorted(pcb.nets.items(), key=lambda item: item[1].name):
        if not any(pattern in net.name for pattern in NET_PATTERNS):
            continue

        pads = [
            pad
            for pad in pcb.pads_by_net.get(net_id, [])
            if pad.component_ref in SELECTED_COMPONENTS
        ]
        if len(pads) < 2:
            continue

        first, second = pads[0], pads[1]
        distance = math.hypot(first.global_x - second.global_x, first.global_y - second.global_y)
        candidates.append((distance, net_id, net.name, pads))

    candidates.sort(key=lambda item: (item[0], item[2]))
    return [(net_id, name, pads) for _distance, net_id, name, pads in candidates[:14]]


def write_project_files() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUT_DIR / "src").mkdir(exist_ok=True)

    package_json = {
        "name": "tscircuit-kicad-parity-example",
        "private": True,
        "type": "module",
        "scripts": {
            "build": "tsci build",
            "dev": "tsci dev",
            "typecheck": "tsc --noEmit --project tsconfig.json",
        },
        "dependencies": {
            "@kicad-routing-tools/tscircuit-autorouter": "file:vendor/krt-autorouter",
            "react": "^19.2.5",
            "tscircuit": "^0.0.1686",
        },
        "devDependencies": {"typescript": "^5.9.3"},
    }
    (OUT_DIR / "package.json").write_text(json.dumps(package_json, indent=2) + "\n")

    tsconfig = {
        "compilerOptions": {
            "target": "ES2022",
            "module": "ESNext",
            "moduleResolution": "Bundler",
            "jsx": "react-jsx",
            "strict": True,
            "types": ["tscircuit"],
            "skipLibCheck": True,
            "noEmit": True,
        },
        "include": ["**/*.ts", "**/*.tsx"],
    }
    (OUT_DIR / "tsconfig.json").write_text(json.dumps(tsconfig, indent=2) + "\n")

    krt_autorouter = """import { createKiCadRoutingToolsAutorouter } from "@kicad-routing-tools/tscircuit-autorouter"

export const krtAutorouter = {
  algorithmFn: createKiCadRoutingToolsAutorouter({
    gridStep: 0.1,
    clearance: 0.04,
    maxIterations: 5_000_000,
    viaCost: 80_000,
    hWeight: 1.2,
    collapseShortSameLayerTunnels: false,
  }),
}
"""
    (OUT_DIR / "src" / "krt-autorouter.ts").write_text(krt_autorouter)

    readme = """# KiCad Parity Fixture for tscircuit KRT Autorouter

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
"""
    (OUT_DIR / "README.md").write_text(readme)

    vendor_dst = OUT_DIR / "vendor" / "krt-autorouter"
    if vendor_dst.exists():
        shutil.rmtree(vendor_dst)
    shutil.copytree(VENDOR_SRC, vendor_dst)


def write_index() -> None:
    pcb = parse_kicad_pcb(str(SOURCE_BOARD))
    bounds = pcb.board_info.board_bounds
    if bounds is None:
        raise RuntimeError("source board has no bounds")

    min_x, min_y, max_x, max_y = bounds
    center_x = (min_x + max_x) / 2
    center_y = (min_y + max_y) / 2
    width = round(max_x - min_x + 8, 3)
    height = round(max_y - min_y + 8, 3)

    selected_nets = select_nets(pcb)
    selected_pad_keys = {
        (pad.component_ref, pad.pad_number)
        for _, _, pads in selected_nets
        for pad in pads
    }
    pads = [
        pad
        for footprint in pcb.footprints.values()
        if footprint.reference in SELECTED_COMPONENTS
        for pad in footprint.pads
        if (pad.component_ref, pad.pad_number) in selected_pad_keys
    ]

    component_records = []
    pad_records_by_ref = {}
    pin_alias_by_pad_key = {}
    seen_pads = set()
    for pad in pads:
        pid = pad_id(pad)
        if pid in seen_pads:
            continue
        seen_pads.add(pid)
        footprint = pcb.footprints[pad.component_ref]
        x, y = as_footprint_local_xy(pad, footprint)
        pad_records_by_ref.setdefault(pad.component_ref, []).append(
            {
                "id": pid,
                "pin": "",
                "ref": pad.component_ref,
                "pad": pad.pad_number,
                "x": x,
                "y": y,
                "w": round(max(pad.size_x, 0.16), 3),
                "h": round(max(pad.size_y, 0.16), 3),
                "layer": layer_name(pad),
            }
        )

    for ref in sorted(pad_records_by_ref):
        footprint = pcb.footprints[ref]
        x, y = as_component_xy(footprint, center_x, center_y)
        component_pads = sorted(pad_records_by_ref[ref], key=lambda pad: pad["id"])
        for index, pad_record in enumerate(component_pads, start=1):
            pad_record["pin"] = f"pin{index}"
            pin_alias_by_pad_key[(pad_record["ref"], pad_record["pad"])] = pad_record["pin"]
        component_records.append(
            {
                "ref": ref,
                "value": footprint.value or footprint.footprint_name,
                "x": x,
                "y": y,
                "pads": component_pads,
            }
        )

    traces = []
    for _net_id, net_name, net_pads in selected_nets:
        primary = net_pads[0]
        for target in net_pads[1:]:
            traces.append(
                {
                    "name": sanitize(net_name),
                    "net": net_name,
                    "fromRef": primary.component_ref,
                    "fromPin": pin_alias_by_pad_key[(primary.component_ref, primary.pad_number)],
                    "toRef": target.component_ref,
                    "toPin": pin_alias_by_pad_key[(target.component_ref, target.pad_number)],
                }
            )

    source = f"""import {{ Fragment }} from "react"
import {{ krtAutorouter }} from "./src/krt-autorouter"

type PadRecord = {{
  id: string
  pin: string
  ref: string
  pad: string
  x: number
  y: number
  w: number
  h: number
  layer: "top" | "bottom"
}}

type TraceRecord = {{
  name: string
  net: string
  fromRef: string
  fromPin: string
  toRef: string
  toPin: string
}}

type ComponentRecord = {{
  ref: string
  value: string
  x: number
  y: number
  pads: PadRecord[]
}}

const COMPONENTS: ComponentRecord[] = {json.dumps(component_records, indent=2)}

const TRACES: TraceRecord[] = {json.dumps(traces, indent=2)}

const KICAD_SOURCE = "kicad_files/haasoscope_pro_max_test.kicad_pcb"

const KiCadFootprint = ({{ pads }}: {{ pads: PadRecord[] }}) => (
  <footprint>
    {{pads.map((pad) => (
      <Fragment key={{pad.id}}>
        <smtpad
          name={{`pad_${{pad.id}}`}}
          shape="rect"
          width={{pad.w}}
          height={{pad.h}}
          layer={{pad.layer}}
          pcbX={{pad.x}}
          pcbY={{pad.y}}
          portHints={{[pad.pin, pad.pad, `${{pad.ref}}.${{pad.pad}}`]}}
          coveredWithSolderMask
        />
      </Fragment>
    ))}}
  </footprint>
)

const KiCadComponent = ({{ component }}: {{ component: ComponentRecord }}) => {{
  const pinLabels = Object.fromEntries(
    component.pads.map((pad) => [pad.pin, pad.pad]),
  )

  return (
    <chip
      name={{component.ref}}
      pinLabels={{pinLabels}}
      footprint={{<KiCadFootprint pads={{component.pads}} />}}
      pcbX={{component.x}}
      pcbY={{component.y}}
      schX={{component.x / 10}}
      schY={{component.y / 10}}
    />
  )
}}

export default () => (
  <board
    width="{width}mm"
    height="{height}mm"
    layers={{4}}
    minTraceWidth={{0.1}}
    nominalTraceWidth={{0.12}}
    minViaPadDiameter={{0.2}}
    minViaHoleDiameter={{0.1}}
    pcbStyle={{{{
      viaPadDiameter: 0.2,
      viaHoleDiameter: 0.1,
    }}}}
    autorouter={{krtAutorouter}}
  >
    <silkscreentext
      text={{`KRT parity: ${{KICAD_SOURCE}}`}}
      pcbX={{0}}
      pcbY={{{round(height / 2 - 2, 3)}}}
      fontSize={{1}}
      anchorAlignment="center"
    />
    {{COMPONENTS.map((component) => (
      <KiCadComponent key={{component.ref}} component={{component}} />
    ))}}
    {{TRACES.map((trace) => (
      <Fragment key={{trace.name}}>
        <trace
          from={{`.${{trace.fromRef}} > .${{trace.fromPin}}`}}
          to={{`.${{trace.toRef}} > .${{trace.toPin}}`}}
        />
      </Fragment>
    ))}}
  </board>
)
"""
    (OUT_DIR / "index.circuit.tsx").write_text(source)


def main() -> None:
    write_project_files()
    write_index()
    print(f"Generated {OUT_DIR}")


if __name__ == "__main__":
    main()
