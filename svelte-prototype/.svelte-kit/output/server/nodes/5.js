

export const index = 5;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/training/continuous/_page.svelte.js')).default;
export const universal = {
  "prerender": false,
  "ssr": false
};
export const universal_id = "src/routes/training/continuous/+page.ts";
export const imports = ["_app/immutable/nodes/5.BVJFCNsQ.js","_app/immutable/chunks/C1FmrZbK.js","_app/immutable/chunks/BbQtw8CC.js","_app/immutable/chunks/D6YF6ztN.js","_app/immutable/chunks/IHki7fMi.js","_app/immutable/chunks/DeSIqWoX.js","_app/immutable/chunks/CRF06j_Q.js","_app/immutable/chunks/DNmPTphr.js","_app/immutable/chunks/CB02h6m0.js","_app/immutable/chunks/DjSLRzt-.js","_app/immutable/chunks/C2LwfFrM.js"];
export const stylesheets = ["_app/immutable/assets/PageLayout.DiiS_FyR.css","_app/immutable/assets/PitchDetectionDisplay.BuTwW1pX.css","_app/immutable/assets/sessionStorage.2zs4CtXT.css","_app/immutable/assets/5.lzWhBRQu.css"];
export const fonts = [];
