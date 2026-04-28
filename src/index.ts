import * as gridRouter from "../pkg-node/grid_router.js"

import type {
  AutorouterCompleteEvent,
  AutorouterErrorEvent,
  AutorouterProgressEvent,
  GenericLocalAutorouter,
  SimpleRouteJson,
  SimplifiedPcbTrace,
} from "tscircuit"

type Handler<T> = (event: T) => void

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

export async function initKiCadRoutingToolsAutorouter() {
  // The wasm-pack nodejs target initializes synchronously when imported.
}

export class KiCadRoutingToolsAutorouter implements GenericLocalAutorouter {
  isRouting = false

  private cachedTraces: SimplifiedPcbTrace[] | null = null
  private completeHandlers: Array<Handler<AutorouterCompleteEvent>> = []
  private errorHandlers: Array<Handler<AutorouterErrorEvent>> = []
  private progressHandlers: Array<Handler<AutorouterProgressEvent>> = []

  constructor(
    readonly input: SimpleRouteJson,
    private readonly options: KiCadRoutingToolsAutorouterOptions = {},
  ) {}

  on(event: "complete", callback: Handler<AutorouterCompleteEvent>): void
  on(event: "error", callback: Handler<AutorouterErrorEvent>): void
  on(event: "progress", callback: Handler<AutorouterProgressEvent>): void
  on(
    event: "complete" | "error" | "progress",
    callback:
      | Handler<AutorouterCompleteEvent>
      | Handler<AutorouterErrorEvent>
      | Handler<AutorouterProgressEvent>,
  ): void {
    if (event === "complete") {
      this.completeHandlers.push(callback as Handler<AutorouterCompleteEvent>)
      return
    }
    if (event === "error") {
      this.errorHandlers.push(callback as Handler<AutorouterErrorEvent>)
      return
    }
    this.progressHandlers.push(callback as Handler<AutorouterProgressEvent>)
  }

  start(): void {
    if (this.isRouting) return

    this.isRouting = true
    this.emitProgress(0, "initializing KiCadRoutingTools wasm router")

    void this.solve().then(
      (traces) => {
        if (!this.isRouting) return

        this.isRouting = false
        this.emitProgress(1, "routing complete")
        this.emitComplete(traces)
      },
      (error) => {
        this.isRouting = false
        this.emitError(error)
      },
    )
  }

  stop(): void {
    this.isRouting = false
  }

  async solve(): Promise<SimplifiedPcbTrace[]> {
    if (this.cachedTraces) return this.cachedTraces

    await initKiCadRoutingToolsAutorouter()
    this.cachedTraces = this.solveSync()

    return this.cachedTraces
  }

  solveSync(): SimplifiedPcbTrace[] {
    this.cachedTraces ??= gridRouter.routeSimpleRouteJson(
      this.input,
      normalizeOptions(this.options),
    ) as SimplifiedPcbTrace[]
    return this.cachedTraces
  }

  private emitComplete(traces: SimplifiedPcbTrace[]) {
    for (const handler of this.completeHandlers) {
      handler({ type: "complete", traces })
    }
  }

  private emitError(error: unknown) {
    const normalizedError =
      error instanceof Error ? error : new Error(String(error))

    for (const handler of this.errorHandlers) {
      handler({ type: "error", error: normalizedError })
    }
  }

  private emitProgress(progress: number, phase: string) {
    for (const handler of this.progressHandlers) {
      handler({
        type: "progress",
        steps: Math.round(progress * this.input.connections.length),
        progress,
        phase,
      })
    }
  }
}

export function createKiCadRoutingToolsAutorouter(
  options: KiCadRoutingToolsAutorouterOptions = {},
) {
  return async (simpleRouteJson: SimpleRouteJson) => {
    await initKiCadRoutingToolsAutorouter()
    return new KiCadRoutingToolsAutorouter(simpleRouteJson, options)
  }
}

function normalizeOptions(options: KiCadRoutingToolsAutorouterOptions) {
  return {
    gridStep: options.gridStep ?? 0.1,
    clearance: options.clearance ?? 0.2,
    maxIterations: options.maxIterations ?? 300_000,
    viaCost: options.viaCost ?? 50_000,
    hWeight: options.hWeight ?? 1.25,
    turnCost: options.turnCost ?? 1_000,
    trackMargin: options.trackMargin ?? 0,
    layerCosts: options.layerCosts,
    layerDirectionPreferences: options.layerDirectionPreferences,
    directionPreferenceCost: options.directionPreferenceCost ?? 0,
  }
}
