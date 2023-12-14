import { DBTable } from "types/mdb";

export const CacheDBSchema : DBTable = {uniques: ['path'], cols: ["path", "cache", 'version'], rows: []}