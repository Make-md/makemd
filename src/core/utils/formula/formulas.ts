import { PathState } from "core/types/superstate";
import { format as formatDate } from "date-fns";
import { MathNode, SymbolNode } from "mathjs";
import { uniq } from "utils/array";
import { parseMultiString } from "utils/parsers";
import { parseMDBStringValue } from "utils/properties";
import { parseDate } from "../date";

type ArgType = {
	name: string,
	types: string[],
	description?: string
}

export type FormulaInfo = {
	name: string,
	fn: string,
	args: ArgType[],
	returnType?: string,
	description: string,
	category: string,
	difficulty?: number
}

export const formulasInfos : Record<string, FormulaInfo> = {
	prop: {
		name: "prop",
		fn: "prop",
		args: [{name: 'property', types: ["text"]}],
		returnType: "any",
		description: "Get the value of a property",
		category: "Property",
		difficulty: 1
	},
	
	slice: {
		name: "slice",
		fn: "slice",
		args: [{name: 'text', types: ["text"]}, {name: 'start', types: ["number"]}, {name: 'end', types: ["number"]}],
		returnType: "text",
		description: "Get a part of a text",
		category: "String",
		difficulty: 1
	},
	if: {
		name: "if",
		fn: "if",
		args: [{name: 'condition', types: ["boolean"]}, {name: 'ifTrue', types: ["any"]}, {name: 'ifFalse', types: ["any"]}],
		returnType: "any",
		description: "If condition is true return the first argument else return the second",
		category: "Logic",
		difficulty: 2
	},
	ifs: {
		name: "ifs",
		fn: "ifs",
		args: [{name: 'condition', types: ["boolean"]}, {name: 'ifTrue', types: ["any"]},{name: '...', types: []}, {name: 'ifFalse', types: ["any"]}],
		returnType: "any",
		description: "If the first condition is true return the first argument else check the next condition",
		category: "Logic",
		difficulty: 2
	},
	empty: {
		name: "empty",
		fn: "empty",
		args: [{name: 'value', types: ["any"]}],
		returnType: "boolean",
		description: "Check if a list is empty",
		category: "String",
		difficulty: 1
	},
	length: {
		name: "length",
		fn: "length",
		args: [{name: 'list', types: ["any-multi"]}],
		returnType: "number",
		description: "Get the length of a list",
		category: "List",
		difficulty: 1
	},
	values: {
		name: "values",
		fn: "values",
		args: [{name: 'list', types: ["any-multi"]}],
		returnType: "number",
		description: "Get the number of values in a list",
		category: "List",
		difficulty: 1
	},
	uniques: {
		name: "uniques",
		fn: "uniques",
		args: [{name: 'list', types: ["any-list"]}],
		returnType: "number",
		description: "Get the number of unique values in a list",
		category: "List",
		difficulty: 1
	},
	substring: {
		name: "substring",
		fn: "substring",
		args: [{name: 'string', types: ["text"]}, {name: 'start', types: ["number"]}, {name: 'end', types: ["number"]}],
		returnType: "text",
		description: "Get a substring of a string",
		category: "String",
		difficulty: 2
	},
	startsWith: {
		name: "startsWith",
		fn: "startsWith",
		args: [{name: 'string', types: ["text"]}, {name: 'substring', types: ["text"]}],
		returnType: "boolean",
		description: "Check if a string starts with another string",
		category: "String",
		difficulty: 1
	},
	contains: {
		name: "contains",
		fn: "contains",
		args: [{name: 'string', types: ["text"]}, {name: 'substring', types: ["text"]}],
		returnType: "boolean",
		description: "Check if a string contains another string",
		category: "String",
		difficulty: 1
	},
	test: {
		name: "test",
		fn: "test",
		args: [{name: 'string', types: ["text"]}, {name: 'regex', types: ["text"]}],
		returnType: "boolean",
		description: "Test a string with a regex",
		category: "String",
		difficulty: 3
	},
	match: {
		name: "match",
		fn: "match",
		args: [{name: 'string', types: ["text"]}, {name: 'regex', types: ["text"]}],
		returnType: "boolean",
		description: "Match a string with a regex",
		category: "String",
		difficulty: 3
	},
	replace: {
		name: "replace",
		fn: "replace",
		args: [{name: 'string', types: ["text"]}, {name: 'search', types: ["text"]}, {name: 'replace', types: ["text"]}],
		returnType: "text",
		description: "Replace a string with another string",
		category: "String",
		difficulty: 1
	},
	replaceAll: {
		name: "replaceAll",
		fn: "replaceAll",
		args: [{name: 'string', types: ["text"]}, {name: 'search', types: ["text"]}, {name: 'replace', types: ["text"]}],
		returnType: "text",
		description: "Replace all occurences of a string with another string",
		category: "String",
		difficulty: 1
	},
	lower: {
		name: "lower",
		fn: "lower",
		args: [{name: 'string', types: ["text"]}],
		returnType: "text",
		description: "Convert a string to lowercase",
		category: "String",
		difficulty: 1
	},
	upper: {
		name: "upper",
		fn: "upper",
		args: [{name: 'string', types: ["text"]}],
		returnType: "text",
		description: "Convert a string to uppercase",
		category: "String",
		difficulty: 1
	},
	repeat: {
		name: "repeat",
		fn: "repeat",
		args: [{name: 'string', types: ["text"]}, {name: 'times', types: ["number"]}],
		returnType: "text",
		description: "Repeat a string",
		category: "String",
		difficulty: 1
	},
	format: {
		name: "format",
		fn: "format",
		args: [{name: 'value', types: ["any"]}],
		returnType: "text",
		description: "Format a value to string",
		category: "String",
		difficulty: 1
	},
	toNumber: {
		name: "toNumber",
		fn: "toNumber",
		args: [{name: 'value', types: ["any"]}],
		returnType: "number",
		description: "Convert a value to a number",
		category: "Number",
		difficulty: 1
	},
	now: {
		name: "now",
		fn: "now",
		args: [],
		returnType: "date",
		description: "Get the current date",
		category: "Date",
		difficulty: 1
	},
	minute: {
		name: "minute",
		fn: "minute",
		args: [{name: 'date', types: ["date"]}],
		returnType: "number",
		description: "Get the minutes of a date",
		category: "Date",
		difficulty: 1
	},
	hour: {
		name: "hour",
		fn: "hour",
		args: [{name: 'date', types: ["date"]}],
		returnType: "number",
		description: "Get the hours of a date",
		category: "Date",
		difficulty: 1
	},
	day: {
		name: "day",
		fn: "day",
		args: [{name: 'date', types: ["date"]}],
		returnType: "number",
		description: "Get the day of a date",
		category: "Date",
		difficulty: 1
	},
	date: {
		name: "date",
		fn: "date",
		args: [{name: 'date', types: ["date"]}],
		returnType: "number",
		description: "Get the date of a date",
		category: "Date",
		difficulty: 1
	},
	week: {
		name: "week",
		fn: "week",
		args: [{name: 'date', types: ["date"]}],
		returnType: "number",
		description: "Get the week of a date",
		category: "Date",
		difficulty: 1
	},
	month: {
		name: "month",
		fn: "month",
		args: [{name: 'date', types: ["date"]}],
		returnType: "number",
		description: "Get the month of a date",
		category: "Date",
		difficulty: 1
	},
	year: {
		name: "year",
		fn: "year",
		args: [{name: 'date', types: ["date"]}],
		returnType: "number",
		description: "Get the year of a date",
		category: "Date",
		difficulty: 1
	},
	pad: {
		name: "pad",
		fn: "pad",
		args: [{name: 'number', types: ["number"]}, {name: 'length', types: ["number"]}, {name: 'text', types: ["text"]}],
		returnType: "text",
		description: "Pad a number with text",
		category: "String",
		difficulty: 1
	},
	range: {
		name: "range",
		fn: "range",
		args: [{name: 'numbers', types: ["number-multi"]}],
		returnType: "number",
		description: "Get the difference between the largest and smallest from a list of numbers",
		category: "List",
		difficulty: 1
	},
	latest: {
		name: "latest",
		fn: "latest",
		args: [{name: 'dates', types: ["date-multi"]}],
		returnType: "date",
		description: "Get the latest date of a list of dates",
		category: "Date",
		difficulty: 1
	},
	earliest: {
		name: "earliest",
		fn: "earliest",
		args: [{name: 'dates', types: ["date-multi"]}],
		returnType: "date",
		description: "Get the earliest date of a list of dates",
		category: "Date",
		difficulty: 1
	},
	dateRange: {
		name: "dateRange",
		fn: "dateRange",
		args: [{name: 'dates', types: ["date-multi"]}, {name: 'type', types: ["text"]}],
		returnType: "number",
		description: "Get the date range of a list of dates",
		category: "Date",
		difficulty: 1
	},
	dateAdd: {
		name: "dateAdd",
		fn: "dateAdd",
		args: [{name: 'date', types: ["date"]}, {name: 'amount', types: ["number"]}, {name: 'type', types: ["text"]}],
		returnType: "date",
		description: "Add an amount to a date",
		category: "Date",
		difficulty: 2
	},
	dateSubtract: {
		name: "dateSubtract",
		fn: "dateSubtract",
		args: [{name: 'date', types: ["date"]}, {name: 'amount', types: ["number"]}, {name: 'type', types: ["text"]}],
		description: "Subtract an amount from a date",
		category: "Date",
		difficulty: 2
	},
	dateBetween: {
		name: "dateBetween",
		fn: "dateBetween",
		args: [{name: 'date1', types: ["date"]}, {name: 'date2', types: ["date"]}, {name: 'type', types: ["text"]}],
		returnType: "number",
		description: "Get the difference between two dates",
		category: "Date",
		difficulty: 2
	},
	
	timeStamp: {
		name: "timeStamp",
		fn: "timeStamp",
		args: [{name: 'date', types: ["date"]}],
		returnType: "number",
		description: "Get the timestamp of a date",
		category: "Date",
		difficulty: 1
	},
	at: {
		name: "at",
		fn: "at",
		args: [{name: 'list', types: ["any-list"]}, {name: 'index', types: ["number"]}],
		returnType: "any",
		description: "Get an element at a specific index",
		category: "List",
		difficulty: 2
	},
	first: {
		name: "first",
		fn: "first",
		args: [{name: 'list', types: ["any-multi"]}],
		returnType: "any",
		description: "Get the first element of a list",
		category: "List",
		difficulty: 1
	},
	last: {
		name: "last",
		fn: "last",
		args: [{name: 'list', types: ["any-multi"]}],
		returnType: "any",
		description: "Get the last element of a list",
		category: "List",
		difficulty: 1
	},
	concat: {
		name: "concat",
		fn: "concat",
		args: [{name: 'list 1', types: ["any-multi"]}, {name: 'list 2', types: ["any-multi"]}],
		returnType: "any-multi",
		description: "Concatenate two lists",
		category: "List",
		difficulty: 1
	},
	sort: {
		name: "sort",
		fn: "sort",
		args: [{name: 'list', types: ["any-multi"]}],
		returnType: "any-multi",
		description: "Sort a list",
		category: "List",
		difficulty: 1
	},
	reverse: {
		name: "reverse",
		fn: "reverse",
		args: [{name: 'list', types: ["any-multi"]}],
		returnType: "any-multi",
		description: "Reverse a list",
		category: "List",
		difficulty: 1
	},
	join: {
		name: "join",
		fn: "join",
		args: [{name: 'list', types: ["text-multi"]}, {name: 'separator', types: ["text"]}],
		returnType: "text",
		description: "Turn a list into text separator",
		category: "List",
		difficulty: 1
	},
	includes: {
		name: "includes",
		fn: "includes",
		args: [{name: 'list', types: ["any-multi"]}, {name: 'value', types: ["any"]}],
		returnType: "boolean",
		description: "Check if a list includes a value",
		category: "List",
		difficulty: 1
	},
	split: {
		name: "split",
		fn: "split",
		args: [{name: 'string', types: ["text"]}, {name: 'separator', types: ["text"]}],
		returnType: "text-multi",
		description: "Split text into a list using a separator",
		category: "String",
		difficulty: 1
	},
	formatDate: {
		name: "formatDate",
		fn: "formatDate",
		args: [{name: 'date', types: ["date"]}, {name: 'format', types: ["text"]}],
		returnType: "text",
		description: "Format a date into text",
		category: "Date",
		difficulty: 2
	},
	parseDate: {
		name: "parseDate",
		fn: "parseDate",
		args: [{name: 'date', types: ["text"]}],
		returnType: "date",
		description: "Transform date from text",
		category: "Date",
		difficulty: 1
	},
	find: {
		name: "find",
		fn: "find",
		args: [{name: 'list', types: ["any-multi"]}, {name: 'condition', types: ["boolean"]}],
		returnType: "any",
		description: "Find an element in a list",
		category: "List",
		difficulty: 2
	},
	findIndex: {
		name: "findIndex",
		fn: "findIndex",
		args: [{name: 'list', types: ["any-multi"]}, {name: 'condition', types: ["boolean"]}],
		returnType: "number",
		description: "Find the index of an element in a list",
		category: "List",
		difficulty: 2
	},
	filter: {
		name: "filter",
		fn: "filter",
		args: [{name: 'list', types: ["any-multi"]}, {name: 'condition', types: ["boolean"]}],
		returnType: "any-multi",
		description: "Filter a list based on a condition",
		category: "List",
		difficulty: 2
	},
	map: {
		name: "map",
		fn: "map",
		args: [{name: 'list', types: ["any-multi"]}, {name: 'formula', types: ["any"]}],
		returnType: "any-multi",
		description: "Change all the values in a list based on a formula",
		category: "List",
		difficulty: 2
	},
	some: {
		name: "some",
		fn: "some",
		args: [{name: 'list', types: ["any-multi"]}, {name: 'condition', types: ["boolean"]}],
		returnType: "boolean",
		description: "Check if some elements in a list are true",
		category: "List",
		difficulty: 2
	},
	every: {
		name: "every",
		fn: "every",
		args: [{name: 'list', types: ["any-multi"]}, {name: 'condition', types: ["boolean"]}],
		returnType: "boolean",
		description: "Check if every element in a list is true",
		category: "List",
		difficulty: 2
	},
	flat: {
		name: "flat",
		fn: "flat",
		args: [{name: 'list', types: ["any-multi"]}],
		returnType: "any-multi",
		description: "Flatten a list of lists into a single list",
		category: "List",
		difficulty: 2
	},
	path: {
		name: "path",
		fn: "path",
		args: [{name: 'path', types: ["text"]}],
		returnType: 'link',
		description: "Get the path object of a path",
		category: "Path",
		difficulty: 2
	},
	let: {
		name: "let",
		fn: "let",
		args: [{name: 'variable', types: ["text"]}, {name: 'value', types: ["any"]}, {name: 'formula', types: ["any"]}],
		returnType: "any",
		description: "Define a variable to use in a formula",
		category: "Variable",
		difficulty: 3
	},
	lets: {
		name: "lets",
		fn: "lets",
		args: [{name: 'variable', types: ["text"]}, {name: 'value', types: ["any"]}, {name: '...', types: []}, {name: 'formula', types: ["any"]}],
		returnType: "any",
		description: "Define multiple variables to use in a formula",
		category: "Variable",
		difficulty: 3
	},
}

