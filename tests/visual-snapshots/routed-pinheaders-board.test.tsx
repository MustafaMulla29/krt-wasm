import React from "react"
import { expect, test } from "bun:test"
import { Circuit } from "tscircuit"
import "./fixtures/svg-snapshot-matcher"
import { RoutedPinheadersBoard } from "./fixtures/routed-pinheaders-board"

test("KRT autorouter produces a PCB visual snapshot", async () => {
  const circuit = new Circuit()

  circuit.add(<RoutedPinheadersBoard />)
  await circuit.renderUntilSettled()

  const traces = circuit
    .getCircuitJson()
    .filter((element: any) => element.type === "pcb_trace")

  expect(traces.length).toBeGreaterThan(0)
  await expect(circuit.getSvg({ view: "pcb" })).toMatchSvgSnapshot(
    import.meta.path,
  )
})
