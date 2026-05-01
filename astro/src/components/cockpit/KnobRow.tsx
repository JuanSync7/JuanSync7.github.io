import KnobCanvas from './KnobCanvas';

export interface Knob {
  l: string;
  v: string;
  c: string;
  c2?: string;
  f: number;
}

interface Props {
  knobs: Knob[];
}

export default function KnobRow({ knobs }: Props) {
  return (
    <div className="cp-knob-row">
      {knobs.map((k, i) => (
        <div key={i} className="cp-knob">
          <KnobCanvas fraction={k.f} color={k.c} color2={k.c2} />
          <div className="cp-knob-val" style={{ color: k.c2 || k.c }}>{k.v}</div>
          <div className="cp-knob-lbl">{k.l}</div>
        </div>
      ))}
    </div>
  );
}
