

export const index = 3;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/microphone-test/_page.svelte.js')).default;
export const universal = {
  "prerender": true,
  "ssr": false
};
export const universal_id = "src/routes/microphone-test/+page.ts";
export const imports = ["_app/immutable/nodes/3.BgfQNJiI.js","_app/immutable/chunks/BbQtw8CC.js","_app/immutable/chunks/IHki7fMi.js","_app/immutable/chunks/CRF06j_Q.js","_app/immutable/chunks/DeSIqWoX.js","_app/immutable/chunks/DNmPTphr.js","_app/immutable/chunks/DjSLRzt-.js"];
export const stylesheets = ["_app/immutable/assets/PageLayout.DiiS_FyR.css","_app/immutable/assets/PitchDetectionDisplay.BuTwW1pX.css","_app/immutable/assets/3.BR35IBqC.css"];
export const fonts = [];
