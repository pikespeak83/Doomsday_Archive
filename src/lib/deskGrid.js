/**
 * Desktop icon grid: fixed cells so icons snap like Windows and never
 * overlap. Free (dragged) icons store snapped pixel positions.
 */
export const CELL_W = 104;
export const CELL_H = 118;
export const PAD_X = 14;
export const PAD_Y = 26;

/** Snaps a raw drop point to the grid, stepping to the next free cell if taken. */
export function snapToGrid(pos, takenPositions, deskHeight) {
  const cellKey = (c, r) => `${c},${r}`;
  const used = new Set(
    (takenPositions || []).map((p) =>
      cellKey(Math.round((p.x - PAD_X) / CELL_W), Math.round((p.y - PAD_Y) / CELL_H)))
  );
  let col = Math.max(0, Math.round((pos.x - PAD_X) / CELL_W));
  let row = Math.max(0, Math.round((pos.y - PAD_Y) / CELL_H));
  const maxRow = Math.max(0, Math.floor(((deskHeight || 700) - 170 - PAD_Y) / CELL_H));
  let guard = 0;
  while (used.has(cellKey(col, row)) && guard < 400) {
    row += 1;
    if (row > maxRow) {
      row = 0;
      col += 1;
    }
    guard += 1;
  }
  return { x: PAD_X + col * CELL_W, y: PAD_Y + row * CELL_H };
}
