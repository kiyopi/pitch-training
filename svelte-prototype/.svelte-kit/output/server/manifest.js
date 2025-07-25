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
		client: {start:"_app/immutable/entry/start.CHUf6Q7Q.js",app:"_app/immutable/entry/app.Co-yxgnv.js",imports:["_app/immutable/entry/start.CHUf6Q7Q.js","_app/immutable/chunks/CPC7ZkK5.js","_app/immutable/chunks/DER9Qk2L.js","_app/immutable/entry/app.Co-yxgnv.js","_app/immutable/chunks/DER9Qk2L.js","_app/immutable/chunks/D_t-kyLb.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
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
