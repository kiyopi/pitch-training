

export const index = 1;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/fallbacks/error.svelte.js')).default;
export const imports = ["_app/immutable/nodes/1.gQc4m0BS.js","_app/immutable/chunks/D5V3uhf7.js","_app/immutable/chunks/TQMthVLs.js","_app/immutable/chunks/CmAHWokF.js"];
export const stylesheets = [];
export const fonts = [];
