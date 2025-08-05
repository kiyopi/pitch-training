

export const index = 4;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/training/chromatic/_page.svelte.js')).default;
export const universal = {
  "prerender": false,
  "ssr": false
};
export const universal_id = "src/routes/training/chromatic/+page.ts";
export const imports = ["_app/immutable/nodes/4.pXLcUdim.js","_app/immutable/chunks/DQJjpEFo.js","_app/immutable/chunks/D0QH3NT1.js","_app/immutable/chunks/CCOHz7Q4.js","_app/immutable/chunks/GmfwjkDy.js","_app/immutable/chunks/DtuO3-PM.js"];
export const stylesheets = ["_app/immutable/assets/PageLayout.DiiS_FyR.css","_app/immutable/assets/4.DxItvq4r.css"];
export const fonts = [];
