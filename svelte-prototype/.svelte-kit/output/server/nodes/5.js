

export const index = 5;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/training/continuous/_page.svelte.js')).default;
export const universal = {
  "prerender": false,
  "ssr": false
};
export const universal_id = "src/routes/training/continuous/+page.ts";
export const imports = ["_app/immutable/nodes/5.DW9YC-4z.js","_app/immutable/chunks/CizCsqwh.js","_app/immutable/chunks/D0QH3NT1.js","_app/immutable/chunks/C-w4tHdS.js","_app/immutable/chunks/ByYRvuZh.js","_app/immutable/chunks/Yk103YIT.js","_app/immutable/chunks/ClTM2qOk.js","_app/immutable/chunks/DQP8t4Dz.js","_app/immutable/chunks/ytCVdwWH.js"];
export const stylesheets = ["_app/immutable/assets/PageLayout.DiiS_FyR.css","_app/immutable/assets/PitchDetectionDisplay.BuTwW1pX.css","_app/immutable/assets/sessionStorage.BHSgymFr.css","_app/immutable/assets/5.C6kb7Xdq.css"];
export const fonts = [];
