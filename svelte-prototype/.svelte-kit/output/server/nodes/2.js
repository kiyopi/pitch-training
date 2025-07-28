

export const index = 2;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_page.svelte.js')).default;
export const imports = ["_app/immutable/nodes/2.B7uX8LyD.js","_app/immutable/chunks/DgX0WCss.js","_app/immutable/chunks/CQE7AbJL.js","_app/immutable/chunks/CFICKuE2.js"];
export const stylesheets = ["_app/immutable/assets/PageLayout.Cz8yIb7J.css","_app/immutable/assets/2.DlF9C3i4.css"];
export const fonts = [];
