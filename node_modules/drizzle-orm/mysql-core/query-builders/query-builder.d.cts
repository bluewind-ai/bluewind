import { entityKind } from "../../entity.cjs";
import type { MySqlDialectConfig } from "../dialect.cjs";
import { MySqlDialect } from "../dialect.cjs";
import type { WithSubqueryWithSelection } from "../subquery.cjs";
import type { TypedQueryBuilder } from "../../query-builders/query-builder.cjs";
import type { ColumnsSelection } from "../../sql/sql.cjs";
import { WithSubquery } from "../../subquery.cjs";
import { MySqlSelectBuilder } from "./select.cjs";
import type { SelectedFields } from "./select.types.cjs";
export declare class QueryBuilder {
    static readonly [entityKind]: string;
    private dialect;
    private dialectConfig;
    constructor(dialect?: MySqlDialect | MySqlDialectConfig);
    $with<TAlias extends string>(alias: TAlias): {
        as<TSelection extends ColumnsSelection>(qb: TypedQueryBuilder<TSelection> | ((qb: QueryBuilder) => TypedQueryBuilder<TSelection>)): WithSubqueryWithSelection<TSelection, TAlias>;
    };
    with(...queries: WithSubquery[]): {
        select: {
            (): MySqlSelectBuilder<undefined, never, "qb">;
            <TSelection extends SelectedFields>(fields: TSelection): MySqlSelectBuilder<TSelection, never, "qb">;
        };
        selectDistinct: {
            (): MySqlSelectBuilder<undefined, never, "qb">;
            <TSelection extends SelectedFields>(fields: TSelection): MySqlSelectBuilder<TSelection, never, "qb">;
        };
    };
    select(): MySqlSelectBuilder<undefined, never, 'qb'>;
    select<TSelection extends SelectedFields>(fields: TSelection): MySqlSelectBuilder<TSelection, never, 'qb'>;
    selectDistinct(): MySqlSelectBuilder<undefined, never, 'qb'>;
    selectDistinct<TSelection extends SelectedFields>(fields: TSelection): MySqlSelectBuilder<TSelection, never, 'qb'>;
    private getDialect;
}
