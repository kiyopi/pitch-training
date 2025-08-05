import * as universal from '../entries/pages/_layout.ts.js';

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export { universal };
export const universal_id = "src/routes/+layout.ts";
export const imports = ["_app/immutable/nodes/0.DtiTlb83.js","_app/immutable/chunks/DXfV3yLF.js","_app/immutable/chunks/BnpKoSs-.js"];
export const stylesheets = ["_app/immutable/assets/0.B1f1RpuR.css"];
export const fonts = [];