const letFunction = (args: MathNode[], math: any, scope: Map<string, any>) => {
	const variable = args[0] as SymbolNode;
	if (!variable.isSymbolNode) {
		return ""
	}
	if (args.length !== 3) {
		return "";
	}
	const name = variable.name;
	const value = args[1] as MathNode;
	math.evaluate(`${name} = ${value.toString()}`, scope);
	const fnCode = args[2].compile();
	return fnCode.evaluate(scope);
}

letFunction.rawArgs = true;

const letsFunction = (args: MathNode[], math: any, scope: Map<string, any>) => {
	if (args.length % 2 !== 1) {
		return "";
	}

	for (let i = 0; i < args.length - 1; i += 2) {
		const variable = args[i] as SymbolNode;
		if (!variable.isSymbolNode) {
			return ""
		}
		const name = variable.name;
		const value = args[i + 1] as MathNode;
		math.evaluate(`${name} = ${value.toString()}`, scope);
	}
	
	const fnCode = args[args.length - 1].compile()
	return fnCode.evaluate(scope)
}

letsFunction.rawArgs = true;

const path = (args: MathNode[], math: any, scope: Map<string, any>) => {
	if (args.length !== 1) {
		return "";
	}
	const res = args.map(function (arg) {
		return arg.compile().evaluate(scope)
	})
	const value = (scope.get("$paths") as Map<string, PathState>).get(res[0]);
	return value;

}
path.rawArgs = true;

