import type { ColumnBuilderBaseConfig } from "../../column-builder.cjs";
import type { ColumnBaseConfig } from "../../column.cjs";
import { entityKind } from "../../entity.cjs";
import { type Writable } from "../../utils.cjs";
import { MySqlColumn, MySqlColumnBuilder } from "./common.cjs";
export type MySqlVarCharBuilderInitial<TName extends string, TEnum extends [string, ...string[]]> = MySqlVarCharBuilder<{
    name: TName;
    dataType: 'string';
    columnType: 'MySqlVarChar';
    data: TEnum[number];
    driverParam: number | string;
    enumValues: TEnum;
    generated: undefined;
}>;
export declare class MySqlVarCharBuilder<T extends ColumnBuilderBaseConfig<'string', 'MySqlVarChar'>> extends MySqlColumnBuilder<T, MySqlVarCharConfig<T['enumValues']>> {
    static readonly [entityKind]: string;
}
export declare class MySqlVarChar<T extends ColumnBaseConfig<'string', 'MySqlVarChar'>> extends MySqlColumn<T, MySqlVarCharConfig<T['enumValues']>> {
    static readonly [entityKind]: string;
    readonly length: number | undefined;
    readonly enumValues: T["enumValues"] | undefined;
    getSQLType(): string;
}
export interface MySqlVarCharConfig<TEnum extends string[] | readonly string[] | undefined = string[] | readonly string[] | undefined> {
    length: number;
    enum?: TEnum;
}
export declare function varchar<U extends string, T extends Readonly<[U, ...U[]]>>(config: MySqlVarCharConfig<T | Writable<T>>): MySqlVarCharBuilderInitial<'', Writable<T>>;
export declare function varchar<TName extends string, U extends string, T extends Readonly<[U, ...U[]]>>(name: TName, config: MySqlVarCharConfig<T | Writable<T>>): MySqlVarCharBuilderInitial<TName, Writable<T>>;
