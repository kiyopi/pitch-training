

export const index = 3;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/microphone-test/_page.svelte.js')).default;
export const universal = {
  "prerender": true,
  "ssr": false
};
export const universal_id = "src/routes/microphone-test/+page.ts";
export const imports = ["_app/immutable/nodes/3.D9yWpZv4.js","_app/immutable/chunks/CJUHymq1.js","_app/immutable/chunks/IHki7fMi.js","_app/immutable/chunks/BspBx8Mx.js","_app/immutable/chunks/Cn0DBND1.js","_app/immutable/chunks/DqnuPPYK.js","_app/immutable/chunks/0TDGV0x0.js"];
export const stylesheets = ["_app/immutable/assets/PageLayout.DiiS_FyR.css","_app/immutable/assets/PitchDetectionDisplay.BuTwW1pX.css","_app/immutable/assets/3.DA77aMuH.css"];
export const fonts = [];
