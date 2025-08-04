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
		client: {start:"_app/immutable/entry/start.BpMl_83d.js",app:"_app/immutable/entry/app.-53tE3YS.js",imports:["_app/immutable/entry/start.BpMl_83d.js","_app/immutable/chunks/BdXTrSTr.js","_app/immutable/chunks/CJUHymq1.js","_app/immutable/entry/app.-53tE3YS.js","_app/immutable/chunks/CJUHymq1.js","_app/immutable/chunks/IHki7fMi.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/5.js'))
		],
		routes: [
			{
				id: "/training/continuous",
				pattern: /^\/training\/continuous\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			}
		],
		prerendered_routes: new Set(["/pitch-training/","/pitch-training/microphone-test","/pitch-training/training/chromatic","/pitch-training/training/random"]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
