

export const index = 6;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/training/random/_page.svelte.js')).default;
export const universal = {
  "prerender": false,
  "ssr": false
};
export const universal_id = "src/routes/training/random/+page.ts";
export const imports = ["_app/immutable/nodes/6.DCP9l7B8.js","_app/immutable/chunks/C1FmrZbK.js","_app/immutable/chunks/DXfV3yLF.js","_app/immutable/chunks/D0QH3NT1.js","_app/immutable/chunks/BnpKoSs-.js","_app/immutable/chunks/DgAf10VP.js","_app/immutable/chunks/df1urZql.js","_app/immutable/chunks/CrwomGmF.js","_app/immutable/chunks/BRZWrjh2.js","_app/immutable/chunks/D0vy0TI_.js"];
export const stylesheets = ["_app/immutable/assets/PageLayout.DiiS_FyR.css","_app/immutable/assets/PitchDetectionDisplay.BuTwW1pX.css","_app/immutable/assets/sessionStorage.2zs4CtXT.css","_app/immutable/assets/6.DtQdvkVQ.css"];
export const fonts = [];
