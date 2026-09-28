export interface HeaderScrollState {
  y: number;
  travel: number;
  hidden: boolean;
}

export function initialHeaderScroll(y = 0): HeaderScrollState {
  return { y, travel: 0, hidden: false };
}

export function advanceHeaderScroll(
  previous: HeaderScrollState,
  rawY: number,
  { maxY, topBoundary, pinned = false }: { maxY: number; topBoundary: number; pinned?: boolean },
): HeaderScrollState {
  // Clamp elastic scrolling so an overscroll bounce cannot reverse the header.
  const y = Math.min(Math.max(0, rawY), Math.max(0, maxY));
  if (pinned || y <= topBoundary) return initialHeaderScroll(y);
  const delta = y - previous.y;
  if (delta === 0) return { ...previous, y };
  const travel = Math.sign(delta) === Math.sign(previous.travel) ? previous.travel + delta : delta;
  const hidden = travel >= 32 ? true : travel <= -10 ? false : previous.hidden;
  return { y, travel: Math.max(-10, Math.min(32, travel)), hidden };
}
