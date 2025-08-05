

export const index = 6;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/training/random/_page.svelte.js')).default;
export const universal = {
  "prerender": false,
  "ssr": false
};
export const universal_id = "src/routes/training/random/+page.ts";
export const imports = ["_app/immutable/nodes/6.BlvijyN_.js","_app/immutable/chunks/C1FmrZbK.js","_app/immutable/chunks/DQJjpEFo.js","_app/immutable/chunks/D0QH3NT1.js","_app/immutable/chunks/CCOHz7Q4.js","_app/immutable/chunks/BFUZiz1W.js","_app/immutable/chunks/FsgQGJQs.js","_app/immutable/chunks/GmfwjkDy.js","_app/immutable/chunks/18BvmwZn.js","_app/immutable/chunks/D5fqv7c2.js"];
export const stylesheets = ["_app/immutable/assets/PageLayout.DiiS_FyR.css","_app/immutable/assets/PitchDetectionDisplay.BuTwW1pX.css","_app/immutable/assets/sessionStorage.BHSgymFr.css","_app/immutable/assets/6.DtQdvkVQ.css"];
export const fonts = [];
