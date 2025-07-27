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
		client: {start:"_app/immutable/entry/start.BqK73t9L.js",app:"_app/immutable/entry/app.C18E0TsG.js",imports:["_app/immutable/entry/start.BqK73t9L.js","_app/immutable/chunks/CpL3wk11.js","_app/immutable/chunks/D5H6Vvl1.js","_app/immutable/entry/app.C18E0TsG.js","_app/immutable/chunks/D5H6Vvl1.js","_app/immutable/chunks/th-Ht-ac.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
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
