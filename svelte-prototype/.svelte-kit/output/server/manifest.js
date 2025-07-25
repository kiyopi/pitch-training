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
		client: {start:"_app/immutable/entry/start.DfSGSuvH.js",app:"_app/immutable/entry/app.D00Hz8MZ.js",imports:["_app/immutable/entry/start.DfSGSuvH.js","_app/immutable/chunks/DySPtg_i.js","_app/immutable/chunks/d1sSvhN4.js","_app/immutable/entry/app.D00Hz8MZ.js","_app/immutable/chunks/d1sSvhN4.js","_app/immutable/chunks/DMfxy76x.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js'))
		],
		routes: [
			
		],
		prerendered_routes: new Set(["/"]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
