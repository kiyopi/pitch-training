

export const index = 3;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/microphone-test/_page.svelte.js')).default;
export const universal = {
  "prerender": false,
  "ssr": false
};
export const universal_id = "src/routes/microphone-test/+page.ts";
export const imports = ["_app/immutable/nodes/3.BbmApJZX.js","_app/immutable/chunks/DkMTtSlo.js","_app/immutable/chunks/D0QH3NT1.js","_app/immutable/chunks/Dl4NPMRd.js","_app/immutable/chunks/Cmj1O7I8.js","_app/immutable/chunks/CFnBOTwd.js","_app/immutable/chunks/DFI0yG1U.js","_app/immutable/chunks/9WKmHYGh.js"];
export const stylesheets = ["_app/immutable/assets/PageLayout.DiiS_FyR.css","_app/immutable/assets/PitchDetectionDisplay.D_00FytZ.css","_app/immutable/assets/3.BQSNMI0e.css"];
export const fonts = [];
