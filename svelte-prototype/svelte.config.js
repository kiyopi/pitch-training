import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: 'index.html',
			precompress: false,
			strict: false
		}),
		paths: {
			base: process.env.NODE_ENV === 'production' ? '/pitch-training' : ''
		},
		prerender: {
			handleHttpError: ({ path, referrer, message }) => {
				// faviconエラーとテスト系ページエラーを無視
				if (path.includes('favicon') || path.includes('scoring-components-test') || path.includes('scoring-test')) {
					return;
				}
				throw new Error(message);
			}
		},
		// CSS強制インライン化
		inlineStyleThreshold: 999999999
	}
};

export default config;