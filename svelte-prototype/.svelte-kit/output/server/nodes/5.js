

export const index = 5;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/training/continuous/_page.svelte.js')).default;
export const universal = {
  "prerender": false,
  "ssr": false
};
export const universal_id = "src/routes/training/continuous/+page.ts";
export const imports = ["_app/immutable/nodes/5.C5adT72P.js","_app/immutable/chunks/DQJjpEFo.js","_app/immutable/chunks/D0QH3NT1.js","_app/immutable/chunks/CCOHz7Q4.js","_app/immutable/chunks/DtuO3-PM.js","_app/immutable/chunks/GmfwjkDy.js","_app/immutable/chunks/BbJX3xI0.js","_app/immutable/chunks/18BvmwZn.js","_app/immutable/chunks/BedpRUbi.js"];
export const stylesheets = ["_app/immutable/assets/PageLayout.DiiS_FyR.css","_app/immutable/assets/PitchDetectionDisplay.BuTwW1pX.css","_app/immutable/assets/sessionStorage.BHSgymFr.css","_app/immutable/assets/5.CK9VRwlo.css"];
export const fonts = [];
