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
		client: {start:"_app/immutable/entry/start.D93cgQh7.js",app:"_app/immutable/entry/app.Bi9sNZf0.js",imports:["_app/immutable/entry/start.D93cgQh7.js","_app/immutable/chunks/COXa0Yqg.js","_app/immutable/chunks/EvMzC0aQ.js","_app/immutable/entry/app.Bi9sNZf0.js","_app/immutable/chunks/EvMzC0aQ.js","_app/immutable/chunks/DrEUfQCr.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
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
