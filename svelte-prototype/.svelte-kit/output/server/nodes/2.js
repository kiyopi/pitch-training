

export const index = 2;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_page.svelte.js')).default;
export const imports = ["_app/immutable/nodes/2.BFFYBWwE.js","_app/immutable/chunks/D5V3uhf7.js","_app/immutable/chunks/TQMthVLs.js"];
export const stylesheets = ["_app/immutable/assets/2.CYZ2ahmP.css"];
export const fonts = [];
