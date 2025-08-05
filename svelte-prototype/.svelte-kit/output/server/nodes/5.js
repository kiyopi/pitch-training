

export const index = 5;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/training/continuous/_page.svelte.js')).default;
export const universal = {
  "prerender": false,
  "ssr": false
};
export const universal_id = "src/routes/training/continuous/+page.ts";
export const imports = ["_app/immutable/nodes/5.C6q9Z6uQ.js","_app/immutable/chunks/BbQtw8CC.js","_app/immutable/chunks/IHki7fMi.js","_app/immutable/chunks/Dh8H6GB0.js","_app/immutable/chunks/DNmPTphr.js","_app/immutable/chunks/D6YF6ztN.js","_app/immutable/chunks/CB02h6m0.js","_app/immutable/chunks/DjSLRzt-.js","_app/immutable/chunks/DhyemY5g.js"];
export const stylesheets = ["_app/immutable/assets/PageLayout.DiiS_FyR.css","_app/immutable/assets/PitchDetectionDisplay.BuTwW1pX.css","_app/immutable/assets/sessionStorage.BHSgymFr.css","_app/immutable/assets/5.DNh3LoDe.css"];
export const fonts = [];
