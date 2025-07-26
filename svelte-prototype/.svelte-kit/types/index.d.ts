type DynamicRoutes = {
	
};

type Layouts = {
	"/": undefined;
	"/microphone-test-simple": undefined;
	"/microphone-test": undefined;
	"/training": undefined;
	"/training/chromatic": undefined;
	"/training/continuous": undefined;
	"/training/random": undefined
};

export type RouteId = "/" | "/microphone-test-simple" | "/microphone-test" | "/training" | "/training/chromatic" | "/training/continuous" | "/training/random";

export type RouteParams<T extends RouteId> = T extends keyof DynamicRoutes ? DynamicRoutes[T] : Record<string, never>;

export type LayoutParams<T extends RouteId> = Layouts[T] | Record<string, never>;

export type Pathname = "/" | "/microphone-test-simple" | "/microphone-test" | "/training" | "/training/chromatic" | "/training/continuous" | "/training/random";

export type ResolvedPathname = `${"" | `/${string}`}${Pathname}`;

export type Asset = "/audio/piano/Ab4.mp3" | "/audio/piano/B3.mp3" | "/audio/piano/Bb3.mp3" | "/audio/piano/C4.mp3" | "/audio/piano/D4.mp3" | "/audio/piano/Db4.mp3" | "/audio/piano/E4.mp3" | "/audio/piano/Eb4.mp3" | "/audio/piano/F4.mp3" | "/audio/piano/Gb4.mp3";