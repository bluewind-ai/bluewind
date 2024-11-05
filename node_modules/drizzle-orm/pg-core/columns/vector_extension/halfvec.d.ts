import type { ColumnBuilderBaseConfig } from "../../../column-builder.js";
import type { ColumnBaseConfig } from "../../../column.js";
import { entityKind } from "../../../entity.js";
import { PgColumn, PgColumnBuilder } from "../common.js";
export type PgHalfVectorBuilderInitial<TName extends string> = PgHalfVectorBuilder<{
    name: TName;
    dataType: 'array';
    columnType: 'PgHalfVector';
    data: number[];
    driverParam: string;
    enumValues: undefined;
    generated: undefined;
}>;
export declare class PgHalfVectorBuilder<T extends ColumnBuilderBaseConfig<'array', 'PgHalfVector'>> extends PgColumnBuilder<T, {
    dimensions: number | undefined;
}> {
    static readonly [entityKind]: string;
    constructor(name: string, config: PgHalfVectorConfig);
}
export declare class PgHalfVector<T extends ColumnBaseConfig<'array', 'PgHalfVector'>> extends PgColumn<T, {
    dimensions: number | undefined;
}> {
    static readonly [entityKind]: string;
    readonly dimensions: number | undefined;
    getSQLType(): string;
    mapToDriverValue(value: unknown): unknown;
    mapFromDriverValue(value: string): unknown;
}
export interface PgHalfVectorConfig {
    dimensions: number;
}
export declare function halfvec(config: PgHalfVectorConfig): PgHalfVectorBuilderInitial<''>;
export declare function halfvec<TName extends string>(name: TName, config: PgHalfVectorConfig): PgHalfVectorBuilderInitial<TName>;
