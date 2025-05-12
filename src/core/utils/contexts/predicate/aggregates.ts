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
    label: string;
    shortLabel?: string;
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
        } else {
            result = calcResult ?? '';
        }
        result = parseProperty("", result)
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
        label: "Values",
        type: 'any',
        fn: (v) => uniq(v.map(f => parseProperty("", f))).join(", "),
        valueType: "none",
    },
    sum: {
        label: "Sum",
        type: "number",
        fn: (v) => v.map(f => parseFloat(f)).filter(f => !isNaN(f)).reduce((a, b) => b ? a + b : a, 0),
        valueType: "number",
    },
    avg: {
        label: "Average",
        type: "number",
        fn: (v) => {
            const filtered = v.map(f => parseFloat(f)).filter((f) => !isNaN(f));
            return filtered.reduce((a, b) => a + b, 0) / filtered.length
        },
        valueType: "number",
    },
    median: {
        label: "Median",
        type: "number",
        fn: (v) => {
            const filtered = v.map(f => parseFloat(f)).filter((f) => !isNaN(f));
            return median(filtered)
        },
        valueType: "number",
    },
    count: {
        label: "Count",
        type: 'any',
        fn: (v) => v.length,
        valueType: "number",
    },
    countValues: {
        label: "Count Values",
        shortLabel: "Values",
        type: 'any',
        fn: (v) => v.flat().length,
        valueType: "number",
    },
    countUniques: {
        label: "Count Uniques",
        shortLabel: "Uniques",
        type: 'any',
        fn: (v) => new Set(v.flat()).size,
        valueType: "number",
    },
    percentageEmpty: {
        label: "Percentage Empty",
        shortLabel: "Empty",
        type: 'any',
        fn: (v) => v.filter((f) => empty(f, '')).length / v.length * 100 + "%",
        valueType: "string",
    },
    percentageNotEmpty: {
        label: "Percentage Not Empty",
        shortLabel: "Not Empty",
        type: 'any',
        fn: (v) => v.filter((f) => !empty(f, '')).length / v.length * 100 + "%",
        valueType: "string",
    },
    min: {
        label: "Min",
        type: "number",
        fn: (v) => Math.min(...v.map(f => parseFloat(f)).filter(f => !isNaN(f))),
        valueType: "number",
    },
    max: {
        label: "Max",
        type: "number",
        fn: (v, f) => Math.max(...v.map(f => parseFloat(f)).filter(f => !isNaN(f))),
        valueType: "number",
    },
    range: {
        label: "Range",
        type: "number",
        fn: (v) => Math.max(...v.map(f => parseFloat(f)).filter(f => !isNaN(f))) - Math.min(...v.filter(f => !isNaN(f))),
        valueType: "number",
    },
    empty: {
        label: "Empty",
        type: 'any',
        fn: (v) => v.filter((f) => empty(f, '')).length,
        valueType: "none",
    },
    notEmpty: {
        label: "Not Empty",
        type: 'any',
        fn: (v) => v.filter((f) => !empty(f, '')).length,
        valueType: "none",
    },
    earliest: {
        label: "Earliest",
        type: "date",
        fn: (v) => new Date(Math.min(...v.map((f) => f.getTime()))),
        valueType: "date",
    },
    latest: {
        label: "Latest",
        type: "date",
        fn: (v) => new Date(Math.max(...v.map((f) => f.getTime()))),
        valueType: "date",
    },
    complete: {
        label: "Complete",
        type: 'boolean',
        fn: (v) => v.filter((f) => f == 'true').length,
        valueType: "number",
    },
    incomplete: {
        label: "Not Complete",
        type: 'boolean',
        fn: (v) => v.filter((f) => f != 'true').length,
        valueType: "number",
    },
    percentageComplete: {
        label: "Percentage Complete",
        shortLabel: "Complete",
        type: 'boolean',
        fn: (v) => v.filter((f) => f == 'true').length / v.length * 100 + "%",
        valueType: "string",
    },
    dateRange: {
        label: "Date Range",
        shortLabel: "Range",
        type: "date",
        fn: (v) => {
            const dates = v.map((f) => f.getTime());
            return Math.max(...dates) - Math.min(...dates);
        },
        valueType: "duration",
    }
};
