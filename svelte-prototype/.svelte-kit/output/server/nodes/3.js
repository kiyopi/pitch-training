

export const index = 3;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/microphone-test/_page.svelte.js')).default;
export const universal = {
  "prerender": true,
  "ssr": false
};
export const universal_id = "src/routes/microphone-test/+page.ts";
export const imports = ["_app/immutable/nodes/3.CnhBT3af.js","_app/immutable/chunks/MK1avi_n.js","_app/immutable/chunks/D0QH3NT1.js","_app/immutable/chunks/EmpYP22I.js","_app/immutable/chunks/JV1wiyie.js","_app/immutable/chunks/DYClJkwY.js","_app/immutable/chunks/AtinoeQd.js","_app/immutable/chunks/C77Mm1gg.js"];
export const stylesheets = ["_app/immutable/assets/PageLayout.DiiS_FyR.css","_app/immutable/assets/PitchDetectionDisplay.BuTwW1pX.css","_app/immutable/assets/3.BR35IBqC.css"];
export const fonts = [];
