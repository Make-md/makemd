import { parseFlexValue } from "core/schemas/parseFieldValue";
import { formatDate, parseDate } from "core/utils/date";
import { median } from "mathjs";
import { SpaceProperty } from "shared/types/mdb";
import { MakeMDSettings } from "shared/types/settings";
import { uniq } from "shared/utils/array";
import { safelyParseJSON } from "shared/utils/json";
import { parseProperty } from "utils/parsers";
import { empty } from "./filter";

export type AggregateFunctionType = {
    type: string;
    fn: (v: any[], type: string) => any;
    valueType: string;
};

export const calculateAggregate = (settings: MakeMDSettings, values: any[], fn: string, col: SpaceProperty) => {
    const aggregateFn = aggregateFnTypes[fn];
    if (!aggregateFn) {
        return null;
    }
    if (col.type == 'flex') {
        values = values.map((v) => {
            const parsed = parseFlexValue(v);
            return parsed.value;
        });
    }
    const type = aggregateFn.type;
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
            result = formatDate(settings, parseDate(calcResult), format);
        } else if (aggregateFn.valueType == 'number') {
            result = calcResult.toString();
        } else {
            result = calcResult ?? '';
        }
        result = parseProperty("", result, aggregateFn.valueType)
        if (typeof result != "string") {
            result = ''
		}
    } catch (e) {
        result = '';
        console.error(e);
    }

    return result

}

export const aggregateFnTypes: Record<string, AggregateFunctionType> = {
    values: {
        type: 'any',
        fn: (v) => uniq(v.map(f => parseProperty("", f))).join(", "),
        valueType: "none",
    },
    sum: {
        type: "number",
        fn: (v) => v.map(f => parseFloat(f)).filter(f => !isNaN(f)).reduce((a, b) => b ? a + b : a, 0),
        valueType: "number",
    },
    avg: {
        type: "number",
        fn: (v) => {
            const filtered = v.map(f => parseFloat(f)).filter((f) => !isNaN(f));
            return filtered.reduce((a, b) => a + b, 0) / filtered.length
        },
        valueType: "number",
    },
    median: {
        type: "number",
        fn: (v) => {
            const filtered = v.map(f => parseFloat(f)).filter((f) => !isNaN(f));
            return median(filtered)
        },
        valueType: "number",
    },
    count: {
        type: 'any',
        fn: (v) => v.length,
        valueType: "number",
    },
    countValues: {
        type: 'any',
        fn: (v) => v.flat().length,
        valueType: "number",
    },
    countUniques: {
        type: 'any',
        fn: (v) => new Set(v.flat()).size,
        valueType: "number",
    },
    percentageEmpty: {
        type: 'any',
        fn: (v) => Math.round(v.filter((f) => empty(f, '')).length / v.length * 100) + "%",
        valueType: "string",
    },
    percentageNotEmpty: {
        type: 'any',
        fn: (v) => Math.round(v.filter((f) => !empty(f, '')).length / v.length * 100) + "%",
        valueType: "string",
    },
    min: {
        type: "number",
        fn: (v) => Math.min(...v.map(f => parseFloat(f)).filter(f => !isNaN(f))),
        valueType: "number",
    },
    max: {
        type: "number",
        fn: (v) => Math.max(...v.map(f => parseFloat(f)).filter(f => !isNaN(f))),
        valueType: "number",
    },
    range: {
        type: "number",
        fn: (v) => Math.max(...v.map(f => parseFloat(f)).filter(f => !isNaN(f))) - Math.min(...v.filter(f => !isNaN(f))),
        valueType: "number",
    },
    empty: {
        type: 'any',
        fn: (v) => v.filter((f) => empty(f, '')).length,
        valueType: "none",
    },
    notEmpty: {
        type: 'any',
        fn: (v) => v.filter((f) => !empty(f, '')).length,
        valueType: "none",
    },
    earliest: {
        type: "date",
        fn: (v) => new Date(Math.min(...v.map((f) => f.getTime()))),
        valueType: "date",
    },
    latest: {
        type: "date",
        fn: (v) => new Date(Math.max(...v.map((f) => f.getTime()))),
        valueType: "date",
    },
    complete: {
        type: 'boolean',
        fn: (v) => v.filter((f) => f == 'true').length,
        valueType: "number",
    },
    incomplete: {
        type: 'boolean',
        fn: (v) => v.filter((f) => f != 'true').length,
        valueType: "number",
    },
    percentageComplete: {
        type: 'boolean',
        fn: (v) => Math.round(v.filter((f) => f == 'true').length / v.length * 100) + "%",
        valueType: "string",
    },
    dateRange: {
        type: "date",
        fn: (v) => {
            const dates = v.map((f) => f.getTime());
            return Math.max(...dates) - Math.min(...dates);
        },
        valueType: "duration",
    }
};
