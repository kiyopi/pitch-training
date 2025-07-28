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
		client: {start:"_app/immutable/entry/start.DaIT2a7Z.js",app:"_app/immutable/entry/app.DVn9Qojt.js",imports:["_app/immutable/entry/start.DaIT2a7Z.js","_app/immutable/chunks/u_WPMjtQ.js","_app/immutable/chunks/DgX0WCss.js","_app/immutable/entry/app.DVn9Qojt.js","_app/immutable/chunks/DgX0WCss.js","_app/immutable/chunks/CQE7AbJL.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
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
