import * as universal from '../entries/pages/_layout.ts.js';

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export { universal };
export const universal_id = "src/routes/+layout.ts";
export const imports = ["_app/immutable/nodes/0.Dcp0z2wX.js","_app/immutable/chunks/DCAP7zA6.js","_app/immutable/chunks/BgYJxd2z.js"];
export const stylesheets = ["_app/immutable/assets/0.wPaBTmGA.css"];
export const fonts = [];
