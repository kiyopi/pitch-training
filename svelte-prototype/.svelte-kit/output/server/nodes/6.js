

export const index = 6;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/training/random/_page.svelte.js')).default;
export const universal = {
  "prerender": true,
  "ssr": false
};
export const universal_id = "src/routes/training/random/+page.ts";
export const imports = ["_app/immutable/nodes/6.C678Vnun.js","_app/immutable/chunks/C1FmrZbK.js","_app/immutable/chunks/DiTYgMr5.js","_app/immutable/chunks/D6YF6ztN.js","_app/immutable/chunks/IHki7fMi.js","_app/immutable/chunks/Br5P_tk7.js","_app/immutable/chunks/C5hq771Y.js","_app/immutable/chunks/Dm9mgoxX.js","_app/immutable/chunks/CrDnNSC3.js","_app/immutable/chunks/AGbc12Sy.js"];
export const stylesheets = ["_app/immutable/assets/PageLayout.DiiS_FyR.css","_app/immutable/assets/PitchDetectionDisplay.D_00FytZ.css","_app/immutable/assets/6.CgR5bedi.css"];
export const fonts = [];
