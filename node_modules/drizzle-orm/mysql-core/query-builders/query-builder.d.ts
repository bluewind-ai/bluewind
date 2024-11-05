import { entityKind } from "../../entity.js";
import type { MySqlDialectConfig } from "../dialect.js";
import { MySqlDialect } from "../dialect.js";
import type { WithSubqueryWithSelection } from "../subquery.js";
import type { TypedQueryBuilder } from "../../query-builders/query-builder.js";
import type { ColumnsSelection } from "../../sql/sql.js";
import { WithSubquery } from "../../subquery.js";
import { MySqlSelectBuilder } from "./select.js";
import type { SelectedFields } from "./select.types.js";
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
