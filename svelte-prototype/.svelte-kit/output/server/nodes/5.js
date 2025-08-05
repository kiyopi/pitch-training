

export const index = 5;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/training/continuous/_page.svelte.js')).default;
export const universal = {
  "prerender": false,
  "ssr": false
};
export const universal_id = "src/routes/training/continuous/+page.ts";
export const imports = ["_app/immutable/nodes/5.CrLDFm23.js","_app/immutable/chunks/C1FmrZbK.js","_app/immutable/chunks/DXfV3yLF.js","_app/immutable/chunks/D0QH3NT1.js","_app/immutable/chunks/BnpKoSs-.js","_app/immutable/chunks/DKsDfBP_.js","_app/immutable/chunks/DE-oDtoq.js","_app/immutable/chunks/CrwomGmF.js","_app/immutable/chunks/BRZWrjh2.js","_app/immutable/chunks/C56X5YjC.js"];
export const stylesheets = ["_app/immutable/assets/PageLayout.DiiS_FyR.css","_app/immutable/assets/PitchDetectionDisplay.BuTwW1pX.css","_app/immutable/assets/sessionStorage.2zs4CtXT.css","_app/immutable/assets/5.CiVZawMs.css"];
export const fonts = [];
