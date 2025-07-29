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
		client: {start:"_app/immutable/entry/start.DGAsKXNE.js",app:"_app/immutable/entry/app.BR5h-1_k.js",imports:["_app/immutable/entry/start.DGAsKXNE.js","_app/immutable/chunks/d2IEMMMz.js","_app/immutable/chunks/H9DbT-qZ.js","_app/immutable/entry/app.BR5h-1_k.js","_app/immutable/chunks/H9DbT-qZ.js","_app/immutable/chunks/C5IfuXF8.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
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
