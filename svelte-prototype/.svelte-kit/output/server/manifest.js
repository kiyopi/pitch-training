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
		client: {start:"_app/immutable/entry/start.3cKo0GA6.js",app:"_app/immutable/entry/app.D75qpbeu.js",imports:["_app/immutable/entry/start.3cKo0GA6.js","_app/immutable/chunks/BPjNiS9j.js","_app/immutable/chunks/EvMzC0aQ.js","_app/immutable/entry/app.D75qpbeu.js","_app/immutable/chunks/EvMzC0aQ.js","_app/immutable/chunks/DrEUfQCr.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
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
