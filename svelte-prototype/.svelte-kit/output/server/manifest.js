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
		client: {start:"_app/immutable/entry/start.cdDvPECR.js",app:"_app/immutable/entry/app.BQkcD3LZ.js",imports:["_app/immutable/entry/start.cdDvPECR.js","_app/immutable/chunks/BViy7-Je.js","_app/immutable/chunks/EvMzC0aQ.js","_app/immutable/entry/app.BQkcD3LZ.js","_app/immutable/chunks/EvMzC0aQ.js","_app/immutable/chunks/DrEUfQCr.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
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
