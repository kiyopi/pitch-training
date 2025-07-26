export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["audio/piano/Ab4.mp3","audio/piano/B3.mp3","audio/piano/Bb3.mp3","audio/piano/C4.mp3","audio/piano/D4.mp3","audio/piano/Db4.mp3","audio/piano/E4.mp3","audio/piano/Eb4.mp3","audio/piano/F4.mp3","audio/piano/Gb4.mp3"]),
	mimeTypes: {".mp3":"audio/mpeg"},
	_: {
		client: {start:"_app/immutable/entry/start.3IiFWIXh.js",app:"_app/immutable/entry/app.s_yZBiy9.js",imports:["_app/immutable/entry/start.3IiFWIXh.js","_app/immutable/chunks/Cs-jnJqK.js","_app/immutable/chunks/Dujr-1LT.js","_app/immutable/entry/app.s_yZBiy9.js","_app/immutable/chunks/Dujr-1LT.js","_app/immutable/chunks/B_rl9Jj9.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
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
