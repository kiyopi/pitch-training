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
		client: {start:"_app/immutable/entry/start.BNVInaPN.js",app:"_app/immutable/entry/app.CaYpztl3.js",imports:["_app/immutable/entry/start.BNVInaPN.js","_app/immutable/chunks/i9n_ZUt2.js","_app/immutable/chunks/D5V3uhf7.js","_app/immutable/entry/app.CaYpztl3.js","_app/immutable/chunks/D5V3uhf7.js","_app/immutable/chunks/TQMthVLs.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
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
