import { createKiCadRoutingToolsAutorouter } from "@kicad-routing-tools/tscircuit-autorouter"

export const krtAutorouter = {
  algorithmFn: createKiCadRoutingToolsAutorouter({
    gridStep: 0.2,
    clearance: 0.18,
    maxIterations: 500_000,
    viaCost: 80_000,
    hWeight: 1.2,
  }),
}
