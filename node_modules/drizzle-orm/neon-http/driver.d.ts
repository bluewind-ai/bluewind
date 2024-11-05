import type { HTTPTransactionOptions, NeonQueryFunction } from '@neondatabase/serverless';
import type { BatchItem, BatchResponse } from "../batch.js";
import { entityKind } from "../entity.js";
import type { Logger } from "../logger.js";
import { PgDatabase } from "../pg-core/db.js";
import { PgDialect } from "../pg-core/dialect.js";
import type { RelationalSchemaConfig, TablesRelationalConfig } from "../relations.js";
import { type DrizzleConfig, type IfNotImported, type ImportTypeError } from "../utils.js";
import { type NeonHttpClient, type NeonHttpQueryResultHKT, NeonHttpSession } from "./session.js";
export interface NeonDriverOptions {
    logger?: Logger;
}
export declare class NeonHttpDriver {
    private client;
    private dialect;
    private options;
    static readonly [entityKind]: string;
    constructor(client: NeonHttpClient, dialect: PgDialect, options?: NeonDriverOptions);
    createSession(schema: RelationalSchemaConfig<TablesRelationalConfig> | undefined): NeonHttpSession<Record<string, unknown>, TablesRelationalConfig>;
    initMappers(): void;
}
export declare class NeonHttpDatabase<TSchema extends Record<string, unknown> = Record<string, never>> extends PgDatabase<NeonHttpQueryResultHKT, TSchema> {
    static readonly [entityKind]: string;
    batch<U extends BatchItem<'pg'>, T extends Readonly<[U, ...U[]]>>(batch: T): Promise<BatchResponse<T>>;
}
export declare function drizzle<TSchema extends Record<string, unknown> = Record<string, never>, TClient extends NeonQueryFunction<any, any> = NeonQueryFunction<false, false>>(...params: IfNotImported<HTTPTransactionOptions<boolean, boolean>, [
    ImportTypeError<'@neondatabase/serverless'>
], [
    TClient | string
] | [
    TClient | string,
    DrizzleConfig<TSchema>
] | [
    (DrizzleConfig<TSchema> & ({
        connection: string | ({
            connectionString: string;
        } & HTTPTransactionOptions<boolean, boolean>);
    } | {
        client: TClient;
    }))
]>): NeonHttpDatabase<TSchema> & {
    $client: TClient;
};
export declare namespace drizzle {
    function mock<TSchema extends Record<string, unknown> = Record<string, never>>(config?: DrizzleConfig<TSchema>): NeonHttpDatabase<TSchema> & {
        $client: '$client is not available on drizzle.mock()';
    };
}
