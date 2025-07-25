export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "pitch-training/_app",
	assets: new Set([]),
	mimeTypes: {},
	_: {
		client: {start:"_app/immutable/entry/start.BUIHqCHb.js",app:"_app/immutable/entry/app.2bTgZGvL.js",imports:["_app/immutable/entry/start.BUIHqCHb.js","_app/immutable/chunks/ZHAW4D-5.js","_app/immutable/chunks/Dh4MrDnZ.js","_app/immutable/entry/app.2bTgZGvL.js","_app/immutable/chunks/Dh4MrDnZ.js","_app/immutable/chunks/IHki7fMi.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js'))
		],
		routes: [
			
		],
		prerendered_routes: new Set(["/pitch-training/","/pitch-training/microphone-test-simple","/pitch-training/microphone-test","/pitch-training/training/chromatic","/pitch-training/training/continuous","/pitch-training/training/random"]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
