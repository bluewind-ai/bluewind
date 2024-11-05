import type { ColumnBuilderBaseConfig } from "../../column-builder.js";
import type { ColumnBaseConfig } from "../../column.js";
import { entityKind } from "../../entity.js";
import type { AnyPgTable } from "../table.js";
import { PgColumn, PgColumnBuilder } from "./common.js";
export type PgNumericBuilderInitial<TName extends string> = PgNumericBuilder<{
    name: TName;
    dataType: 'string';
    columnType: 'PgNumeric';
    data: string;
    driverParam: string;
    enumValues: undefined;
    generated: undefined;
}>;
export declare class PgNumericBuilder<T extends ColumnBuilderBaseConfig<'string', 'PgNumeric'>> extends PgColumnBuilder<T, {
    precision: number | undefined;
    scale: number | undefined;
}> {
    static readonly [entityKind]: string;
    constructor(name: T['name'], precision?: number, scale?: number);
}
export declare class PgNumeric<T extends ColumnBaseConfig<'string', 'PgNumeric'>> extends PgColumn<T> {
    static readonly [entityKind]: string;
    readonly precision: number | undefined;
    readonly scale: number | undefined;
    constructor(table: AnyPgTable<{
        name: T['tableName'];
    }>, config: PgNumericBuilder<T>['config']);
    getSQLType(): string;
}
export type PgNumericConfig = {
    precision: number;
    scale?: number;
} | {
    precision?: number;
    scale: number;
} | {
    precision: number;
    scale: number;
};
export declare function numeric(): PgNumericBuilderInitial<''>;
export declare function numeric(config?: PgNumericConfig): PgNumericBuilderInitial<''>;
export declare function numeric<TName extends string>(name: TName, config?: PgNumericConfig): PgNumericBuilderInitial<TName>;
export declare const decimal: typeof numeric;
