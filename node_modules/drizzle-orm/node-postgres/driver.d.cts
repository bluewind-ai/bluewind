import { type Pool, type PoolConfig } from 'pg';
import { entityKind } from "../entity.cjs";
import type { Logger } from "../logger.cjs";
import { PgDatabase } from "../pg-core/db.cjs";
import { PgDialect } from "../pg-core/dialect.cjs";
import { type RelationalSchemaConfig, type TablesRelationalConfig } from "../relations.cjs";
import { type DrizzleConfig, type IfNotImported, type ImportTypeError } from "../utils.cjs";
import type { NodePgClient, NodePgQueryResultHKT } from "./session.cjs";
import { NodePgSession } from "./session.cjs";
export interface PgDriverOptions {
    logger?: Logger;
}
export declare class NodePgDriver {
    private client;
    private dialect;
    private options;
    static readonly [entityKind]: string;
    constructor(client: NodePgClient, dialect: PgDialect, options?: PgDriverOptions);
    createSession(schema: RelationalSchemaConfig<TablesRelationalConfig> | undefined): NodePgSession<Record<string, unknown>, TablesRelationalConfig>;
}
export declare class NodePgDatabase<TSchema extends Record<string, unknown> = Record<string, never>> extends PgDatabase<NodePgQueryResultHKT, TSchema> {
    static readonly [entityKind]: string;
}
export declare function drizzle<TSchema extends Record<string, unknown> = Record<string, never>, TClient extends NodePgClient = Pool>(...params: IfNotImported<Pool, [
    ImportTypeError<'@types/pg` `pg'>
], [
    TClient | string
] | [
    TClient | string,
    DrizzleConfig<TSchema>
] | [
    (DrizzleConfig<TSchema> & ({
        connection: string | PoolConfig;
    } | {
        client: TClient;
    }))
]>): NodePgDatabase<TSchema> & {
    $client: TClient;
};
export declare namespace drizzle {
    function mock<TSchema extends Record<string, unknown> = Record<string, never>>(config?: DrizzleConfig<TSchema>): NodePgDatabase<TSchema> & {
        $client: '$client is not available on drizzle.mock()';
    };
}
