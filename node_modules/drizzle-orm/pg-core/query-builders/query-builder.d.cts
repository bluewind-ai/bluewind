import { entityKind } from "../../entity.cjs";
import type { PgDialectConfig } from "../dialect.cjs";
import { PgDialect } from "../dialect.cjs";
import type { TypedQueryBuilder } from "../../query-builders/query-builder.cjs";
import type { ColumnsSelection, SQLWrapper } from "../../sql/sql.cjs";
import { WithSubquery } from "../../subquery.cjs";
import type { PgColumn } from "../columns/index.cjs";
import type { WithSubqueryWithSelection } from "../subquery.cjs";
import { PgSelectBuilder } from "./select.cjs";
import type { SelectedFields } from "./select.types.cjs";
export declare class QueryBuilder {
    static readonly [entityKind]: string;
    private dialect;
    private dialectConfig;
    constructor(dialect?: PgDialect | PgDialectConfig);
    $with<TAlias extends string>(alias: TAlias): {
        as<TSelection extends ColumnsSelection>(qb: TypedQueryBuilder<TSelection> | ((qb: QueryBuilder) => TypedQueryBuilder<TSelection>)): WithSubqueryWithSelection<TSelection, TAlias>;
    };
    with(...queries: WithSubquery[]): {
        select: {
            (): PgSelectBuilder<undefined, "qb">;
            <TSelection extends SelectedFields>(fields: TSelection): PgSelectBuilder<TSelection, "qb">;
        };
        selectDistinct: {
            (): PgSelectBuilder<undefined, "qb">;
            <TSelection extends SelectedFields>(fields: TSelection): PgSelectBuilder<TSelection, "qb">;
        };
        selectDistinctOn: {
            (on: (PgColumn | SQLWrapper)[]): PgSelectBuilder<undefined, "qb">;
            <TSelection extends SelectedFields>(on: (PgColumn | SQLWrapper)[], fields: TSelection): PgSelectBuilder<TSelection, "qb">;
        };
    };
    select(): PgSelectBuilder<undefined, 'qb'>;
    select<TSelection extends SelectedFields>(fields: TSelection): PgSelectBuilder<TSelection, 'qb'>;
    selectDistinct(): PgSelectBuilder<undefined>;
    selectDistinct<TSelection extends SelectedFields>(fields: TSelection): PgSelectBuilder<TSelection>;
    selectDistinctOn(on: (PgColumn | SQLWrapper)[]): PgSelectBuilder<undefined>;
    selectDistinctOn<TSelection extends SelectedFields>(on: (PgColumn | SQLWrapper)[], fields: TSelection): PgSelectBuilder<TSelection>;
    private getDialect;
}
