declare const prefixes: readonly ["index", "timestamp", "supabase", "unix", "none"];
type Prefix = (typeof prefixes)[number];
declare const casingTypes: readonly ["snake_case", "camelCase"];
type CasingType = (typeof casingTypes)[number];
declare const drivers: readonly ["d1-http", "expo", "aws-data-api", "pglite"];
type Driver = (typeof drivers)[number];

export type { CasingType as C, Driver as D, Prefix as P };
