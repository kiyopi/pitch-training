import * as universal from '../entries/pages/_layout.ts.js';
import stylesheet_0 from '../stylesheets/0.D_g0mlvG.css.js';

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export { universal };
export const universal_id = "src/routes/+layout.ts";
export const imports = ["_app/immutable/nodes/0.Cm94vpko.js","_app/immutable/chunks/BbQtw8CC.js","_app/immutable/chunks/IHki7fMi.js"];
export const stylesheets = ["_app/immutable/assets/0.D_g0mlvG.css"];
export const fonts = [];
export const inline_styles = () => ({
	"_app/immutable/assets/0.D_g0mlvG.css": stylesheet_0
});
