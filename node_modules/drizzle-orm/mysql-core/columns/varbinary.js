import { entityKind } from "../../entity.js";
import { getColumnNameAndConfig } from "../../utils.js";
import { MySqlColumn, MySqlColumnBuilder } from "./common.js";
class MySqlVarBinaryBuilder extends MySqlColumnBuilder {
  static [entityKind] = "MySqlVarBinaryBuilder";
  /** @internal */
  constructor(name, config) {
    super(name, "string", "MySqlVarBinary");
    this.config.length = config?.length;
  }
  /** @internal */
  build(table) {
    return new MySqlVarBinary(
      table,
      this.config
    );
  }
}
class MySqlVarBinary extends MySqlColumn {
  static [entityKind] = "MySqlVarBinary";
  length = this.config.length;
  getSQLType() {
    return this.length === void 0 ? `varbinary` : `varbinary(${this.length})`;
  }
}
function varbinary(a, b) {
  const { name, config } = getColumnNameAndConfig(a, b);
  return new MySqlVarBinaryBuilder(name, config);
}
export {
  MySqlVarBinary,
  MySqlVarBinaryBuilder,
  varbinary
};
//# sourceMappingURL=varbinary.js.map