

export const index = 6;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/training/random/_page.svelte.js')).default;
export const universal = {
  "prerender": false,
  "ssr": false
};
export const universal_id = "src/routes/training/random/+page.ts";
export const imports = ["_app/immutable/nodes/6.CZOK2lNk.js","_app/immutable/chunks/C1FmrZbK.js","_app/immutable/chunks/MK1avi_n.js","_app/immutable/chunks/D0QH3NT1.js","_app/immutable/chunks/EmpYP22I.js","_app/immutable/chunks/DYClJkwY.js","_app/immutable/chunks/JV1wiyie.js","_app/immutable/chunks/AtinoeQd.js","_app/immutable/chunks/C77Mm1gg.js","_app/immutable/chunks/DIM9VHLJ.js"];
export const stylesheets = ["_app/immutable/assets/PageLayout.DiiS_FyR.css","_app/immutable/assets/PitchDetectionDisplay.BuTwW1pX.css","_app/immutable/assets/sessionStorage.BHSgymFr.css","_app/immutable/assets/6.DtQdvkVQ.css"];
export const fonts = [];
