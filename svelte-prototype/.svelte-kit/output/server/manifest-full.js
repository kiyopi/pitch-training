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
		client: {start:"_app/immutable/entry/start.Q3hji9C0.js",app:"_app/immutable/entry/app.DEcc9s0h.js",imports:["_app/immutable/entry/start.Q3hji9C0.js","_app/immutable/chunks/CNdrBfjs.js","_app/immutable/chunks/Dujr-1LT.js","_app/immutable/entry/app.DEcc9s0h.js","_app/immutable/chunks/Dujr-1LT.js","_app/immutable/chunks/B_rl9Jj9.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/2.js')),
			__memo(() => import('./nodes/3.js')),
			__memo(() => import('./nodes/4.js')),
			__memo(() => import('./nodes/5.js')),
			__memo(() => import('./nodes/6.js')),
			__memo(() => import('./nodes/7.js'))
		],
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			},
			{
				id: "/microphone-test-simple",
				pattern: /^\/microphone-test-simple\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 4 },
				endpoint: null
			},
			{
				id: "/microphone-test",
				pattern: /^\/microphone-test\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 3 },
				endpoint: null
			},
			{
				id: "/training/chromatic",
				pattern: /^\/training\/chromatic\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 5 },
				endpoint: null
			},
			{
				id: "/training/continuous",
				pattern: /^\/training\/continuous\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 6 },
				endpoint: null
			},
			{
				id: "/training/random",
				pattern: /^\/training\/random\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 7 },
				endpoint: null
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
