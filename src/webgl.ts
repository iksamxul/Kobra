/** Whether this browser can make a WebGL context. Checked before three.js creates a renderer,
 *  so a browser without WebGL takes the CSS fallback quietly instead of logging errors. */
export function webglAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl2') || canvas.getContext('webgl');
    context?.getExtension('WEBGL_lose_context')?.loseContext();
    return !!context;
  } catch {
    return false;
  }
}
