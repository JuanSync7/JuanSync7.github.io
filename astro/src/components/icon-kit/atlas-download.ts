/** Download helpers stay outside the geometry, which has no DOM or browser dependencies. */
export function downloadSvg(source: string, name: string): void {
  const url = URL.createObjectURL(new Blob([source], { type: 'image/svg+xml;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  // The navigation has consumed the Blob by the next task; no URL survives the download.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