const current = (args: MathNode[], math: any, scope: Map<string, any>) => {
	return scope?.get("$current");
}
current.rawArgs = true;

const index = (args: MathNode[], math: any, scope: Map<string, any>) => {
	return scope?.get("$index");
}
index.rawArgs = true;

const find = (args: MathNode[], math: any, scope: Map<string, any>) => {
	if (args.length !== 2) {
		return "";
	}
	const arr = args[0].compile().evaluate
		? args[0].compile().evaluate(scope)
		: args[0];
	if (Array.isArray(arr)) 
	{
		return arr.find((f, i) => {
			scope.set("$current", f);
			scope.set("$index", i);
			math.evaluate("current = _current(); index = _index()", scope)
			const value = args[1].compile().evaluate
			? args[1].compile().evaluate(scope)
			: args[1];
			return f === value;
		}) ?? "";
	}
	return "";
}
find.rawArgs = true;

const findIndex = (args: MathNode[], math: any, scope: Map<string, any>) => {
	if (args.length !== 2) {
		return "";
	}
	const arr = args[0].compile().evaluate
		? args[0].compile().evaluate(scope)
		: args[0];
	if (Array.isArray(arr)) 
	{
		return arr.findIndex((f, i) => {
			scope.set("$current", f);
			scope.set("$index", i);
			math.evaluate("current = _current(); index = _index()", scope)
			const value = args[1].compile().evaluate
			? args[1].compile().evaluate(scope)
			: args[1];
			return f === value;
		});
	}
	return "";
}
findIndex.rawArgs = true;

