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
		client: {start:"_app/immutable/entry/start.De1IFPfL.js",app:"_app/immutable/entry/app.CZ3NU9Dq.js",imports:["_app/immutable/entry/start.De1IFPfL.js","_app/immutable/chunks/Dp0rsHE6.js","_app/immutable/chunks/CpsCVeNF.js","_app/immutable/entry/app.CZ3NU9Dq.js","_app/immutable/chunks/CpsCVeNF.js","_app/immutable/chunks/BtN2v-Ab.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
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
