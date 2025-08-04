

export const index = 3;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/microphone-test/_page.svelte.js')).default;
export const universal = {
  "prerender": true,
  "ssr": false
};
export const universal_id = "src/routes/microphone-test/+page.ts";
export const imports = ["_app/immutable/nodes/3.Dl_urDkZ.js","_app/immutable/chunks/B5ohtWpw.js","_app/immutable/chunks/D0QH3NT1.js","_app/immutable/chunks/zD7q2hpL.js","_app/immutable/chunks/BSV72V6E.js","_app/immutable/chunks/CDgk5rS8.js","_app/immutable/chunks/COYLqD19.js","_app/immutable/chunks/DYOT9DFe.js"];
export const stylesheets = ["_app/immutable/assets/PageLayout.DiiS_FyR.css","_app/immutable/assets/PitchDetectionDisplay.BuTwW1pX.css","_app/immutable/assets/3.Douwi259.css"];
export const fonts = [];
