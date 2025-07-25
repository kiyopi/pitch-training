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
		client: {start:"_app/immutable/entry/start.DY1I-vZt.js",app:"_app/immutable/entry/app.CQZG8pIY.js",imports:["_app/immutable/entry/start.DY1I-vZt.js","_app/immutable/chunks/D-Myadiz.js","_app/immutable/chunks/EvMzC0aQ.js","_app/immutable/entry/app.CQZG8pIY.js","_app/immutable/chunks/EvMzC0aQ.js","_app/immutable/chunks/DrEUfQCr.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
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
