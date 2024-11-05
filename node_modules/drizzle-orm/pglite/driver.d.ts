import { PGlite, type PGliteOptions } from '@electric-sql/pglite';
import { entityKind } from "../entity.js";
import type { Logger } from "../logger.js";
import { PgDatabase } from "../pg-core/db.js";
import { PgDialect } from "../pg-core/dialect.js";
import { type RelationalSchemaConfig, type TablesRelationalConfig } from "../relations.js";
import { type DrizzleConfig, type IfNotImported, type ImportTypeError } from "../utils.js";
import type { PgliteClient, PgliteQueryResultHKT } from "./session.js";
import { PgliteSession } from "./session.js";
export interface PgDriverOptions {
    logger?: Logger;
}
export declare class PgliteDriver {
    private client;
    private dialect;
    private options;
    static readonly [entityKind]: string;
    constructor(client: PgliteClient, dialect: PgDialect, options?: PgDriverOptions);
    createSession(schema: RelationalSchemaConfig<TablesRelationalConfig> | undefined): PgliteSession<Record<string, unknown>, TablesRelationalConfig>;
}
export declare class PgliteDatabase<TSchema extends Record<string, unknown> = Record<string, never>> extends PgDatabase<PgliteQueryResultHKT, TSchema> {
    static readonly [entityKind]: string;
}
export declare function drizzle<TSchema extends Record<string, unknown> = Record<string, never>, TClient extends PGlite = PGlite>(...params: IfNotImported<PGlite, [
    ImportTypeError<'@electric-sql/pglite'>
], [] | [
    TClient | string
] | [
    TClient | string,
    DrizzleConfig<TSchema>
] | [
    (DrizzleConfig<TSchema> & ({
        connection?: (PGliteOptions & {
            dataDir?: string;
        }) | string;
    } | {
        client: TClient;
    }))
]>): PgliteDatabase<TSchema> & {
    $client: TClient;
};
export declare namespace drizzle {
    function mock<TSchema extends Record<string, unknown> = Record<string, never>>(config?: DrizzleConfig<TSchema>): PgliteDatabase<TSchema> & {
        $client: '$client is not available on drizzle.mock()';
    };
}