const filter = (args: MathNode[], math: any, scope: Map<string, any>) => {
	if (args.length !== 2) {
		return "";
	}
	const arr = args[0].compile().evaluate
		? args[0].compile().evaluate(scope)
		: args[0];
	if (Array.isArray(arr)) {
		return arr.filter((f, i) => {
			scope.set("$current", f);
			scope.set("$index", i);
			math.evaluate("current = _current(); index = _index()", scope)
			return args[1].compile().evaluate(scope);
		});
	}
	return "";
}
filter.rawArgs = true;

const map = (args: MathNode[], math: any, scope: Map<string, any>) => {

	if (args.length !== 2) {
		return "";
	}
	const arr = args[0].compile().evaluate
		? args[0].compile().evaluate(scope)
		: args[0];

	if (Array.isArray(arr)) {
		return arr.map((f, i) => {
			scope.set("$current", f);
			scope.set("$index", i);
			math.evaluate("current = _current(); index = _index()", scope)
			const result = args[1].compile().evaluate(scope);

			return result;
		});
	}
	return "";
}
map.rawArgs = true;

const some = (args: MathNode[], math: any, scope: Map<string, any>) => {
	if (args.length !== 2) {
		return "";
	}
	const arr = args[0].compile().evaluate
		? args[0].compile().evaluate(scope)
		: args[0];
	if (Array.isArray(arr)) {
		return arr.some((f, i) => {
			scope.set("$current", f);
			scope.set("$index", i);
			math.evaluate("current = _current(); index = _index()", scope)
			return args[1].compile().evaluate(scope);
		});
	}
	return "";
}
some.rawArgs = true;

