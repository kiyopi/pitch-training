

export const index = 3;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/microphone-test/_page.svelte.js')).default;
export const universal = {
  "prerender": true,
  "ssr": false
};
export const universal_id = "src/routes/microphone-test/+page.ts";
export const imports = ["_app/immutable/nodes/3.e6UOkuMf.js","_app/immutable/chunks/BJp-dNlk.js","_app/immutable/chunks/IHki7fMi.js","_app/immutable/chunks/DSZDj4MG.js","_app/immutable/chunks/q1nTZLTz.js","_app/immutable/chunks/DZHPMXgl.js","_app/immutable/chunks/B_FSRna_.js"];
export const stylesheets = ["_app/immutable/assets/PageLayout.DiiS_FyR.css","_app/immutable/assets/PitchDetectionDisplay.D_00FytZ.css","_app/immutable/assets/3.BQSNMI0e.css"];
export const fonts = [];
