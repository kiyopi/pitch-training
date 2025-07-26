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
		client: {start:"_app/immutable/entry/start.BGJHiRLy.js",app:"_app/immutable/entry/app.BZbVYvGH.js",imports:["_app/immutable/entry/start.BGJHiRLy.js","_app/immutable/chunks/B9IQxJb3.js","_app/immutable/chunks/Dujr-1LT.js","_app/immutable/chunks/B5B5A5a0.js","_app/immutable/entry/app.BZbVYvGH.js","_app/immutable/chunks/Dujr-1LT.js","_app/immutable/chunks/B_rl9Jj9.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
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
