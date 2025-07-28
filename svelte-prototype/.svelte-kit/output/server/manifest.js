export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["audio/piano/C4.mp3"]),
	mimeTypes: {".mp3":"audio/mpeg"},
	_: {
		client: {start:"_app/immutable/entry/start.DQ1LaHAv.js",app:"_app/immutable/entry/app.Bf4tTbM5.js",imports:["_app/immutable/entry/start.DQ1LaHAv.js","_app/immutable/chunks/BjiAPohD.js","_app/immutable/chunks/CBDdZxR7.js","_app/immutable/entry/app.Bf4tTbM5.js","_app/immutable/chunks/CBDdZxR7.js","_app/immutable/chunks/CmL6UHZb.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
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
