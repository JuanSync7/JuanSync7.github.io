let software: boolean | undefined;

/** True when WebGL works but only in software (no GPU: a VM, an old machine, a CI runner). The
 *  browser refuses a context that asks to fail on a major performance caveat in exactly that
 *  case. Scenes take a lighter path there (no MSAA, the cheaper shadow filter); on a GPU both
 *  are nearly free, so what most readers see does not change. */
export function softwareGL(): boolean {
  if (software !== undefined) return software;
  try {
    const probe = document.createElement('canvas');
    const strict = probe.getContext('webgl2', { failIfMajorPerformanceCaveat: true });
    strict?.getExtension('WEBGL_lose_context')?.loseContext();
    const gl = document.createElement('canvas').getContext('webgl2');
    // Chrome's SwiftShader behind ANGLE passes the caveat test, but names itself.
    const info = gl?.getExtension('WEBGL_debug_renderer_info');
    const name = gl && info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : '';
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    software = Boolean(gl) && (!strict || /swiftshader|llvmpipe|softpipe|basic render|software/i.test(name));
  } catch {
    software = false;
  }
  return software;
}
