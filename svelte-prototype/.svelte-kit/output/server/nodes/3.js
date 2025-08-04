

export const index = 3;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/microphone-test/_page.svelte.js')).default;
export const universal = {
  "prerender": true,
  "ssr": false
};
export const universal_id = "src/routes/microphone-test/+page.ts";
export const imports = ["_app/immutable/nodes/3.CNyj8tCr.js","_app/immutable/chunks/DiTYgMr5.js","_app/immutable/chunks/IHki7fMi.js","_app/immutable/chunks/C5hq771Y.js","_app/immutable/chunks/Br5P_tk7.js","_app/immutable/chunks/Dm9mgoxX.js","_app/immutable/chunks/AGbc12Sy.js"];
export const stylesheets = ["_app/immutable/assets/PageLayout.DiiS_FyR.css","_app/immutable/assets/PitchDetectionDisplay.D_00FytZ.css","_app/immutable/assets/3.BQSNMI0e.css"];
export const fonts = [];
