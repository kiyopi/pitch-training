

export const index = 5;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/training/continuous/_page.svelte.js')).default;
export const universal = {
  "prerender": false,
  "ssr": false
};
export const universal_id = "src/routes/training/continuous/+page.ts";
export const imports = ["_app/immutable/nodes/5.BWKMckts.js","_app/immutable/chunks/CA1QoDly.js","_app/immutable/chunks/D0QH3NT1.js","_app/immutable/chunks/DruVC1qS.js","_app/immutable/chunks/De6g8PEg.js","_app/immutable/chunks/heMtRBEE.js","_app/immutable/chunks/B4cOZNaU.js","_app/immutable/chunks/Av7rcFI8.js","_app/immutable/chunks/Bdb-7ysr.js"];
export const stylesheets = ["_app/immutable/assets/PageLayout.DiiS_FyR.css","_app/immutable/assets/PitchDetectionDisplay.BuTwW1pX.css","_app/immutable/assets/sessionStorage.BHSgymFr.css","_app/immutable/assets/5.CK9VRwlo.css","_app/immutable/assets/app.B1f1RpuR.css"];
export const fonts = [];
