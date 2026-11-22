export type FigureName = 'pipeline' | 'scale' | 'contrast' | 'sounds';

export type Block =
  | string
  | { code: string; caption: string }
  | { figure: FigureName; caption: string };

export const minutes = (blocks: Block[]) =>
  Math.max(1, Math.round(blocks.filter(b => typeof b === 'string').join(' ').split(/\s+/).length / 200));
