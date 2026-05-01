interface Props {
  topColor?: string;
  bottomColor?: string;
}

export default function CloudTransition({
  topColor = 'var(--hf-bg)',
  bottomColor = 'var(--hf-cloud-bot-default)',
}: Props) {
  return (
    <div className="cloud-transition">
      <div className="cloud-transition-top" style={{ background: topColor }} />
      <div className="cloud-transition-bottom" style={{ background: bottomColor }} />
      <svg
        className="cloud-transition-svg cloud-transition-drift"
        viewBox="-100 0 1400 200"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M-200,130 C-150,130 -100,65 -20,65 S120,140 220,140 S380,50 460,50
             S620,130 700,130 S860,45 940,45 S1100,135 1180,135 S1350,60 1500,80
             L1500,0 L-200,0 Z"
          fill={topColor}
          opacity="0.5"
        />
        <path
          d="M-200,145 C-140,145 -80,75 20,75 S200,150 300,150 S460,60 560,60
             S720,145 820,145 S980,55 1080,55 S1240,140 1340,140 S1450,85 1500,95
             L1500,0 L-200,0 Z"
          fill={topColor}
        />
        <path
          d="M-200,170 C-120,170 -60,140 60,140 S240,175 360,175 S520,132 640,132
             S820,172 940,172 S1100,128 1200,128 S1380,168 1500,168
             L1500,200 L-200,200 Z"
          fill={bottomColor}
          opacity="0.3"
        />
      </svg>
    </div>
  );
}
