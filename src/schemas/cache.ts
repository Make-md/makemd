import { DBTable } from "shared/types/mdb";

export const CacheDBSchema : DBTable = {uniques: ['path'], cols: ["path", "cache", 'version'], rows: []}