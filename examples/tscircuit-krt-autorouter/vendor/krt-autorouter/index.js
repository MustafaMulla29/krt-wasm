const gridRouter = require("./pkg-node/grid_router.js")

class KiCadRoutingToolsAutorouter {
  constructor(input, options = {}) {
    this.input = input
    this.options = options
    this.isRouting = false
    this.cachedTraces = null
    this.completeHandlers = []
    this.errorHandlers = []
    this.progressHandlers = []
  }

  on(event, callback) {
    if (event === "complete") {
      this.completeHandlers.push(callback)
      return
    }
    if (event === "error") {
      this.errorHandlers.push(callback)
      return
    }
    this.progressHandlers.push(callback)
  }

  start() {
    if (this.isRouting) return

    this.isRouting = true
    this.emitProgress(0, "routing with KiCadRoutingTools wasm")

    Promise.resolve().then(
      () => {
        if (!this.isRouting) return
        const traces = this.solveSync()
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

  stop() {
    this.isRouting = false
  }

  async solve() {
    return this.solveSync()
  }

  solveSync() {
    if (!this.cachedTraces) {
      this.cachedTraces = gridRouter.routeSimpleRouteJson(
        this.input,
        normalizeOptions(this.options),
      )
    }
    return this.cachedTraces
  }

  emitComplete(traces) {
    for (const handler of this.completeHandlers) {
      handler({ type: "complete", traces })
    }
  }

  emitError(error) {
    const normalizedError =
      error instanceof Error ? error : new Error(String(error))

    for (const handler of this.errorHandlers) {
      handler({ type: "error", error: normalizedError })
    }
  }

  emitProgress(progress, phase) {
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

function createKiCadRoutingToolsAutorouter(options = {}) {
  return async (simpleRouteJson) =>
    new KiCadRoutingToolsAutorouter(simpleRouteJson, options)
}

function normalizeOptions(options) {
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

module.exports = {
  KiCadRoutingToolsAutorouter,
  createKiCadRoutingToolsAutorouter,
}
