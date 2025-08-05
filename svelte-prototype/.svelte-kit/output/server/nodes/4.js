

export const index = 4;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/training/chromatic/_page.svelte.js')).default;
export const universal = {
  "prerender": false,
  "ssr": false
};
export const universal_id = "src/routes/training/chromatic/+page.ts";
export const imports = ["_app/immutable/nodes/4.BUOfLvCJ.js","_app/immutable/chunks/DXfV3yLF.js","_app/immutable/chunks/D0QH3NT1.js","_app/immutable/chunks/BnpKoSs-.js","_app/immutable/chunks/CrwomGmF.js","_app/immutable/chunks/2aI36TBN.js"];
export const stylesheets = ["_app/immutable/assets/PageLayout.DiiS_FyR.css","_app/immutable/assets/4.DxItvq4r.css"];
export const fonts = [];
