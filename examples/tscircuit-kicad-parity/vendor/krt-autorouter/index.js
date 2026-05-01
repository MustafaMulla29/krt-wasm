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
      if (this.options.collapseShortSameLayerTunnels ?? true) {
        this.cachedTraces = collapseShortSameLayerTunnels(this.cachedTraces)
      }
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
    collapseShortSameLayerTunnels: options.collapseShortSameLayerTunnels,
  }
}

function collapseShortSameLayerTunnels(traces) {
  return traces.map((trace) => ({
    ...trace,
    route: collapseTraceRoute(trace.route ?? [], 1),
  }))
}

function collapseTraceRoute(route, maxTunnelLength) {
  const collapsed = []
  let index = 0

  while (index < route.length) {
    const replacement = getShortTunnelReplacement(
      route.slice(index),
      maxTunnelLength,
    )
    if (replacement) {
      collapsed.push(replacement)
      index += 6
      continue
    }

    collapsed.push(route[index])
    index += 1
  }

  return collapsed
}

function getShortTunnelReplacement(route, maxTunnelLength) {
  const [start, viaIn, innerStart, innerEnd, viaOut, end] = route
  if (
    start?.route_type !== "wire" ||
    viaIn?.route_type !== "via" ||
    innerStart?.route_type !== "wire" ||
    innerEnd?.route_type !== "wire" ||
    viaOut?.route_type !== "via" ||
    end?.route_type !== "wire"
  ) {
    return null
  }

  if (
    start.layer !== viaIn.from_layer ||
    viaIn.to_layer !== innerStart.layer ||
    innerStart.layer !== innerEnd.layer ||
    viaOut.from_layer !== innerStart.layer ||
    viaOut.to_layer !== start.layer ||
    end.layer !== start.layer ||
    !samePoint(start, viaIn) ||
    !samePoint(start, innerStart) ||
    !samePoint(innerEnd, viaOut) ||
    !samePoint(innerEnd, end)
  ) {
    return null
  }

  const tunnelLength = Math.hypot(end.x - start.x, end.y - start.y)
  if (tunnelLength > maxTunnelLength) return null

  return {
    route_type: "wire",
    x: end.x,
    y: end.y,
    layer: start.layer,
    width: start.width,
  }
}

function samePoint(a, b) {
  return Math.abs(a.x - b.x) < 1e-6 && Math.abs(a.y - b.y) < 1e-6
}

module.exports = {
  KiCadRoutingToolsAutorouter,
  createKiCadRoutingToolsAutorouter,
}
