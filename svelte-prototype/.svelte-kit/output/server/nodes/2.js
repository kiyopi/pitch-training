

export const index = 2;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_page.svelte.js')).default;
export const imports = ["_app/immutable/nodes/2.Djx9uQbl.js","_app/immutable/chunks/DER9Qk2L.js","_app/immutable/chunks/D_t-kyLb.js"];
export const stylesheets = ["_app/immutable/assets/2.D7VIfSXx.css"];
export const fonts = [];
