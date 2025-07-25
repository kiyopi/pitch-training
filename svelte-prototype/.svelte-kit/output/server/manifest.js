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
		client: {start:"_app/immutable/entry/start.ChsIlLES.js",app:"_app/immutable/entry/app.D9daqAM1.js",imports:["_app/immutable/entry/start.ChsIlLES.js","_app/immutable/chunks/htrp9Wr9.js","_app/immutable/chunks/DPxCR1R2.js","_app/immutable/entry/app.D9daqAM1.js","_app/immutable/chunks/DPxCR1R2.js","_app/immutable/chunks/Bh1sI7gf.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
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
