import { entityKind } from "../entity.cjs";
import { SQL, type SQLWrapper } from "../sql/sql.cjs";
import type { pgEnum } from "./columns/enum.cjs";
import { type pgSequence } from "./sequence.cjs";
import { type PgTableFn } from "./table.cjs";
import { type pgMaterializedView, type pgView } from "./view.cjs";
export declare class PgSchema<TName extends string = string> implements SQLWrapper {
    readonly schemaName: TName;
    static readonly [entityKind]: string;
    constructor(schemaName: TName);
    table: PgTableFn<TName>;
    view: typeof pgView;
    materializedView: typeof pgMaterializedView;
    enum: typeof pgEnum;
    sequence: typeof pgSequence;
    getSQL(): SQL;
    shouldOmitSQLParens(): boolean;
}
export declare function isPgSchema(obj: unknown): obj is PgSchema;
export declare function pgSchema<T extends string>(name: T): PgSchema<T>;
