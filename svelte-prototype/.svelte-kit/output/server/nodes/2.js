

export const index = 2;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_page.svelte.js')).default;
export const imports = ["_app/immutable/nodes/2.BEu9WpAS.js","_app/immutable/chunks/D1aCxdtC.js","_app/immutable/chunks/CzEUDJfP.js","_app/immutable/chunks/Bka4AAjE.js"];
export const stylesheets = ["_app/immutable/assets/PageLayout.Cz8yIb7J.css","_app/immutable/assets/2.DlF9C3i4.css"];
export const fonts = [];
