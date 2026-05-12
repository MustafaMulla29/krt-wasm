import React from "react"
import { createKiCadRoutingToolsAutorouter } from "../../../src/index"

export const simpleKrtAutorouter = {
  algorithmFn: createKiCadRoutingToolsAutorouter({
    gridStep: 0.2,
    clearance: 0.16,
    maxIterations: 300_000,
    viaCost: 50_000,
    hWeight: 1.2,
    turnCost: 1_000,
  }),
}

export function RoutedPinheadersBoard() {
  return (
    <board
      width="34mm"
      height="20mm"
      layers={2}
      minTraceWidth={0.16}
      nominalTraceWidth={0.2}
      autorouter={simpleKrtAutorouter}
    >
      <pinheader
        name="J_LEFT"
        pinCount={3}
        pitch="2.54mm"
        pcbX={-12}
        pcbY={0}
        pcbOrientation="vertical"
        schX={-3}
        schY={0}
      />
      <pinheader
        name="J_RIGHT"
        pinCount={3}
        pitch="2.54mm"
        pcbX={12}
        pcbY={0}
        pcbOrientation="vertical"
        schX={3}
        schY={0}
      />
      <hole name="MOUNT" diameter="3mm" pcbX={0} pcbY={0} />

      <trace from=".J_LEFT > .pin1" to=".J_RIGHT > .pin3" />
      <trace from=".J_LEFT > .pin2" to=".J_RIGHT > .pin2" />
      <trace from=".J_LEFT > .pin3" to=".J_RIGHT > .pin1" />
    </board>
  )
}
