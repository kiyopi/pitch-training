

export const index = 6;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/training/random/_page.svelte.js')).default;
export const universal = {
  "prerender": true,
  "ssr": false
};
export const universal_id = "src/routes/training/random/+page.ts";
export const imports = ["_app/immutable/nodes/6.BbB973-m.js","_app/immutable/chunks/CJUHymq1.js","_app/immutable/chunks/IHki7fMi.js","_app/immutable/chunks/Cn0DBND1.js","_app/immutable/chunks/DqnuPPYK.js","_app/immutable/chunks/C-zpCPee.js","_app/immutable/chunks/D6YF6ztN.js","_app/immutable/chunks/BxqPpOdC.js","_app/immutable/chunks/0TDGV0x0.js"];
export const stylesheets = ["_app/immutable/assets/PageLayout.DiiS_FyR.css","_app/immutable/assets/PitchDetectionDisplay.BuTwW1pX.css","_app/immutable/assets/TrainingCore.DZJF4zvz.css","_app/immutable/assets/6.4xS8lZID.css"];
export const fonts = [];
