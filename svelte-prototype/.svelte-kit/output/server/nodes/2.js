

export const index = 2;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_page.svelte.js')).default;
export const imports = ["_app/immutable/nodes/2.CJ1f83uK.js","_app/immutable/chunks/D8aoWfRe.js","_app/immutable/chunks/BXq3pflB.js","_app/immutable/chunks/Cs3yrXb8.js"];
export const stylesheets = ["_app/immutable/assets/PageLayout.Cz8yIb7J.css","_app/immutable/assets/2.DlF9C3i4.css"];
export const fonts = [];
