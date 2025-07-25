export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set([]),
	mimeTypes: {},
	_: {
		client: {start:"_app/immutable/entry/start.BqK0cpMc.js",app:"_app/immutable/entry/app.Bd3FzWht.js",imports:["_app/immutable/entry/start.BqK0cpMc.js","_app/immutable/chunks/DRqNxchV.js","_app/immutable/chunks/p0IT90XR.js","_app/immutable/entry/app.Bd3FzWht.js","_app/immutable/chunks/p0IT90XR.js","_app/immutable/chunks/B0HqwU-P.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
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
