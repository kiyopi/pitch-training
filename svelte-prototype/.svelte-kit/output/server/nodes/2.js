

export const index = 2;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_page.svelte.js')).default;
export const imports = ["_app/immutable/nodes/2.4_oONsWG.js","_app/immutable/chunks/DPxCR1R2.js","_app/immutable/chunks/Bh1sI7gf.js","_app/immutable/chunks/CeufOIGR.js"];
export const stylesheets = ["_app/immutable/assets/PageLayout.Cz8yIb7J.css","_app/immutable/assets/2.DlF9C3i4.css"];
export const fonts = [];
