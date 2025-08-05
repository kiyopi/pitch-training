

export const index = 3;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/microphone-test/_page.svelte.js')).default;
export const universal = {
  "prerender": true,
  "ssr": false
};
export const universal_id = "src/routes/microphone-test/+page.ts";
export const imports = ["_app/immutable/nodes/3.DFrZYPz6.js","_app/immutable/chunks/CizCsqwh.js","_app/immutable/chunks/D0QH3NT1.js","_app/immutable/chunks/C-w4tHdS.js","_app/immutable/chunks/DVDXTdCN.js","_app/immutable/chunks/Q2-E1d07.js","_app/immutable/chunks/Yk103YIT.js","_app/immutable/chunks/DQP8t4Dz.js"];
export const stylesheets = ["_app/immutable/assets/PageLayout.DiiS_FyR.css","_app/immutable/assets/PitchDetectionDisplay.BuTwW1pX.css","_app/immutable/assets/3.BR35IBqC.css"];
export const fonts = [];
