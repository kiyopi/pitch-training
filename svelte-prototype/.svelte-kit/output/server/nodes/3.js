

export const index = 3;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/microphone-test/_page.svelte.js')).default;
export const universal = {
  "prerender": true,
  "ssr": false
};
export const universal_id = "src/routes/microphone-test/+page.ts";
export const imports = ["_app/immutable/nodes/3.CihbVPCi.js","_app/immutable/chunks/CA1QoDly.js","_app/immutable/chunks/D0QH3NT1.js","_app/immutable/chunks/DruVC1qS.js","_app/immutable/chunks/B4cOZNaU.js","_app/immutable/chunks/De6g8PEg.js","_app/immutable/chunks/heMtRBEE.js","_app/immutable/chunks/Av7rcFI8.js"];
export const stylesheets = ["_app/immutable/assets/PageLayout.DiiS_FyR.css","_app/immutable/assets/PitchDetectionDisplay.BuTwW1pX.css","_app/immutable/assets/3.BR35IBqC.css"];
export const fonts = [];
