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
		client: {start:"_app/immutable/entry/start.qYyrHx7K.js",app:"_app/immutable/entry/app.C2hbJWXE.js",imports:["_app/immutable/entry/start.qYyrHx7K.js","_app/immutable/chunks/CZbMKU1o.js","_app/immutable/chunks/DI7EJjfr.js","_app/immutable/entry/app.C2hbJWXE.js","_app/immutable/chunks/DI7EJjfr.js","_app/immutable/chunks/DVnmPNbO.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js'))
		],
		routes: [
			
		],
		prerendered_routes: new Set(["/","/microphone-test-simple","/microphone-test","/training/chromatic","/training/continuous","/training/random"]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
