

export const index = 4;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/training/chromatic/_page.svelte.js')).default;
export const universal = {
  "prerender": false,
  "ssr": false
};
export const universal_id = "src/routes/training/chromatic/+page.ts";
export const imports = ["_app/immutable/nodes/4.CzuQrViB.js","_app/immutable/chunks/Be0szi1F.js","_app/immutable/chunks/D0QH3NT1.js","_app/immutable/chunks/CzYZU643.js","_app/immutable/chunks/iHfyItqC.js","_app/immutable/chunks/CGE1Ttke.js"];
export const stylesheets = ["_app/immutable/assets/PageLayout.DiiS_FyR.css","_app/immutable/assets/4.B0Z6I6O1.css"];
export const fonts = [];
