

export const index = 2;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_page.svelte.js')).default;
export const imports = ["_app/immutable/nodes/2.BHlRi5mS.js","_app/immutable/chunks/DQJjpEFo.js","_app/immutable/chunks/CCOHz7Q4.js","_app/immutable/chunks/GmfwjkDy.js"];
export const stylesheets = ["_app/immutable/assets/PageLayout.DiiS_FyR.css","_app/immutable/assets/2.DlF9C3i4.css"];
export const fonts = [];
