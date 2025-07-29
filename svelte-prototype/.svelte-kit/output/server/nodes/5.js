

export const index = 5;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/scoring-test/_page.svelte.js')).default;
export const imports = ["_app/immutable/nodes/5.BtCCaRlT.js","_app/immutable/chunks/H9DbT-qZ.js","_app/immutable/chunks/D0QH3NT1.js","_app/immutable/chunks/C5IfuXF8.js","_app/immutable/chunks/pFv9YEBs.js"];
export const stylesheets = ["_app/immutable/assets/5.BeR5LleT.css"];
export const fonts = [];
