import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {PALETTE, STROKE_WIDTH, VIEWBOX, WORDMARK_BARRA} from './tokens';

// "A Téra abre." — nada aparece por fade: uma fresta horizontal abre e revela
// o wordmark no estado matéria (plasma fluindo dentro do traço).
// O plasma do SVG original usava SMIL (tempo real, não determinístico);
// aqui as mesmas curvas são recalculadas por frame.
export const MateriaFresta: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const centerY = VIEWBOX.y + VIEWBOX.h / 2;

  // estágio 1: a fresta existe (linha fina)
  const slit = spring({frame: frame - 10, fps, config: {damping: 200}, durationInFrames: 18});
  // estágio 2: a fresta abre por completo
  const open = spring({frame: frame - 45, fps, config: {damping: 200}, durationInFrames: 45});

  const apertureH = slit * 10 + open * (VIEWBOX.h - 10);

  // plasma dirigido por frame (ciclos do SVG original: 9s e 14s)
  const t = frame / fps;
  const gradShift = -0.09 + 0.09 * Math.cos((t / 9) * Math.PI * 2);
  const baseFreqX = 0.014 - 0.002 * Math.cos((t / 14) * Math.PI * 2);
  const baseFreqY = 0.024 + 0.004 * Math.cos((t / 14) * Math.PI * 2);

  return (
    <AbsoluteFill style={{backgroundColor: PALETTE.ink, justifyContent: 'center', alignItems: 'center'}}>
      <svg
        viewBox={`${VIEWBOX.x} ${VIEWBOX.y} ${VIEWBOX.w} ${VIEWBOX.h}`}
        style={{width: '62%'}}
      >
        <defs>
          <linearGradient
            id="plasma"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="22%"
            gradientTransform={`translate(${gradShift} 0)`}
          >
            <stop offset="0" stopColor={PALETTE.plasma[0]} />
            <stop offset="0.33" stopColor={PALETTE.plasma[1]} />
            <stop offset="0.67" stopColor={PALETTE.plasma[2]} />
            <stop offset="1" stopColor={PALETTE.plasma[3]} />
          </linearGradient>
          <filter id="fluxo">
            <feTurbulence
              type="fractalNoise"
              baseFrequency={`${baseFreqX} ${baseFreqY}`}
              numOctaves={2}
              seed={7}
            />
            <feDisplacementMap in="SourceGraphic" scale={34} />
          </filter>
          <mask id="vao">
            <rect x={VIEWBOX.x} y={VIEWBOX.y} width={VIEWBOX.w} height={VIEWBOX.h} fill="black" />
            <path
              d={WORDMARK_BARRA}
              fill="none"
              stroke="white"
              strokeWidth={STROKE_WIDTH}
              strokeLinecap="butt"
            />
          </mask>
          <clipPath id="fresta">
            <rect
              x={VIEWBOX.x}
              y={centerY - apertureH / 2}
              width={VIEWBOX.w}
              height={apertureH}
            />
          </clipPath>
        </defs>

        <g clipPath="url(#fresta)">
          <g mask="url(#vao)">
            <rect x={VIEWBOX.x} y={VIEWBOX.y} width={VIEWBOX.w} height={VIEWBOX.h} fill={PALETTE.subsoloDeep} />
            <g filter="url(#fluxo)">
              <rect
                x={VIEWBOX.x - 40}
                y={VIEWBOX.y - 40}
                width={VIEWBOX.w + 80}
                height={VIEWBOX.h + 80}
                fill="url(#plasma)"
                opacity={0.95}
              />
            </g>
          </g>
        </g>

        {/* a própria fresta: hairline de luz nas bordas da abertura */}
        {apertureH > 0.5 && apertureH < VIEWBOX.h - 2 ? (
          <>
            <rect
              x={VIEWBOX.x}
              y={centerY - apertureH / 2 - 1}
              width={VIEWBOX.w}
              height={interpolate(open, [0, 1], [2, 0])}
              fill={PALETTE.cal}
              opacity={interpolate(slit, [0, 1], [0, 0.9])}
            />
            <rect
              x={VIEWBOX.x}
              y={centerY + apertureH / 2 - 1}
              width={VIEWBOX.w}
              height={interpolate(open, [0, 1], [2, 0])}
              fill={PALETTE.cal}
              opacity={interpolate(slit, [0, 1], [0, 0.9])}
            />
          </>
        ) : null}
      </svg>
    </AbsoluteFill>
  );
};
