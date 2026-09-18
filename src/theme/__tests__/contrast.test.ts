/**
 * The palette's claims, made checkable.
 *
 * tokens.ts asserts two things in prose -- "every text pairing below clears
 * WCAG AA (4.5:1) against its own surface" and "piece colours ... all AA on the
 * board well" -- and nothing enforced either. Both happen to be true today. A
 * claim in a comment stops being true silently; this is the same class of bug
 * as GridHabit's contribution grid, which shipped at 1.08:1 with every test
 * passing because no test was looking at colour.
 *
 * Deliberately NOT asserted: cellEmpty against boardWell, which measures 1.13:1.
 * That is a design choice rather than an oversight -- the empty grid is a quiet
 * backdrop for pieces that sit at 5.6:1 to 10.3:1 against it, and the cells are
 * delineated by `cellEmptyEdge` rather than by fill. Pinning it here would
 * freeze a decision this file never made.
 *
 * The reasoning above was sound and its premise was false. `cellEmptyEdge` was
 * `rgba(255,255,255,0.04)`, which composites to 1.12:1 against the cell it is
 * supposed to outline -- so nothing delineated anything, and the exemption
 * rested on a number no one had measured. The live iPad screenshot shows the
 * result: a board a customer cannot see.
 *
 * So the edge is now asserted instead. Keeping the fill exemption and checking
 * the thing it defers to is the honest version of the same decision.
 */
import { colors, pieceColors } from '../tokens';

function luminance(hex: string): number {
  const h = hex.replace('#', '');
  const channels = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((v) =>
    v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4,
  ) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

const SURFACES = ['background', 'backgroundElevated', 'surface', 'surfaceMuted'] as const;

describe('text pairings', () => {
  it.each(SURFACES)('body text clears AA on %s', (surface) => {
    expect(contrastRatio(colors.text, colors[surface])).toBeGreaterThanOrEqual(4.5);
  });

  it.each(SURFACES)('muted text clears AA on %s', (surface) => {
    expect(contrastRatio(colors.textMuted, colors[surface])).toBeGreaterThanOrEqual(4.5);
  });

  it('accent text clears AA on the background it is used against', () => {
    expect(contrastRatio(colors.accent, colors.background)).toBeGreaterThanOrEqual(4.5);
  });
});

describe('piece colours', () => {
  it.each(pieceColors.map((p, i) => [i, p.base] as const))(
    'piece %i is AA on the board well',
    (_i, base) => {
      expect(contrastRatio(base, colors.boardWell)).toBeGreaterThanOrEqual(4.5);
    },
  );

  it.each(pieceColors.map((p, i) => [i, p.base] as const))(
    'piece %i stays visible against an empty cell',
    (_i, base) => {
      expect(contrastRatio(base, colors.cellEmpty)).toBeGreaterThanOrEqual(4.5);
    },
  );

  it('keeps every piece distinguishable from every other', () => {
    // Colour-vision deficiency is handled by hue choice, which a ratio cannot
    // check; this only catches two pieces collapsing to the same lightness.
    for (let i = 0; i < pieceColors.length; i += 1) {
      for (let j = i + 1; j < pieceColors.length; j += 1) {
        expect(pieceColors[i]!.base).not.toBe(pieceColors[j]!.base);
      }
    }
  });
});

describe('the empty grid is delineated', () => {
  /**
   * The fill is allowed to be quiet; the edge is what makes a cell a cell. WCAG
   * AA asks 3:1 for the boundary of a non-text UI component, and an empty cell
   * before the first piece lands is the whole board.
   */
  function composite(rgba: string, over: string): string {
    const m = rgba.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
    if (!m) throw new Error(`not an rgba colour: ${rgba}`);
    const alpha = Number(m[4]);
    const fg = [Number(m[1]), Number(m[2]), Number(m[3])];
    const h = over.replace('#', '');
    const bg = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
    const mix = fg.map((v, i) => Math.round(alpha * v + (1 - alpha) * bg[i]!));
    return `#${mix.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
  }

  it('draws the empty cell edge at 3:1 against the cell', () => {
    expect(
      contrastRatio(composite(colors.cellEmptyEdge, colors.cellEmpty), colors.cellEmpty)
    ).toBeGreaterThanOrEqual(3);
  });
});
