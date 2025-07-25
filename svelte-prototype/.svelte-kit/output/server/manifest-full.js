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
		client: {start:"_app/immutable/entry/start.CUncRI1L.js",app:"_app/immutable/entry/app.Bz0HfUEY.js",imports:["_app/immutable/entry/start.CUncRI1L.js","_app/immutable/chunks/DqhXlws0.js","_app/immutable/chunks/DER9Qk2L.js","_app/immutable/entry/app.Bz0HfUEY.js","_app/immutable/chunks/DER9Qk2L.js","_app/immutable/chunks/D_t-kyLb.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/2.js'))
		],
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
