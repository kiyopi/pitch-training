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
		client: {start:"_app/immutable/entry/start.CQv5Ja4V.js",app:"_app/immutable/entry/app.tg9jzM4g.js",imports:["_app/immutable/entry/start.CQv5Ja4V.js","_app/immutable/chunks/DXHmdGVp.js","_app/immutable/chunks/D8aoWfRe.js","_app/immutable/chunks/DjoIzvz5.js","_app/immutable/entry/app.tg9jzM4g.js","_app/immutable/chunks/D8aoWfRe.js","_app/immutable/chunks/BXq3pflB.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js'))
		],
		routes: [
			
		],
		prerendered_routes: new Set(["/","/microphone-test-simple","/microphone-test","/training/chromatic","/training/continuous","/training/random"]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
