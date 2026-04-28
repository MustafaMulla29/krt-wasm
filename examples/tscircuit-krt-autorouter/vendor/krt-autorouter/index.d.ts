import type {
  GenericLocalAutorouter,
  SimpleRouteJson,
} from "tscircuit"

export interface KiCadRoutingToolsAutorouterOptions {
  gridStep?: number
  clearance?: number
  maxIterations?: number
  viaCost?: number
  hWeight?: number
  turnCost?: number
  trackMargin?: number
  layerCosts?: number[]
  layerDirectionPreferences?: number[]
  directionPreferenceCost?: number
}

export class KiCadRoutingToolsAutorouter implements GenericLocalAutorouter {
  readonly input: SimpleRouteJson
  isRouting: boolean

  constructor(
    input: SimpleRouteJson,
    options?: KiCadRoutingToolsAutorouterOptions,
  )

  start(): void
  stop(): void
  on(event: "complete", callback: (event: any) => void): void
  on(event: "error", callback: (event: any) => void): void
  on(event: "progress", callback: (event: any) => void): void
  solve(): Promise<any[]>
  solveSync(): any[]
}

export function createKiCadRoutingToolsAutorouter(
  options?: KiCadRoutingToolsAutorouterOptions,
): (simpleRouteJson: SimpleRouteJson) => Promise<KiCadRoutingToolsAutorouter>
