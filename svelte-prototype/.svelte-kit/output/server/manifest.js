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
		client: {start:"_app/immutable/entry/start.C4rVuGy2.js",app:"_app/immutable/entry/app.CetBsY50.js",imports:["_app/immutable/entry/start.C4rVuGy2.js","_app/immutable/chunks/B507kA9a.js","_app/immutable/chunks/QmYPNss9.js","_app/immutable/entry/app.CetBsY50.js","_app/immutable/chunks/C1FmrZbK.js","_app/immutable/chunks/QmYPNss9.js","_app/immutable/chunks/Bbjhs0J8.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js'))
		],
		routes: [
			
		],
		prerendered_routes: new Set(["/","/microphone-test-simple","/microphone-test","/scoring-test","/training/chromatic","/training/continuous","/training/random"]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
