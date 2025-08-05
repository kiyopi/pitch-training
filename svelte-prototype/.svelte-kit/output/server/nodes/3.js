

export const index = 3;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/microphone-test/_page.svelte.js')).default;
export const universal = {
  "prerender": true,
  "ssr": false
};
export const universal_id = "src/routes/microphone-test/+page.ts";
export const imports = ["_app/immutable/nodes/3.CoGN3KpH.js","_app/immutable/chunks/Be0szi1F.js","_app/immutable/chunks/D0QH3NT1.js","_app/immutable/chunks/CzYZU643.js","_app/immutable/chunks/BTQHM1s2.js","_app/immutable/chunks/CGE1Ttke.js","_app/immutable/chunks/iHfyItqC.js","_app/immutable/chunks/CA7GL6z4.js"];
export const stylesheets = ["_app/immutable/assets/PageLayout.DiiS_FyR.css","_app/immutable/assets/PitchDetectionDisplay.BuTwW1pX.css","_app/immutable/assets/3.BR35IBqC.css"];
export const fonts = [];
