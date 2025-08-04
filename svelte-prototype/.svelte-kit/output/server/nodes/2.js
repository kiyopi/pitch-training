

export const index = 2;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_page.svelte.js')).default;
export const imports = ["_app/immutable/nodes/2.CF-6j93k.js","_app/immutable/chunks/D-MQVlDL.js","_app/immutable/chunks/DEDhZaYq.js","_app/immutable/chunks/BZyPgggR.js"];
export const stylesheets = ["_app/immutable/assets/PageLayout.DiiS_FyR.css","_app/immutable/assets/2.DlF9C3i4.css"];
export const fonts = [];
