export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["audio/piano/C4.mp3"]),
	mimeTypes: {".mp3":"audio/mpeg"},
	_: {
		client: {start:"_app/immutable/entry/start.D69Mp7n-.js",app:"_app/immutable/entry/app.Cs4n7Sgy.js",imports:["_app/immutable/entry/start.D69Mp7n-.js","_app/immutable/chunks/CDgk5rS8.js","_app/immutable/chunks/B5ohtWpw.js","_app/immutable/entry/app.Cs4n7Sgy.js","_app/immutable/chunks/B5ohtWpw.js","_app/immutable/chunks/zD7q2hpL.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js'))
		],
		routes: [
			
		],
		prerendered_routes: new Set(["/","/microphone-test","/training/chromatic","/training/continuous","/training/random"]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
