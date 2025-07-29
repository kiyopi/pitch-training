import * as universal from '../entries/pages/_layout.ts.js';

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export { universal };
export const universal_id = "src/routes/+layout.ts";
export const imports = ["_app/immutable/nodes/0.D2TncBor.js","_app/immutable/chunks/DF0EQxbX.js","_app/immutable/chunks/3_8X2BZZ.js"];
export const stylesheets = ["_app/immutable/assets/0.CpnDy4lQ.css"];
export const fonts = [];
