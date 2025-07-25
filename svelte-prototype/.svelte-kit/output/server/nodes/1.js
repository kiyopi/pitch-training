

export const index = 1;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/fallbacks/error.svelte.js')).default;
export const imports = ["_app/immutable/nodes/1.BPqkNxFF.js","_app/immutable/chunks/D5V3uhf7.js","_app/immutable/chunks/TQMthVLs.js","_app/immutable/chunks/i9n_ZUt2.js"];
export const stylesheets = [];
export const fonts = [];
