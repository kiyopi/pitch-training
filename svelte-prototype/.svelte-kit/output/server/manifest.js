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
		client: {start:"_app/immutable/entry/start.DTQGqK_2.js",app:"_app/immutable/entry/app.CMCHmdmA.js",imports:["_app/immutable/entry/start.DTQGqK_2.js","_app/immutable/chunks/Dqp-AFly.js","_app/immutable/chunks/Dujr-1LT.js","_app/immutable/entry/app.CMCHmdmA.js","_app/immutable/chunks/Dujr-1LT.js","_app/immutable/chunks/B_rl9Jj9.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
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
