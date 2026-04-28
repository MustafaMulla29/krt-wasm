import { krtAutorouter } from "./src/krt-autorouter"

const SOIC_X = -16
const TSSOP_X = 14

export default () => (
  <board
    width="70mm"
    height="44mm"
    layers={4}
    minTraceWidth={0.16}
    nominalTraceWidth={0.2}
    minViaPadDiameter={0.55}
    minViaHoleDiameter={0.3}
    pcbStyle={{
      viaPadDiameter: 0.55,
      viaHoleDiameter: 0.3,
    }}
    autorouter={krtAutorouter}
  >
    <chip
      name="U_SOIC"
      footprint="soic8"
      pinLabels={{
        pin1: "SCL",
        pin2: "SDA",
        pin3: "ALERT",
        pin4: "GND",
        pin5: "A0",
        pin6: "A1",
        pin7: "VCC",
        pin8: "INT",
      }}
      pcbX={SOIC_X}
      pcbY={6}
      schX={-4}
      schY={2}
    />
    <chip
      name="U_TSSOP"
      footprint="tssop16"
      pinLabels={{
        pin1: "IO1",
        pin2: "IO2",
        pin3: "IO3",
        pin4: "IO4",
        pin5: "IO5",
        pin6: "IO6",
        pin7: "IO7",
        pin8: "GND",
        pin9: "VCC",
        pin10: "IO8",
        pin11: "IO9",
        pin12: "IO10",
        pin13: "IO11",
        pin14: "IO12",
        pin15: "IO13",
        pin16: "IO14",
      }}
      pcbX={TSSOP_X}
      pcbY={2}
      pcbRotation={180}
      schX={4}
      schY={1}
    />

    <pinheader
      name="J_CTRL"
      pinCount={3}
      pitch="2.54mm"
      pcbX={-30}
      pcbY={13}
      pcbOrientation="vertical"
      schX={-7}
      schY={-3}
      schFacingDirection="right"
    />
    <pinheader
      name="J_IO"
      pinCount={3}
      pitch="2.54mm"
      pcbX={30}
      pcbY={2}
      pcbOrientation="vertical"
      schX={8}
      schY={1}
      schFacingDirection="left"
    />
    <pinheader
      name="J_PWR"
      pinCount={3}
      pitch="2.54mm"
      pcbX={-3}
      pcbY={-17}
      pcbOrientation="horizontal"
      schX={0}
      schY={-5}
      schFacingDirection="up"
    />

    <hole name="CENTER_MOUNT" diameter="3.2mm" pcbX={0} pcbY={0} />
    <hole name="UPPER_MOUNT" diameter="2.1mm" pcbX={-27} pcbY={-14} />
    <hole name="LOWER_MOUNT" diameter="2.1mm" pcbX={27} pcbY={14} />

    <silkscreentext
      text="KRT AUTOROUTER"
      pcbX={0}
      pcbY={19}
      fontSize="1mm"
      anchorAlignment="center"
    />

    <trace from=".U_SOIC > .pin1" to=".J_CTRL > .pin1" />
    <trace from=".U_SOIC > .pin2" to=".J_CTRL > .pin2" />
    <trace from=".U_SOIC > .pin8" to=".J_CTRL > .pin3" />
    <trace from=".U_SOIC > .pin4" to=".J_PWR > .pin1" />
    <trace from=".U_SOIC > .pin7" to=".J_PWR > .pin2" />
    <trace from=".U_TSSOP > .pin4" to=".J_PWR > .pin3" />
    <trace from=".U_TSSOP > .pin5" to=".J_IO > .pin1" />
    <trace from=".U_TSSOP > .pin6" to=".J_IO > .pin2" />
    <trace from=".U_TSSOP > .pin7" to=".J_IO > .pin3" />
  </board>
)
