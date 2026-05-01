import { Fragment } from "react"
import { krtAutorouter } from "./src/krt-autorouter"

type PadRecord = {
  id: string
  pin: string
  ref: string
  pad: string
  x: number
  y: number
  w: number
  h: number
  layer: "top" | "bottom"
}

type TraceRecord = {
  name: string
  net: string
  fromRef: string
  fromPin: string
  toRef: string
  toPin: string
}

type ComponentRecord = {
  ref: string
  value: string
  x: number
  y: number
  pads: PadRecord[]
}

const COMPONENTS: ComponentRecord[] = [
  {
    "ref": "U2",
    "value": "FT601Q_Aligned",
    "x": 38.35,
    "y": -0.55,
    "pads": [
      {
        "id": "P_U2_54",
        "pin": "pin1",
        "ref": "U2",
        "pad": "54",
        "x": -2.4,
        "y": 4.438,
        "w": 0.2,
        "h": 0.875,
        "layer": "top"
      },
      {
        "id": "P_U2_57",
        "pin": "pin2",
        "ref": "U2",
        "pad": "57",
        "x": -3.6,
        "y": 4.438,
        "w": 0.2,
        "h": 0.875,
        "layer": "top"
      },
      {
        "id": "P_U2_60",
        "pin": "pin3",
        "ref": "U2",
        "pad": "60",
        "x": -4.438,
        "y": 2.8,
        "w": 0.875,
        "h": 0.2,
        "layer": "top"
      },
      {
        "id": "P_U2_62",
        "pin": "pin4",
        "ref": "U2",
        "pad": "62",
        "x": -4.438,
        "y": 2.0,
        "w": 0.875,
        "h": 0.2,
        "layer": "top"
      },
      {
        "id": "P_U2_63",
        "pin": "pin5",
        "ref": "U2",
        "pad": "63",
        "x": -4.438,
        "y": 1.6,
        "w": 0.875,
        "h": 0.2,
        "layer": "top"
      },
      {
        "id": "P_U2_65",
        "pin": "pin6",
        "ref": "U2",
        "pad": "65",
        "x": -4.438,
        "y": 0.8,
        "w": 0.875,
        "h": 0.2,
        "layer": "top"
      },
      {
        "id": "P_U2_69",
        "pin": "pin7",
        "ref": "U2",
        "pad": "69",
        "x": -4.438,
        "y": -0.8,
        "w": 0.875,
        "h": 0.2,
        "layer": "top"
      },
      {
        "id": "P_U2_70",
        "pin": "pin8",
        "ref": "U2",
        "pad": "70",
        "x": -4.438,
        "y": -1.2,
        "w": 0.875,
        "h": 0.2,
        "layer": "top"
      },
      {
        "id": "P_U2_71",
        "pin": "pin9",
        "ref": "U2",
        "pad": "71",
        "x": -4.438,
        "y": -1.6,
        "w": 0.875,
        "h": 0.2,
        "layer": "top"
      },
      {
        "id": "P_U2_72",
        "pin": "pin10",
        "ref": "U2",
        "pad": "72",
        "x": -4.438,
        "y": -2.0,
        "w": 0.875,
        "h": 0.2,
        "layer": "top"
      },
      {
        "id": "P_U2_73",
        "pin": "pin11",
        "ref": "U2",
        "pad": "73",
        "x": -4.438,
        "y": -2.4,
        "w": 0.875,
        "h": 0.2,
        "layer": "top"
      },
      {
        "id": "P_U2_74",
        "pin": "pin12",
        "ref": "U2",
        "pad": "74",
        "x": -4.438,
        "y": -2.8,
        "w": 0.875,
        "h": 0.2,
        "layer": "top"
      },
      {
        "id": "P_U2_75",
        "pin": "pin13",
        "ref": "U2",
        "pad": "75",
        "x": -4.438,
        "y": -3.2,
        "w": 0.875,
        "h": 0.2,
        "layer": "top"
      },
      {
        "id": "P_U2_76",
        "pin": "pin14",
        "ref": "U2",
        "pad": "76",
        "x": -4.438,
        "y": -3.6,
        "w": 0.875,
        "h": 0.2,
        "layer": "top"
      }
    ]
  },
  {
    "ref": "U3",
    "value": "Ti90G529_Functions",
    "x": 15.75,
    "y": -0.65,
    "pads": [
      {
        "id": "P_U3_A10",
        "pin": "pin1",
        "ref": "U3",
        "pad": "A10",
        "x": 8.8,
        "y": 1.6,
        "w": 0.4,
        "h": 0.4,
        "layer": "top"
      },
      {
        "id": "P_U3_A13",
        "pin": "pin2",
        "ref": "U3",
        "pad": "A13",
        "x": 8.8,
        "y": -0.8,
        "w": 0.4,
        "h": 0.4,
        "layer": "top"
      },
      {
        "id": "P_U3_A16",
        "pin": "pin3",
        "ref": "U3",
        "pad": "A16",
        "x": 8.8,
        "y": -3.2,
        "w": 0.4,
        "h": 0.4,
        "layer": "top"
      },
      {
        "id": "P_U3_A17",
        "pin": "pin4",
        "ref": "U3",
        "pad": "A17",
        "x": 8.8,
        "y": -4.0,
        "w": 0.4,
        "h": 0.4,
        "layer": "top"
      },
      {
        "id": "P_U3_A21",
        "pin": "pin5",
        "ref": "U3",
        "pad": "A21",
        "x": 8.8,
        "y": -7.2,
        "w": 0.4,
        "h": 0.4,
        "layer": "top"
      },
      {
        "id": "P_U3_B12",
        "pin": "pin6",
        "ref": "U3",
        "pad": "B12",
        "x": 8.0,
        "y": 0.0,
        "w": 0.4,
        "h": 0.4,
        "layer": "top"
      },
      {
        "id": "P_U3_B13",
        "pin": "pin7",
        "ref": "U3",
        "pad": "B13",
        "x": 8.0,
        "y": -0.8,
        "w": 0.4,
        "h": 0.4,
        "layer": "top"
      },
      {
        "id": "P_U3_B15",
        "pin": "pin8",
        "ref": "U3",
        "pad": "B15",
        "x": 8.0,
        "y": -2.4,
        "w": 0.4,
        "h": 0.4,
        "layer": "top"
      },
      {
        "id": "P_U3_B18",
        "pin": "pin9",
        "ref": "U3",
        "pad": "B18",
        "x": 8.0,
        "y": -4.8,
        "w": 0.4,
        "h": 0.4,
        "layer": "top"
      },
      {
        "id": "P_U3_C15",
        "pin": "pin10",
        "ref": "U3",
        "pad": "C15",
        "x": 7.2,
        "y": -2.4,
        "w": 0.4,
        "h": 0.4,
        "layer": "top"
      },
      {
        "id": "P_U3_C16",
        "pin": "pin11",
        "ref": "U3",
        "pad": "C16",
        "x": 7.2,
        "y": -3.2,
        "w": 0.4,
        "h": 0.4,
        "layer": "top"
      },
      {
        "id": "P_U3_D12",
        "pin": "pin12",
        "ref": "U3",
        "pad": "D12",
        "x": 6.4,
        "y": 0.0,
        "w": 0.4,
        "h": 0.4,
        "layer": "top"
      },
      {
        "id": "P_U3_E11",
        "pin": "pin13",
        "ref": "U3",
        "pad": "E11",
        "x": 5.6,
        "y": 0.8,
        "w": 0.4,
        "h": 0.4,
        "layer": "top"
      },
      {
        "id": "P_U3_E14",
        "pin": "pin14",
        "ref": "U3",
        "pad": "E14",
        "x": 5.6,
        "y": -1.6,
        "w": 0.4,
        "h": 0.4,
        "layer": "top"
      }
    ]
  }
]

