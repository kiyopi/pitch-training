import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: undefined,
			precompress: false,
			strict: false
		}),
		paths: {
			base: process.env.NODE_ENV === 'production' ? '/pitch-training' : ''
		},
		prerender: {
			handleHttpError: ({ path, referrer, message }) => {
				// faviconエラーとmicrophone-testエラーを無視
				if (path.includes('favicon') || path.includes('microphone-test')) {
					return;
				}
				throw new Error(message);
			}
		}
	}
};

export default config;