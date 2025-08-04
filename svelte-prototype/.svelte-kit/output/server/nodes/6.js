

export const index = 6;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/training/random/_page.svelte.js')).default;
export const universal = {
  "prerender": false,
  "ssr": false
};
export const universal_id = "src/routes/training/random/+page.ts";
export const imports = ["_app/immutable/nodes/6.B633rIOo.js","_app/immutable/chunks/C1FmrZbK.js","_app/immutable/chunks/ChDCDHhu.js","_app/immutable/chunks/D6YF6ztN.js","_app/immutable/chunks/IHki7fMi.js","_app/immutable/chunks/DYrXUu6e.js","_app/immutable/chunks/CWNLdXLH.js","_app/immutable/chunks/DQaHVEr9.js","_app/immutable/chunks/Cx4dwUxr.js","_app/immutable/chunks/B6wEjQM2.js","_app/immutable/chunks/DrUK7av6.js"];
export const stylesheets = ["_app/immutable/assets/PageLayout.DiiS_FyR.css","_app/immutable/assets/PitchDetectionDisplay.BuTwW1pX.css","_app/immutable/assets/sessionStorage.BHSgymFr.css","_app/immutable/assets/6.DtQdvkVQ.css"];
export const fonts = [];
