import initSqlJs from "sql.js";
import sql_wasm from "sqljs/sql-wasm.wasm";

export const loadSQL = async () => {
  const sql = await initSqlJs({
    wasmBinary: sql_wasm,
  });
  return sql;
};