const every = (args: MathNode[], math: any, scope: Map<string, any>) => {
	if (args.length !== 2) {
		return "";
	}
	const arr = args[0].compile().evaluate
		? args[0].compile().evaluate(scope)
		: args[0];
	if (Array.isArray(arr)) {
		return arr.every((f, i) => {
			scope.set("$current", f);
			scope.set("$index", i);
			math.evaluate("current = _current(); index = _index()", scope)
			return args[1].compile().evaluate(scope);
		});
	}
	return "";
}
every.rawArgs = true;

const flat = (args: MathNode[], math: any, scope: Map<string, any>) => {
	if (args.length !== 1) {
		return "";
	}
	const arr = args[0].compile().evaluate
		? args[0].compile().evaluate(scope)
		: args[0];
	if (Array.isArray(arr)) {
		return arr.flat();
	}
	return "";
}
flat.rawArgs = true;


const prop = (args: MathNode[], math: any, scope: Map<string, any>) => {
	if (args.length !== 1) {
		return "";
	}
	const res = args.map(function (arg) {
		return arg.compile().evaluate(scope)
	})
	

	const type = scope.get('$properties')?.[res[0]]?.type;
	let value = parseMDBStringValue(type, scope.get(res[0]));

	if (type == 'file' || type == 'link' || type == 'context') {
		if (type.includes('multi')) {
			value = parseMultiString(value).map(f => (scope.get("$paths") as Map<string, PathState>).get(f) ?? f);
		} else {

			value = (scope.get("$paths") as Map<string, PathState>).get(value) ?? value;
		}
	}
	if (type == 'date') {
		value = parseDate(value)
	}
	return value ?? "";
};
prop.rawArgs = true;
const ifs =(args: MathNode[], math: any, scope: Map<string, any>) => {
	if ((args.length - 1) % 2 !== 0) {
		return "";
	}
	for (let i = 0; i < args.length-1; i += 2) {
		if (args[i].compile().evaluate() === true) {
			return args[i + 1].compile().evaluate(scope);
		}
	}
	return args[args.length - 1].compile().evaluate(scope);
}
ifs.rawArgs = true;
const formatDateString = (args: MathNode[], math: any, scope: Map<string, any>) => {
	if (args.length < 1 || args.length > 2) {
		return "";
	}
	let date = args[0].compile().evaluate(scope);
	if (!(date instanceof Date)) {
		date = new Date(date);
	}
	const dateFormat = args[1]?.compile().evaluate(scope);
	if (dateFormat?.length > 0) {
		return formatDate(date, dateFormat);
	}
	return formatDate(date, scope.get("$settings")?.dateFormat ?? "yyyy-MM-dd");
}
formatDateString.rawArgs = true;
const format = (arg: any) =>{

	if (typeof arg === "string"|| arg instanceof String) {
		return arg;
	}
	if (arg instanceof Date) {
		return formatDate(arg, "yyyy-MM-dd");
	}
	if (typeof arg === "number") {
		return arg.toFixed(0);
	}
	if (arg?.path) {
		return arg.path;
	}
	return "";

}
export const formulas = {
	"prop": prop,
	"_current": current,
	"_index": index,
	"slice": (str: string, start: number, end: number) => {
		str = format(str);
		return str.slice(start, end);
	},
	"if": (condition: boolean, ifTrue: any, ifFalse: any) => {
		return condition === true ? ifTrue : ifFalse;
	},
	"ifs": ifs,
	"empty": (args: string[]) => {
		if (args.length !== 1) {
			return "";
		}
		if (Array.isArray(args[0])) {
			return args[0].length === 0;
		}
		return args[0] === "" ? "true" : "false";
	},
	"length": (arg: string | any[]) => arg.length,
	"values": (arg: any[]) => arg.flat().length,
	"uniques": (arg: any[]) => uniq(arg.flat()).length,
	"substring": (str: string, start: number, end?: number) => {
		str = format(str);
		if (!end) {
			return str.substring(start);
		}
		return str.substring(start, end);
	},
	"startsWith": (str: string, subStr: string) => {
		str = format(str);
		subStr = format(subStr);
		return str.startsWith(subStr);
	},
	"contains": (str: string, subStr: string) => {
		str = format(str);
		subStr = format(subStr);
		return str.includes(subStr);
	},
	"test": (str: string, regex: string) => {
		str = format(str);
		return new RegExp(regex).test(str);
	},
	"match": (str: string, regex: string) => {
		str = format(str);
		return str.match(new RegExp(regex));
	},
	"replace": (str: string, search: string, replace: string) => {
		str = format(str);
		return str.replace(new RegExp(search), replace);
	},
	"replaceAll": (str: string, search: string, replace: string) => {
		str = format(str);
		search = format(search);
		replace = format(replace);
		return str.replace(new RegExp(search, "g"), replace);
	},
	"lower": (str: string) => {
		str = format(str);
		return str.toLowerCase();
	},
	"upper": (str: string) => {
		str = format(str);
		return str.toUpperCase();
	},
	"repeat": (str: string, times: number) => {
		return str.repeat(times);
	},
	"format": format,
	"toNumber": (arg: any) => {
		if (arg instanceof Date) {
			return arg.getTime();
		}
		if (typeof arg === "string")
			return parseFloat(arg);
		return arg
	},
	"now": () => {
		return new Date();
	},
	"minute": (date: Date) => {
		return date.getMinutes()
	},
	"hour": (date: Date) => {
		return date.getHours()
	},
	"day": (date: Date) => {
		return date.getDay()
	},
	"date": (date: Date) => {
		return date.getDate();
	},
	"week": (date: Date) => {
		return formatDate(date, "w");
	},
	"month": (date: Date) => {
		return date.getMonth() + 1;
	},
	"year": (date: Date) => {
		return date.getFullYear();
	},
	'pad': (str: string, length: number, char: string) => {
		return str.padStart(length, char);
	},
	"range": (arr: number[]) => {
		return Math.max(...arr) - Math.min(...arr);
	},
	"latest": (arr: Date[]) => {
		return new Date(Math.max(...arr.map(f => f.getTime())));
	},
	"earliest": (arr: Date[]) => {
		return new Date(Math.min(...arr.map(f => f.getTime())));
	},
	"dateRange": (arr: Date[], type: string) => {
		const diff = Math.abs(Math.max(...arr.map(f => f.getTime())) - Math.min(...arr.map(f => f.getTime())));
		if (type.startsWith("day")) return diff / (1000 * 60 * 60 * 24);
		if (type.startsWith("month")) return diff / (1000 * 60 * 60 * 24 * 30);
		if (type.startsWith("year")) return diff / (1000 * 60 * 60 * 24 * 365);
		if (type.startsWith("hour")) return diff / (1000 * 60 * 60);
		if (type.startsWith("minute")) return diff / (1000 * 60);
		if (type.startsWith("second")) return diff / 1000;
		if (type.startsWith("week")) return diff / (1000 * 60 * 60 * 24 * 7);
		if (type.startsWith("quarter")) return diff / (1000 * 60 * 60 * 24 * 30 * 3);
		return diff / (1000 * 60 * 60 * 24);
	},
	"dateAdd": (newDate: Date, amount: number, type: string) => {
		
		if (type.startsWith("day")) newDate.setDate(newDate.getDate() + amount);
		if (type.startsWith("month")) newDate.setMonth(newDate.getMonth() + amount);
		if (type.startsWith("year")) newDate.setFullYear(newDate.getFullYear() + amount);
		if (type.startsWith('quarter')) newDate.setMonth(newDate.getMonth() + amount * 3);
		if (type.startsWith('week')) newDate.setDate(newDate.getDate() + amount * 7);
		if (type.startsWith("hour")) newDate.setHours(newDate.getHours() + amount);
		if (type.startsWith("minute")) newDate.setMinutes(newDate.getMinutes() + amount);
		if (type.startsWith("second")) newDate.setSeconds(newDate.getSeconds() + amount);
		return newDate;
	},
	"dateSubtract": (newDate: Date, amount: number, type: string) => {
		
		if (type.startsWith("day")) newDate.setDate(newDate.getDate() - amount);
		if (type.startsWith("month")) newDate.setMonth(newDate.getMonth() - amount);
		if (type.startsWith("year")) newDate.setFullYear(newDate.getFullYear() - amount);
		if (type.startsWith('quarter')) newDate.setMonth(newDate.getMonth() - amount * 3);
		if (type.startsWith('week')) newDate.setDate(newDate.getDate() - amount * 7);
		if (type.startsWith("hour")) newDate.setHours(newDate.getHours() - amount);
		if (type.startsWith("minute")) newDate.setMinutes(newDate.getMinutes() - amount);
		if (type.startsWith("second")) newDate.setSeconds(newDate.getSeconds() - amount);
		return newDate;
	},
	"dateBetween": (current: Date, end: Date, format: string) => {
		const msPerDay = 24 * 60 * 60 * 1000;
		const msPerMonth = msPerDay * 30; // Approximation
		const msPerYear = msPerDay * 365; // Approximation
		const diffMs = Math.abs(end.getTime() - current.getTime());
		switch (format) {
			case 'days':
			return Math.round(diffMs / msPerDay);
			case 'months':
			return Math.round(diffMs / msPerMonth);
			case 'years':
			return Math.round(diffMs / msPerYear);
		case 'hours':
			return Math.round(diffMs / (60 * 60 * 1000));
		case 'minutes':
			return Math.round(diffMs / (60 * 1000));
		case 'seconds':
			return Math.round(diffMs / 1000);
		case "weeks":
			return Math.round(diffMs / (msPerDay * 7));
		case "quarters":
			return Math.round(diffMs / (msPerMonth * 3));
		default:
			return Math.round(diffMs / msPerDay);
		}	
	},
	"style": (str: string, style: string) => {
		return str;
	},
	"timeStamp": (date: Date) => {
		
		return date.getTime()
	},
	"at": (arr: any[], index: number) => {
		return arr[index];
	},
	"first": (arr: any[]) => {
		return arr[0];
	},
	"last": (arr: any[]) => {
		return arr[arr.length - 1];
	},
	"concat": (arr1: any[], arr2: any[]) => {
		return arr1.concat(arr2);
	},
	"sort": (arr: any[]) => {
		return arr.sort((a, b) => {
			return b - a;
		});
	},
	"reverse": (arr: any[]) => {
		return arr.reverse();
	},
	"join": (arr: any[], separator: string) => {
		return arr.join(separator);
	},
	"includes": (arr: any[], value: any) => {
		return arr.includes(value);
	},
	"split": (str: string, separator: string) => {
		return str.split(separator);
	},
	"formatDate": formatDateString,
	"parseDate": (str:string) => {
		return parseDate(str);
	},
	find: find,
	findIndex: findIndex,
	filter: filter,
	map: map,
	some: some,
	every: every,
	flat: flat,
	path: path,
	let: letFunction,
	lets: letsFunction
	
};
