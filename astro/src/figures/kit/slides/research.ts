import { ellipse, quiet, signal, stroke } from './shape';

export const research = {
  notebook: [
    stroke('M17,10h30v42H17ZM12,14h7m-7,8h7m-7,8h7m-7,8h7m-7,8h7M21,52v4h29V15'),
    quiet('M25,20h15M25,27h15M25,34h10'),
    signal('M25,42h10'),
  ],
  chart: [
    stroke('M10,11v42h46M18,47V35h7v12M31,47V26h7v21M44,47V16h7v31'),
    quiet('M10,17h4m-4,12h4m-4,12h4'),
    signal('M44,16h7'),
  ],
  flask: [
    stroke('M25,10h14M27,10v16L13,48q-3,6 4,6h30q7,0 4-6L37,26V10'),
    stroke('M20,39q6-4 12,0t12,0'),
    quiet('M22,47h4m10-2h4M28,19h6'),
    signal('M29,31h6'),
  ],
  microscope: [
    stroke('M17,53h34l-3-5H22ZM35,47c17-3 18-20 9-27M24,39h18M31,39v8'),
    stroke('M21,13l7-5 15,20-7,5ZM19,14l4-3m13,22 3,4'),
    ellipse(43, 30, 3, 3),
    quiet('M25,43h7M24,39v4'),
    signal('M29,35h7'),
  ],
  calipers: [
    stroke('M10,25h44v5H10ZM13,25V12h5v13M13,30v18h8v-5h-3V30M32,21V13h6v8M37,35v13h-8v-5h3v-8M32,21h10v14H32Z'),
    quiet('M22,25v3m5-3v3m19-3v3m4-3v3'),
    signal('M35,25h4v5h-4Z'),
  ],
  compass: [
    ellipse(32, 19, 4, 4),
    stroke('M30,15V8h4v7M29,22L17,51l-2,5m20-34 12,29 2,5M23,34q9,5 18,0'),
    quiet('M20,53q12,6 24,0M29,19h6'),
    signal('M32,32v9'),
  ],
} as const;
