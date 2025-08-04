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
		client: {start:"_app/immutable/entry/start.wxjZHrY8.js",app:"_app/immutable/entry/app.58bVErDh.js",imports:["_app/immutable/entry/start.wxjZHrY8.js","_app/immutable/chunks/tvQBA-Dy.js","_app/immutable/chunks/D-MQVlDL.js","_app/immutable/entry/app.58bVErDh.js","_app/immutable/chunks/C1FmrZbK.js","_app/immutable/chunks/D-MQVlDL.js","_app/immutable/chunks/DEDhZaYq.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
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
