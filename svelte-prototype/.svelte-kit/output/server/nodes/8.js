

export const index = 8;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/training/random/_page.svelte.js')).default;
export const universal = {
  "prerender": false,
  "ssr": false
};
export const universal_id = "src/routes/training/random/+page.ts";
export const imports = ["_app/immutable/nodes/8.-UJcUGDz.js","_app/immutable/chunks/C1FmrZbK.js","_app/immutable/chunks/DkMTtSlo.js","_app/immutable/chunks/D0QH3NT1.js","_app/immutable/chunks/Dl4NPMRd.js","_app/immutable/chunks/B2DYUtMk.js","_app/immutable/chunks/BqzIGiS0.js","_app/immutable/chunks/DFI0yG1U.js","_app/immutable/chunks/Cf_vbt4Y.js","_app/immutable/chunks/Caa7PymA.js"];
export const stylesheets = ["_app/immutable/assets/PageLayout.DiiS_FyR.css","_app/immutable/assets/PitchDetectionDisplay.D_00FytZ.css","_app/immutable/assets/8.CgR5bedi.css"];
export const fonts = [];
