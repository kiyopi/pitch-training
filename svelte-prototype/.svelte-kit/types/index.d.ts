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

export type Asset = never;