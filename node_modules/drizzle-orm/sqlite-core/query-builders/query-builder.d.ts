import { entityKind } from "../../entity.js";
import type { TypedQueryBuilder } from "../../query-builders/query-builder.js";
import type { ColumnsSelection } from "../../sql/sql.js";
import type { SQLiteDialectConfig } from "../dialect.js";
import { SQLiteDialect } from "../dialect.js";
import type { WithSubqueryWithSelection } from "../subquery.js";
import { WithSubquery } from "../../subquery.js";
import { SQLiteSelectBuilder } from "./select.js";
import type { SelectedFields } from "./select.types.js";
export declare class QueryBuilder {
    static readonly [entityKind]: string;
    private dialect;
    private dialectConfig;
    constructor(dialect?: SQLiteDialect | SQLiteDialectConfig);
    $with<TAlias extends string>(alias: TAlias): {
        as<TSelection extends ColumnsSelection>(qb: TypedQueryBuilder<TSelection> | ((qb: QueryBuilder) => TypedQueryBuilder<TSelection>)): WithSubqueryWithSelection<TSelection, TAlias>;
    };
    with(...queries: WithSubquery[]): {
        select: {
            (): SQLiteSelectBuilder<undefined, "sync", void, "qb">;
            <TSelection extends SelectedFields>(fields: TSelection): SQLiteSelectBuilder<TSelection, "sync", void, "qb">;
        };
        selectDistinct: {
            (): SQLiteSelectBuilder<undefined, "sync", void, "qb">;
            <TSelection extends SelectedFields>(fields: TSelection): SQLiteSelectBuilder<TSelection, "sync", void, "qb">;
        };
    };
    select(): SQLiteSelectBuilder<undefined, 'sync', void, 'qb'>;
    select<TSelection extends SelectedFields>(fields: TSelection): SQLiteSelectBuilder<TSelection, 'sync', void, 'qb'>;
    selectDistinct(): SQLiteSelectBuilder<undefined, 'sync', void, 'qb'>;
    selectDistinct<TSelection extends SelectedFields>(fields: TSelection): SQLiteSelectBuilder<TSelection, 'sync', void, 'qb'>;
    private getDialect;
}
