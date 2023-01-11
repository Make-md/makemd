import sql_wasm from "sqljs/sql-wasm.wasm";
import initSqlJs from "sql.js";

export const loadSQL = async () => {
  const sql = await initSqlJs({
    wasmBinary: sql_wasm,
  });
  return sql;
};
