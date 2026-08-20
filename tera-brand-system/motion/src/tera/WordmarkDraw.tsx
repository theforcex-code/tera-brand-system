import {getLength} from '@remotion/paths';
import {useMemo} from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {splitSubpaths, STROKE_WIDTH, VIEWBOX} from './tokens';

export type WordmarkDrawProps = {
  d: string;
  background: string;
  stroke: string;
  // fração da duração usada pelo desenho (o resto é hold no estado final)
  drawPortion: number;
};

// Desenha o traço contínuo do wordmark com velocidade de pena constante:
// o comprimento total desenhado avança com easing e cada subpath entra
// quando a "pena" chega nele — t, é, r, a nascem em sequência.
export const WordmarkDraw: React.FC<WordmarkDrawProps> = ({
  d,
  background,
  stroke,
  drawPortion,
}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();

  const segments = useMemo(() => {
    const parts = splitSubpaths(d);
    let cursor = 0;
    return parts.map((seg) => {
      const length = getLength(seg);
      const start = cursor;
      cursor += length;
      return {seg, length, start};
    });
  }, [d]);

  const totalLength = useMemo(
    () => segments.reduce((sum, s) => sum + s.length, 0),
    [segments],
  );

  const drawFrames = Math.round(durationInFrames * drawPortion);
  const progress = interpolate(frame, [0, drawFrames], [0, 1], {
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });
  const drawnLength = progress * totalLength;

  return (
    <AbsoluteFill style={{backgroundColor: background, justifyContent: 'center', alignItems: 'center'}}>
      <svg
        viewBox={`${VIEWBOX.x} ${VIEWBOX.y} ${VIEWBOX.w} ${VIEWBOX.h}`}
        style={{width: '62%'}}
      >
        {segments.map(({seg, length, start}) => {
          const local = Math.min(Math.max((drawnLength - start) / length, 0), 1);
          if (local === 0) {
            return null;
          }
          return (
            <path
              key={seg}
              d={seg}
              fill="none"
              stroke={stroke}
              strokeWidth={STROKE_WIDTH}
              strokeLinecap="butt"
              strokeDasharray={length}
              strokeDashoffset={length * (1 - local)}
            />
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
