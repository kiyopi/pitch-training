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
		client: {start:"_app/immutable/entry/start.CgHz-zmP.js",app:"_app/immutable/entry/app.DjKYjyJe.js",imports:["_app/immutable/entry/start.CgHz-zmP.js","_app/immutable/chunks/B2DYUtMk.js","_app/immutable/chunks/DkMTtSlo.js","_app/immutable/entry/app.DjKYjyJe.js","_app/immutable/chunks/C1FmrZbK.js","_app/immutable/chunks/DkMTtSlo.js","_app/immutable/chunks/Dl4NPMRd.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/3.js')),
			__memo(() => import('./nodes/8.js'))
		],
		routes: [
			{
				id: "/microphone-test",
				pattern: /^\/microphone-test\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			},
			{
				id: "/training/random",
				pattern: /^\/training\/random\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 3 },
				endpoint: null
			}
		],
		prerendered_routes: new Set(["/","/microphone-test-simple","/scoring-test","/training/chromatic","/training/continuous"]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
