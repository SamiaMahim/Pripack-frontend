// Ask the backend for a smaller copy of an uploaded image (built once, then
// cached). Allowed widths: 96, 160, 320, 640. Pick about 2x the display size.
export const thumb = (url, width) => (url ? `${url}?w=${width}` : url);
