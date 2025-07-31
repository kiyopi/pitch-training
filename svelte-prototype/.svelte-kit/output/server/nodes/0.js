import * as universal from '../entries/pages/_layout.ts.js';

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export { universal };
export const universal_id = "src/routes/+layout.ts";
export const imports = ["_app/immutable/nodes/0.B3r6DvEu.js","_app/immutable/chunks/BJ74v9sL.js","_app/immutable/chunks/DEjcJ3UU.js"];
export const stylesheets = ["_app/immutable/assets/0.8dNqf0q3.css"];
export const fonts = [];
