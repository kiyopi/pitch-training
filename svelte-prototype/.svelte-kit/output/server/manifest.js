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
		client: {start:"_app/immutable/entry/start.BBOBJso4.js",app:"_app/immutable/entry/app.DKAkynOf.js",imports:["_app/immutable/entry/start.BBOBJso4.js","_app/immutable/chunks/Bkg5h6gs.js","_app/immutable/chunks/5yvZxQZi.js","_app/immutable/entry/app.DKAkynOf.js","_app/immutable/chunks/5yvZxQZi.js","_app/immutable/chunks/CYbRtnWi.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
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
