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
		client: {start:"_app/immutable/entry/start.BLDDk557.js",app:"_app/immutable/entry/app._q7CWaAV.js",imports:["_app/immutable/entry/start.BLDDk557.js","_app/immutable/chunks/DeSIqWoX.js","_app/immutable/chunks/BbQtw8CC.js","_app/immutable/entry/app._q7CWaAV.js","_app/immutable/chunks/C1FmrZbK.js","_app/immutable/chunks/BbQtw8CC.js","_app/immutable/chunks/IHki7fMi.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
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
		prerendered_routes: new Set(["/pitch-training/","/pitch-training/microphone-test"]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
