

export const index = 6;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/training/random/_page.svelte.js')).default;
export const universal = {
  "prerender": false,
  "ssr": false
};
export const universal_id = "src/routes/training/random/+page.ts";
export const imports = ["_app/immutable/nodes/6.B6DpSr1p.js","_app/immutable/chunks/C1FmrZbK.js","_app/immutable/chunks/CizCsqwh.js","_app/immutable/chunks/D0QH3NT1.js","_app/immutable/chunks/C-w4tHdS.js","_app/immutable/chunks/Q2-E1d07.js","_app/immutable/chunks/DVDXTdCN.js","_app/immutable/chunks/Yk103YIT.js","_app/immutable/chunks/DQP8t4Dz.js","_app/immutable/chunks/B7YXzK6c.js"];
export const stylesheets = ["_app/immutable/assets/PageLayout.DiiS_FyR.css","_app/immutable/assets/PitchDetectionDisplay.BuTwW1pX.css","_app/immutable/assets/sessionStorage.BHSgymFr.css","_app/immutable/assets/6.DtQdvkVQ.css"];
export const fonts = [];
