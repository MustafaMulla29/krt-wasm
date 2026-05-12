import { expect, type MatcherResult } from "bun:test"
import { Resvg } from "@resvg/resvg-js"
import looksSame from "looks-same"
import * as fs from "node:fs"
import * as path from "node:path"

type SvgSnapshotOptions = {
  svgName?: string
  scale?: number
  tolerance?: number
}

function svgToPngBuffer(svg: string, scale: number) {
  const resvg = new Resvg(svg, {
    fitTo: {
      mode: "zoom",
      value: scale,
    },
    background: "white",
  })

  return resvg.render().asPng()
}

async function toMatchSvgSnapshot(
  this: unknown,
  receivedMaybePromise: string | Promise<string>,
  testPathOriginal: string,
  opts: SvgSnapshotOptions = {},
): Promise<MatcherResult> {
  const { svgName, scale = 4, tolerance = 0.01 } = opts
  const received = await receivedMaybePromise
  const testPath = testPathOriginal.replace(/\.test\.tsx?$/, "")
  const snapshotDir = path.join(path.dirname(testPath), "__snapshots__")
  const snapshotName = svgName
    ? `${path.basename(testPath)}-${svgName}.snap.svg`
    : `${path.basename(testPath)}.snap.svg`
  const snapshotPath = path.join(snapshotDir, snapshotName)

  if (!fs.existsSync(snapshotDir)) {
    fs.mkdirSync(snapshotDir, { recursive: true })
  }

  const shouldUpdate =
    process.argv.includes("--update-snapshots") ||
    process.argv.includes("-u") ||
    Boolean(process.env.BUN_UPDATE_SNAPSHOTS)

  if (!fs.existsSync(snapshotPath)) {
    fs.writeFileSync(snapshotPath, received)
    return {
      message: () => `SVG snapshot created at ${snapshotPath}`,
      pass: true,
    }
  }

  const existing = fs.readFileSync(snapshotPath, "utf8")
  const receivedPng = svgToPngBuffer(received, scale)
  const existingPng = svgToPngBuffer(existing, scale)
  const result: any = await looksSame(receivedPng, existingPng, {
    strict: false,
    tolerance: 5,
    antialiasingTolerance: 4,
    ignoreCaret: true,
    shouldCluster: true,
    clustersSize: 10,
  })

  if (shouldUpdate) {
    fs.writeFileSync(snapshotPath, received)
    return {
      message: () => `SVG snapshot updated at ${snapshotPath}`,
      pass: true,
    }
  }

  if (result.equal) {
    return {
      message: () => "SVG snapshot matches",
      pass: true,
    }
  }

  const diffPath = snapshotPath.replace(/\.snap\.svg$/, ".diff.png")

  if (result.diffBounds) {
    const width = existingPng.readUInt32BE(16)
    const height = existingPng.readUInt32BE(20)
    const diffArea =
      (result.diffBounds.right - result.diffBounds.left) *
      (result.diffBounds.bottom - result.diffBounds.top)
    const diffPercent = diffArea / (width * height)

    if (diffPercent <= tolerance) {
      return {
        message: () =>
          `SVG snapshot matches within tolerance (${(diffPercent * 100).toFixed(3)}%)`,
        pass: true,
      }
    }
  }

  await looksSame.createDiff({
    reference: existingPng,
    current: receivedPng,
    diff: diffPath,
    highlightColor: "#ff00ff",
  })

  return {
    message: () =>
      `SVG snapshot differs from ${snapshotPath}. Diff saved at ${diffPath}`,
    pass: false,
  }
}

expect.extend({
  toMatchSvgSnapshot: toMatchSvgSnapshot as any,
})

declare module "bun:test" {
  interface Matchers<T = unknown> {
    toMatchSvgSnapshot(
      testPath: string,
      opts?: SvgSnapshotOptions,
    ): Promise<MatcherResult>
  }
}