const TRACES: TraceRecord[] = [
  {
    "name": "Net_U2A_DATA_27",
    "net": "Net-(U2A-DATA_27)",
    "fromRef": "U3",
    "fromPin": "pin3",
    "toRef": "U2",
    "toPin": "pin10"
  },
  {
    "name": "Net_U2A_DATA_28",
    "net": "Net-(U2A-DATA_28)",
    "fromRef": "U3",
    "fromPin": "pin4",
    "toRef": "U2",
    "toPin": "pin11"
  },
  {
    "name": "Net_U2A_DATA_19",
    "net": "Net-(U2A-DATA_19)",
    "fromRef": "U3",
    "fromPin": "pin2",
    "toRef": "U2",
    "toPin": "pin5"
  },
  {
    "name": "Net_U2A_DATA_31",
    "net": "Net-(U2A-DATA_31)",
    "fromRef": "U3",
    "fromPin": "pin5",
    "toRef": "U2",
    "toPin": "pin14"
  },
  {
    "name": "Net_U2A_DATA_25",
    "net": "Net-(U2A-DATA_25)",
    "fromRef": "U3",
    "fromPin": "pin8",
    "toRef": "U2",
    "toPin": "pin8"
  },
  {
    "name": "Net_U2A_DATA_21",
    "net": "Net-(U2A-DATA_21)",
    "fromRef": "U3",
    "fromPin": "pin7",
    "toRef": "U2",
    "toPin": "pin6"
  },
  {
    "name": "Net_U2A_DATA_30",
    "net": "Net-(U2A-DATA_30)",
    "fromRef": "U3",
    "fromPin": "pin9",
    "toRef": "U2",
    "toPin": "pin13"
  },
  {
    "name": "Net_U2A_DATA_29",
    "net": "Net-(U2A-DATA_29)",
    "fromRef": "U3",
    "fromPin": "pin11",
    "toRef": "U2",
    "toPin": "pin12"
  },
  {
    "name": "Net_U2A_DATA_26",
    "net": "Net-(U2A-DATA_26)",
    "fromRef": "U3",
    "fromPin": "pin10",
    "toRef": "U2",
    "toPin": "pin9"
  },
  {
    "name": "Net_U2A_DATA_12",
    "net": "Net-(U2A-DATA_12)",
    "fromRef": "U3",
    "fromPin": "pin1",
    "toRef": "U2",
    "toPin": "pin1"
  },
  {
    "name": "Net_U2A_DATA_15",
    "net": "Net-(U2A-DATA_15)",
    "fromRef": "U3",
    "fromPin": "pin6",
    "toRef": "U2",
    "toPin": "pin2"
  },
  {
    "name": "Net_U2A_DATA_18",
    "net": "Net-(U2A-DATA_18)",
    "fromRef": "U3",
    "fromPin": "pin12",
    "toRef": "U2",
    "toPin": "pin4"
  },
  {
    "name": "Net_U2A_DATA_24",
    "net": "Net-(U2A-DATA_24)",
    "fromRef": "U3",
    "fromPin": "pin14",
    "toRef": "U2",
    "toPin": "pin7"
  },
  {
    "name": "Net_U2A_DATA_16",
    "net": "Net-(U2A-DATA_16)",
    "fromRef": "U3",
    "fromPin": "pin13",
    "toRef": "U2",
    "toPin": "pin3"
  }
]

