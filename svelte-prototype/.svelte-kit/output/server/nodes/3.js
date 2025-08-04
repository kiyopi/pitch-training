

export const index = 3;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/microphone-test/_page.svelte.js')).default;
export const universal = {
  "prerender": true,
  "ssr": false
};
export const universal_id = "src/routes/microphone-test/+page.ts";
export const imports = ["_app/immutable/nodes/3.DSaUvdw8.js","_app/immutable/chunks/D-MQVlDL.js","_app/immutable/chunks/D0QH3NT1.js","_app/immutable/chunks/DEDhZaYq.js","_app/immutable/chunks/HPqwxaGO.js","_app/immutable/chunks/tvQBA-Dy.js","_app/immutable/chunks/BZyPgggR.js","_app/immutable/chunks/BUbiQ_O5.js"];
export const stylesheets = ["_app/immutable/assets/PageLayout.DiiS_FyR.css","_app/immutable/assets/PitchDetectionDisplay.BuTwW1pX.css","_app/immutable/assets/3.Douwi259.css"];
export const fonts = [];
