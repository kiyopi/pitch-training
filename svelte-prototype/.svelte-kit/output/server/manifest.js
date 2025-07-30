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
		client: {start:"_app/immutable/entry/start.B002fwyY.js",app:"_app/immutable/entry/app.Ccww2HKK.js",imports:["_app/immutable/entry/start.B002fwyY.js","_app/immutable/chunks/CQCt9Yv5.js","_app/immutable/chunks/DF0EQxbX.js","_app/immutable/entry/app.Ccww2HKK.js","_app/immutable/chunks/DF0EQxbX.js","_app/immutable/chunks/3_8X2BZZ.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js'))
		],
		routes: [
			
		],
		prerendered_routes: new Set(["/","/microphone-test-simple","/microphone-test","/scoring-test","/training/chromatic","/training/continuous","/training/random"]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
