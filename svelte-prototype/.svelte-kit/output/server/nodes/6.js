

export const index = 6;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/training/random/_page.svelte.js')).default;
export const universal = {
  "prerender": false,
  "ssr": false
};
export const universal_id = "src/routes/training/random/+page.ts";
export const imports = ["_app/immutable/nodes/6.Cdfur9zN.js","_app/immutable/chunks/C1FmrZbK.js","_app/immutable/chunks/Be0szi1F.js","_app/immutable/chunks/D0QH3NT1.js","_app/immutable/chunks/CzYZU643.js","_app/immutable/chunks/CGE1Ttke.js","_app/immutable/chunks/BTQHM1s2.js","_app/immutable/chunks/iHfyItqC.js","_app/immutable/chunks/CA7GL6z4.js","_app/immutable/chunks/DzFNKnhn.js"];
export const stylesheets = ["_app/immutable/assets/PageLayout.DiiS_FyR.css","_app/immutable/assets/PitchDetectionDisplay.BuTwW1pX.css","_app/immutable/assets/sessionStorage.BHSgymFr.css","_app/immutable/assets/6.DtQdvkVQ.css"];
export const fonts = [];