const KICAD_SOURCE = "kicad_files/haasoscope_pro_max_test.kicad_pcb"

const KiCadFootprint = ({ pads }: { pads: PadRecord[] }) => (
  <footprint>
    {pads.map((pad) => (
      <Fragment key={pad.id}>
        <smtpad
          name={`pad_${pad.id}`}
          shape="rect"
          width={pad.w}
          height={pad.h}
          layer={pad.layer}
          pcbX={pad.x}
          pcbY={pad.y}
          portHints={[pad.pin, pad.pad, `${pad.ref}.${pad.pad}`]}
          coveredWithSolderMask
        />
      </Fragment>
    ))}
  </footprint>
)

const KiCadComponent = ({ component }: { component: ComponentRecord }) => {
  const pinLabels = Object.fromEntries(
    component.pads.map((pad) => [pad.pin, pad.pad]),
  )

  return (
    <chip
      name={component.ref}
      pinLabels={pinLabels}
      footprint={<KiCadFootprint pads={component.pads} />}
      pcbX={component.x}
      pcbY={component.y}
      schX={component.x / 10}
      schY={component.y / 10}
    />
  )
}

export default () => (
  <board
    width="108.7mm"
    height="70.3mm"
    layers={4}
    minTraceWidth={0.1}
    nominalTraceWidth={0.12}
    minViaPadDiameter={0.2}
    minViaHoleDiameter={0.1}
    pcbStyle={{
      viaPadDiameter: 0.2,
      viaHoleDiameter: 0.1,
    }}
    autorouter={krtAutorouter}
  >
    <silkscreentext
      text={`KRT parity: ${KICAD_SOURCE}`}
      pcbX={0}
      pcbY={33.15}
      fontSize={1}
      anchorAlignment="center"
    />
    {COMPONENTS.map((component) => (
      <KiCadComponent key={component.ref} component={component} />
    ))}
    {TRACES.map((trace) => (
      <Fragment key={trace.name}>
        <trace
          from={`.${trace.fromRef} > .${trace.fromPin}`}
          to={`.${trace.toRef} > .${trace.toPin}`}
        />
      </Fragment>
    ))}
  </board>
)
