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
		client: {start:"_app/immutable/entry/start.D0S-7Vg0.js",app:"_app/immutable/entry/app.qmwMq5Mj.js",imports:["_app/immutable/entry/start.D0S-7Vg0.js","_app/immutable/chunks/BPfLJ2kb.js","_app/immutable/chunks/C2Ia9gCW.js","_app/immutable/entry/app.qmwMq5Mj.js","_app/immutable/chunks/C2Ia9gCW.js","_app/immutable/chunks/oq5NcwJP.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
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
