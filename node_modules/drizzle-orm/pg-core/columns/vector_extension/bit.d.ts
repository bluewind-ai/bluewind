import type { ColumnBuilderBaseConfig } from "../../../column-builder.js";
import type { ColumnBaseConfig } from "../../../column.js";
import { entityKind } from "../../../entity.js";
import { PgColumn, PgColumnBuilder } from "../common.js";
export type PgBinaryVectorBuilderInitial<TName extends string> = PgBinaryVectorBuilder<{
    name: TName;
    dataType: 'string';
    columnType: 'PgBinaryVector';
    data: string;
    driverParam: string;
    enumValues: undefined;
    generated: undefined;
}>;
export declare class PgBinaryVectorBuilder<T extends ColumnBuilderBaseConfig<'string', 'PgBinaryVector'>> extends PgColumnBuilder<T, {
    dimensions: number | undefined;
}> {
    static readonly [entityKind]: string;
    constructor(name: string, config: PgBinaryVectorConfig);
}
export declare class PgBinaryVector<T extends ColumnBaseConfig<'string', 'PgBinaryVector'>> extends PgColumn<T, {
    dimensions: number | undefined;
}> {
    static readonly [entityKind]: string;
    readonly dimensions: number | undefined;
    getSQLType(): string;
}
export interface PgBinaryVectorConfig {
    dimensions: number;
}
export declare function bit(config: PgBinaryVectorConfig): PgBinaryVectorBuilderInitial<''>;
export declare function bit<TName extends string>(name: TName, config: PgBinaryVectorConfig): PgBinaryVectorBuilderInitial<TName>;
