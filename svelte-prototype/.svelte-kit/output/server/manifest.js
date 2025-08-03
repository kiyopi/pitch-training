export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "pitch-training/_app",
	assets: new Set(["audio/piano/C4.mp3"]),
	mimeTypes: {".mp3":"audio/mpeg"},
	_: {
		client: {start:"_app/immutable/entry/start.C6H6CDnW.js",app:"_app/immutable/entry/app.j7URVr1K.js",imports:["_app/immutable/entry/start.C6H6CDnW.js","_app/immutable/chunks/DFDZ1UiT.js","_app/immutable/chunks/BB952w8i.js","_app/immutable/entry/app.j7URVr1K.js","_app/immutable/chunks/C1FmrZbK.js","_app/immutable/chunks/BB952w8i.js","_app/immutable/chunks/IHki7fMi.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js'))
		],
		routes: [
			
		],
		prerendered_routes: new Set(["/pitch-training/","/pitch-training/microphone-test-simple","/pitch-training/microphone-test","/pitch-training/scoring-test","/pitch-training/training/chromatic","/pitch-training/training/continuous","/pitch-training/training/random"]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
