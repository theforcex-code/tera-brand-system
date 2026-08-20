import {Composition} from 'remotion';
import {MateriaFresta} from './tera/MateriaFresta';
import {WordmarkDraw} from './tera/WordmarkDraw';
import {PALETTE, WORDMARK_BARRA, WORDMARK_EPSILON} from './tera/tokens';

const FPS = 30;

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="wordmark-draw-ink"
        component={WordmarkDraw}
        durationInFrames={150}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={{
          d: WORDMARK_EPSILON,
          background: PALETTE.cal,
          stroke: PALETTE.ink,
          drawPortion: 0.75,
        }}
      />
      <Composition
        id="wordmark-draw-cal"
        component={WordmarkDraw}
        durationInFrames={150}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={{
          d: WORDMARK_BARRA,
          background: PALETTE.ink,
          stroke: PALETTE.cal,
          drawPortion: 0.75,
        }}
      />
      <Composition
        id="materia-fresta"
        component={MateriaFresta}
        durationInFrames={180}
        fps={FPS}
        width={1920}
        height={1080}
      />
    </>
  );
};
