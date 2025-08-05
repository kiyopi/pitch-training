

export const index = 3;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/microphone-test/_page.svelte.js')).default;
export const universal = {
  "prerender": true,
  "ssr": false
};
export const universal_id = "src/routes/microphone-test/+page.ts";
export const imports = ["_app/immutable/nodes/3.212zC1IU.js","_app/immutable/chunks/DXfV3yLF.js","_app/immutable/chunks/D0QH3NT1.js","_app/immutable/chunks/BnpKoSs-.js","_app/immutable/chunks/BVUqprC8.js","_app/immutable/chunks/8E-Ds0ch.js","_app/immutable/chunks/CrwomGmF.js","_app/immutable/chunks/BRZWrjh2.js"];
export const stylesheets = ["_app/immutable/assets/PageLayout.DiiS_FyR.css","_app/immutable/assets/PitchDetectionDisplay.BuTwW1pX.css","_app/immutable/assets/3.BR35IBqC.css"];
export const fonts = [];
