import { PgTable } from "./table.js";
import { Table } from "../table.js";
import { type Check } from "./checks.js";
import type { AnyPgColumn } from "./columns/index.js";
import { type ForeignKey } from "./foreign-keys.js";
import type { Index } from "./indexes.js";
import { PgPolicy } from "./policies.js";
import { type PrimaryKey } from "./primary-keys.js";
import { type UniqueConstraint } from "./unique-constraint.js";
import { type PgMaterializedView, type PgView } from "./view.js";
export declare function getTableConfig<TTable extends PgTable>(table: TTable): {
    columns: import("./index.js").PgColumn<import("../column.js").ColumnBaseConfig<import("../column-builder.js").ColumnDataType, string>, {}, {}>[];
    indexes: Index[];
    foreignKeys: ForeignKey[];
    checks: Check[];
    primaryKeys: PrimaryKey[];
    uniqueConstraints: UniqueConstraint[];
    name: string;
    schema: string | undefined;
    policies: PgPolicy[];
    enableRLS: boolean;
};
export declare function getViewConfig<TName extends string = string, TExisting extends boolean = boolean>(view: PgView<TName, TExisting>): {
    with?: import("./view.js").ViewWithConfig;
    name: TName;
    originalName: TName;
    schema: string | undefined;
    selectedFields: import("../operations.js").SelectedFields<import("../column.js").AnyColumn, Table>;
    isExisting: TExisting;
    query: TExisting extends true ? undefined : import("../index.js").SQL<unknown>;
    isAlias: boolean;
};
export declare function getMaterializedViewConfig<TName extends string = string, TExisting extends boolean = boolean>(view: PgMaterializedView<TName, TExisting>): {
    with?: import("./view.js").PgMaterializedViewWithConfig;
    using?: string;
    tablespace?: string;
    withNoData?: boolean;
    name: TName;
    originalName: TName;
    schema: string | undefined;
    selectedFields: import("../operations.js").SelectedFields<import("../column.js").AnyColumn, Table>;
    isExisting: TExisting;
    query: TExisting extends true ? undefined : import("../index.js").SQL<unknown>;
    isAlias: boolean;
};
export type ColumnsWithTable<TTableName extends string, TForeignTableName extends string, TColumns extends AnyPgColumn<{
    tableName: TTableName;
}>[]> = {
    [Key in keyof TColumns]: AnyPgColumn<{
        tableName: TForeignTableName;
    }>;
};
