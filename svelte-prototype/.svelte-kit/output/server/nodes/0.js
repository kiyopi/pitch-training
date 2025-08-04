import * as universal from '../entries/pages/_layout.ts.js';

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export { universal };
export const universal_id = "src/routes/+layout.ts";
export const imports = ["_app/immutable/nodes/0.B0abIAGn.js","_app/immutable/chunks/MK1avi_n.js","_app/immutable/chunks/EmpYP22I.js"];
export const stylesheets = ["_app/immutable/assets/0.B1f1RpuR.css"];
export const fonts = [];
