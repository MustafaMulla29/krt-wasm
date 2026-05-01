import { createKiCadRoutingToolsAutorouter } from "@kicad-routing-tools/tscircuit-autorouter"

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
