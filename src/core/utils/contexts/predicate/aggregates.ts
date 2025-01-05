import { formatDate, parseDate } from "core/utils/date";
import { Superstate } from "makemd-core";
import { median } from "mathjs";
import { fieldTypeForField } from "schemas/mdb";
import { SpaceProperty } from "shared/types/mdb";
import { uniq } from "shared/utils/array";
import { safelyParseJSON } from "shared/utils/json";
import { parseProperty } from "utils/parsers";
import { empty } from "./filter";

export type AggregateFunctionType = {
    label: string;
    shortLabel?: string;
    type: string[];
    fn: (v: any[], type: string) => any;
    valueType: string;
    
};

export const calculateAggregate = (superstate: Superstate, values: any[], fn: string, col: SpaceProperty) => {
    const aggregateFn = aggregateFnTypes[fn];
    if (!aggregateFn) {
        return null;
    }
    const type = fieldTypeForField(col)
    let result = '';
    try {
        
        if (type == 'number') {
            values = values.map((v) => parseFloat(v));
        }
        if (type == 'date') {
            values = values.map((v) => new Date(v));
        }
        const calcResult = aggregateFn.fn(values, col.type);
        if (aggregateFn.valueType == 'date') {
            const format = safelyParseJSON(col.value)?.format
            result = formatDate(superstate, parseDate(calcResult), format);
        } else {
            result = calcResult ?? '';
        }
        
    } catch (e) {
        console.error(e);
    }

    return result

}

export const aggregateFnTypes: Record<string, AggregateFunctionType> = {
    values: {
        label: "Values",
        type: ['any'],
        fn: (v) => uniq(v.map(f => parseProperty("", f))).join(", "),
        valueType: "none",
    },
    sum: {
        label: "Sum",
        type: ["number"],
        fn: (v) => v.filter(f => !isNaN(f)).reduce((a, b) => b ? a + b : a, 0),
        valueType: "number",
    },
    avg: {
        label: "Average",
        type: ["number"],
        fn: (v) => {
            const filtered = v.filter((f) => !isNaN(f));
            return filtered.reduce((a, b) => a + b, 0) / filtered.length
        },
        valueType: "number",
    },
    median: {
        label: "Median",
        type: ["number"],
        fn: (v) => {
            const filtered = v.filter((f) => !isNaN(f));
            return median(filtered)
        },
        valueType: "number",
    },
    count: {
        label: "Count",
        type: ['any'],
        fn: (v) => v.length,
        valueType: "number",
    },
    countValues: {
        label: "Count Values",
        shortLabel: "Values",
        type: ['any'],
        fn: (v) => v.flat().length,
        valueType: "number",
    },
    countUniques: {
        label: "Count Uniques",
        shortLabel: "Uniques",
        type: ['any'],
        fn: (v) => new Set(v.flat()).size,
        valueType: "number",
    },
    percentageEmpty: {
        label: "Percentage Empty",
        shortLabel: "Empty",
        type: ['any'],
        fn: (v) => v.filter((f) => empty(f, '')).length / v.length * 100 + "%",
        valueType: "string",
    },
    percentageNotEmpty: {
        label: "Percentage Not Empty",
        shortLabel: "Not Empty",
        type: ['any'],
        fn: (v) => v.filter((f) => !empty(f, '')).length / v.length * 100 + "%",
        valueType: "string",
    },
    min: {
        label: "Min",
        type: ["number"],
        fn: (v) => Math.min(...v.filter(f => !isNaN(f))),
        valueType: "number",
    },
    max: {
        label: "Max",
        type: ["number"],
        fn: (v, f) => Math.max(...v.filter(f => !isNaN(f))),
        valueType: "number",
    },
    range: {
        label: "Range",
        type: ["number"],
        fn: (v) => Math.max(...v.filter(f => !isNaN(f))) - Math.min(...v.filter(f => !isNaN(f))),
        valueType: "number",
    },
    empty: {
        label: "Empty",
        type: ['any'],
        fn: (v) => v.filter((f) => empty(f, '')).length,
        valueType: "none",
    },
    notEmpty: {
        label: "Not Empty",
        type: ['any'],
        fn: (v) => v.filter((f) => !empty(f, '')).length,
        valueType: "none",
    },
    earliest: {
        label: "Earliest",
        type: ["date"],
        fn: (v) => new Date(Math.min(...v.map((f) => f.getTime()))),
        valueType: "date",
    },
    latest: {
        label: "Latest",
        type: ["date"],
        fn: (v) => new Date(Math.max(...v.map((f) => f.getTime()))),
        valueType: "date",
    },
    dateRange: {
        label: "Date Range",
        shortLabel: "Range",
        type: ["date"],
        fn: (v) => {
            const dates = v.map((f) => f.getTime());
            return Math.max(...dates) - Math.min(...dates);
        },
        valueType: "duration",
    }
};
