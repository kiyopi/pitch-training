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
		client: {start:"_app/immutable/entry/start.t0x4OzmW.js",app:"_app/immutable/entry/app.DkWQip7x.js",imports:["_app/immutable/entry/start.t0x4OzmW.js","_app/immutable/chunks/ByknBuWU.js","_app/immutable/chunks/DXfV3yLF.js","_app/immutable/entry/app.DkWQip7x.js","_app/immutable/chunks/C1FmrZbK.js","_app/immutable/chunks/DXfV3yLF.js","_app/immutable/chunks/BnpKoSs-.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/4.js')),
			__memo(() => import('./nodes/5.js')),
			__memo(() => import('./nodes/6.js'))
		],
		routes: [
			{
				id: "/training/chromatic",
				pattern: /^\/training\/chromatic\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			},
			{
				id: "/training/continuous",
				pattern: /^\/training\/continuous\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 3 },
				endpoint: null
			},
			{
				id: "/training/random",
				pattern: /^\/training\/random\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 4 },
				endpoint: null
			}
		],
		prerendered_routes: new Set(["/","/microphone-test"]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
