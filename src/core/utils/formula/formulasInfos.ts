

export const formulasInfos: Record<string, FormulaInfo> = {
	prop: {
		name: "prop",
		fn: "prop",
		args: [{ name: 'property', types: ["text"] }],
		returnType: "any",
		category: "property",
		difficulty: 1
	},

	slice: {
		name: "slice",
		fn: "slice",
		args: [{ name: 'text', types: ["text"] }, { name: 'start', types: ["number"] }, { name: 'end', types: ["number"] }],
		returnType: "text",
		category: "string",
		difficulty: 1
	},
	if: {
		name: "if",
		fn: "if",
		args: [{ name: 'condition', types: ["boolean"] }, { name: 'ifTrue', types: ["any"] }, { name: 'ifFalse', types: ["any"] }],
		returnType: "any",
		category: "logic",
		difficulty: 2
	},
	ifs: {
		name: "ifs",
		fn: "ifs",
		args: [{ name: 'condition', types: ["boolean"] }, { name: 'ifTrue', types: ["any"] }, { name: '...', types: [] }, { name: 'ifFalse', types: ["any"] }],
		returnType: "any",
		category: "logic",
		difficulty: 2
	},
	empty: {
		name: "empty",
		fn: "empty",
		args: [{ name: 'value', types: ["any"] }],
		returnType: "boolean",
		category: "string",
		difficulty: 1
	},
	length: {
		name: "length",
		fn: "length",
		args: [{ name: 'list', types: ["any-multi"] }],
		returnType: "number",
		category: "list",
		difficulty: 1
	},
	values: {
		name: "values",
		fn: "values",
		args: [{ name: 'list', types: ["any-multi"] }],
		returnType: "number",
		category: "list",
		difficulty: 1
	},
	uniques: {
		name: "uniques",
		fn: "uniques",
		args: [{ name: 'list', types: ["any-list"] }],
		returnType: "number",
		category: "list",
		difficulty: 1
	},
	substring: {
		name: "substring",
		fn: "substring",
		args: [{ name: 'string', types: ["text"] }, { name: 'start', types: ["number"] }, { name: 'end', types: ["number"] }],
		returnType: "text",
		category: "string",
		difficulty: 2
	},
	startsWith: {
		name: "startsWith",
		fn: "startsWith",
		args: [{ name: 'string', types: ["text"] }, { name: 'substring', types: ["text"] }],
		returnType: "boolean",
		category: "string",
		difficulty: 1
	},
	contains: {
		name: "contains",
		fn: "contains",
		args: [{ name: 'string', types: ["text"] }, { name: 'substring', types: ["text"] }],
		returnType: "boolean",
		category: "string",
		difficulty: 1
	},
	test: {
		name: "test",
		fn: "test",
		args: [{ name: 'string', types: ["text"] }, { name: 'regex', types: ["text"] }],
		returnType: "boolean",
		category: "string",
		difficulty: 3
	},
	match: {
		name: "match",
		fn: "match",
		args: [{ name: 'string', types: ["text"] }, { name: 'regex', types: ["text"] }],
		returnType: "boolean",
		category: "string",
		difficulty: 3
	},
	replace: {
		name: "replace",
		fn: "replace",
		args: [{ name: 'string', types: ["text"] }, { name: 'search', types: ["text"] }, { name: 'replace', types: ["text"] }],
		returnType: "text",
		category: "string",
		difficulty: 1
	},
	replaceAll: {
		name: "replaceAll",
		fn: "replaceAll",
		args: [{ name: 'string', types: ["text"] }, { name: 'search', types: ["text"] }, { name: 'replace', types: ["text"] }],
		returnType: "text",
		category: "string",
		difficulty: 1
	},
	lower: {
		name: "lower",
		fn: "lower",
		args: [{ name: 'string', types: ["text"] }],
		returnType: "text",
		category: "string",
		difficulty: 1
	},
	upper: {
		name: "upper",
		fn: "upper",
		args: [{ name: 'string', types: ["text"] }],
		returnType: "text",
		category: "string",
		difficulty: 1
	},
	repeat: {
		name: "repeat",
		fn: "repeat",
		args: [{ name: 'string', types: ["text"] }, { name: 'times', types: ["number"] }],
		returnType: "text",
		category: "string",
		difficulty: 1
	},
	format: {
		name: "format",
		fn: "format",
		args: [{ name: 'value', types: ["any"] }],
		returnType: "text",
		category: "string",
		difficulty: 1
	},
	toNumber: {
		name: "toNumber",
		fn: "toNumber",
		args: [{ name: 'value', types: ["any"] }],
		returnType: "number",
		category: "number",
		difficulty: 1
	},
	now: {
		name: "now",
		fn: "now",
		args: [],
		returnType: "date",
		category: "date",
		difficulty: 1
	},
	minute: {
		name: "minute",
		fn: "minute",
		args: [{ name: 'date', types: ["date"] }],
		returnType: "number",
		category: "date",
		difficulty: 1
	},
	hour: {
		name: "hour",
		fn: "hour",
		args: [{ name: 'date', types: ["date"] }],
		returnType: "number",
		category: "date",
		difficulty: 1
	},
	day: {
		name: "day",
		fn: "day",
		args: [{ name: 'date', types: ["date"] }],
		returnType: "number",
		category: "date",
		difficulty: 1
	},
	date: {
		name: "date",
		fn: "date",
		args: [{ name: 'date', types: ["date"] }],
		returnType: "number",
		category: "date",
		difficulty: 1
	},
	week: {
		name: "week",
		fn: "week",
		args: [{ name: 'date', types: ["date"] }],
		returnType: "number",
		category: "date",
		difficulty: 1
	},
	month: {
		name: "month",
		fn: "month",
		args: [{ name: 'date', types: ["date"] }],
		returnType: "number",
		category: "date",
		difficulty: 1
	},
	year: {
		name: "year",
		fn: "year",
		args: [{ name: 'date', types: ["date"] }],
		returnType: "number",
		category: "date",
		difficulty: 1
	},
	pad: {
		name: "pad",
		fn: "pad",
		args: [{ name: 'number', types: ["number"] }, { name: 'length', types: ["number"] }, { name: 'text', types: ["text"] }],
		returnType: "text",
		category: "string",
		difficulty: 1
	},
	range: {
		name: "range",
		fn: "range",
		args: [{ name: 'numbers', types: ["number-multi"] }],
		returnType: "number",
		category: "list",
		difficulty: 1
	},
	latest: {
		name: "latest",
		fn: "latest",
		args: [{ name: 'dates', types: ["date-multi"] }],
		returnType: "date",
		category: "date",
		difficulty: 1
	},
	earliest: {
		name: "earliest",
		fn: "earliest",
		args: [{ name: 'dates', types: ["date-multi"] }],
		returnType: "date",
		category: "date",
		difficulty: 1
	},
	dateRange: {
		name: "dateRange",
		fn: "dateRange",
		args: [{ name: 'dates', types: ["date-multi"] }, { name: 'type', types: ["text"] }],
		returnType: "number",
		category: "date",
		difficulty: 1
	},
	dateAdd: {
		name: "dateAdd",
		fn: "dateAdd",
		args: [{ name: 'date', types: ["date"] }, { name: 'amount', types: ["number"] }, { name: 'type', types: ["text"] }],
		returnType: "date",
		category: "date",
		difficulty: 2
	},
	dateSubtract: {
		name: "dateSubtract",
		fn: "dateSubtract",
		args: [{ name: 'date', types: ["date"] }, { name: 'amount', types: ["number"] }, { name: 'type', types: ["text"] }],
		category: "date",
		difficulty: 2
	},
	dateBetween: {
		name: "dateBetween",
		fn: "dateBetween",
		args: [{ name: 'date1', types: ["date"] }, { name: 'date2', types: ["date"] }, { name: 'type', types: ["text"] }],
		returnType: "number",
		category: "date",
		difficulty: 2
	},

	spaceItems: {
		name: "spaceItems",
		fn: "spaceItems",
		args: [{ name: 'path', types: ["text"] }],
		returnType: "link-multi",
		category: "path",
		difficulty: 2
	},
	spaces: {
		name: "spaces",
		fn: "spaces",
		args: [{ name: 'path', types: ["text"] }],
		returnType: "link-multi",
		category: "path",
		difficulty: 2
	},

	timeStamp: {
		name: "timeStamp",
		fn: "timeStamp",
		args: [{ name: 'date', types: ["date"] }],
		returnType: "number",
		category: "date",
		difficulty: 1
	},
	at: {
		name: "at",
		fn: "at",
		args: [{ name: 'list', types: ["any-list"] }, { name: 'index', types: ["number"] }],
		returnType: "any",
		category: "list",
		difficulty: 2
	},
	first: {
		name: "first",
		fn: "first",
		args: [{ name: 'list', types: ["any-multi"] }],
		returnType: "any",
		category: "list",
		difficulty: 1
	},
	last: {
		name: "last",
		fn: "last",
		args: [{ name: 'list', types: ["any-multi"] }],
		returnType: "any",
		category: "list",
		difficulty: 1
	},
	concat: {
		name: "concat",
		fn: "concat",
		args: [{ name: 'list 1', types: ["any-multi"] }, { name: 'list 2', types: ["any-multi"] }],
		returnType: "any-multi",
		category: "list",
		difficulty: 1
	},
	sort: {
		name: "sort",
		fn: "sort",
		args: [{ name: 'list', types: ["any-multi"] }],
		returnType: "any-multi",
		category: "list",
		difficulty: 1
	},
	reverse: {
		name: "reverse",
		fn: "reverse",
		args: [{ name: 'list', types: ["any-multi"] }],
		returnType: "any-multi",
		category: "list",
		difficulty: 1
	},
	join: {
		name: "join",
		fn: "join",
		args: [{ name: 'list', types: ["text-multi"] }, { name: 'separator', types: ["text"] }],
		returnType: "text",
		category: "list",
		difficulty: 1
	},
	includes: {
		name: "includes",
		fn: "includes",
		args: [{ name: 'list', types: ["any-multi"] }, { name: 'value', types: ["any"] }],
		returnType: "boolean",
		category: "list",
		difficulty: 1
	},
	split: {
		name: "split",
		fn: "split",
		args: [{ name: 'string', types: ["text"] }, { name: 'separator', types: ["text"] }],
		returnType: "text-multi",
		category: "string",
		difficulty: 1
	},
	formatDate: {
		name: "formatDate",
		fn: "formatDate",
		args: [{ name: 'date', types: ["date"] }, { name: 'format', types: ["text"] }],
		returnType: "text",
		category: "date",
		difficulty: 2
	},
	parseDate: {
		name: "parseDate",
		fn: "parseDate",
		args: [{ name: 'date', types: ["text"] }],
		returnType: "date",
		category: "date",
		difficulty: 1
	},
	find: {
		name: "find",
		fn: "find",
		args: [{ name: 'list', types: ["any-multi"] }, { name: 'condition', types: ["boolean"] }],
		returnType: "any",
		category: "list",
		difficulty: 2
	},
	findIndex: {
		name: "findIndex",
		fn: "findIndex",
		args: [{ name: 'list', types: ["any-multi"] }, { name: 'condition', types: ["boolean"] }],
		returnType: "number",
		category: "list",
		difficulty: 2
	},
	filter: {
		name: "filter",
		fn: "filter",
		args: [{ name: 'list', types: ["any-multi"] }, { name: 'condition', types: ["boolean"] }],
		returnType: "any-multi",
		category: "list",
		difficulty: 2
	},
	map: {
		name: "map",
		fn: "map",
		args: [{ name: 'list', types: ["any-multi"] }, { name: 'formula', types: ["any"] }],
		returnType: "any-multi",
		category: "list",
		difficulty: 2
	},
	some: {
		name: "some",
		fn: "some",
		args: [{ name: 'list', types: ["any-multi"] }, { name: 'condition', types: ["boolean"] }],
		returnType: "boolean",
		category: "list",
		difficulty: 2
	},
	every: {
		name: "every",
		fn: "every",
		args: [{ name: 'list', types: ["any-multi"] }, { name: 'condition', types: ["boolean"] }],
		returnType: "boolean",
		category: "list",
		difficulty: 2
	},
	flat: {
		name: "flat",
		fn: "flat",
		args: [{ name: 'list', types: ["any-multi"] }],
		returnType: "any-multi",
		category: "list",
		difficulty: 2
	},
	path: {
		name: "path",
		fn: "path",
		args: [{ name: 'path', types: ["text"] }],
		returnType: 'link',
		category: "path",
		difficulty: 2
	},
	let: {
		name: "let",
		fn: "let",
		args: [{ name: 'variable', types: ["text"] }, { name: 'value', types: ["any"] }, { name: 'formula', types: ["any"] }],
		returnType: "any",
		category: "variable",
		difficulty: 3
	},
	lets: {
		name: "lets",
		fn: "lets",
		args: [{ name: 'variable', types: ["text"] }, { name: 'value', types: ["any"] }, { name: '...', types: [] }, { name: 'formula', types: ["any"] }],
		returnType: "any",
		category: "variable",
		difficulty: 3
	},
};type ArgType = {
	name: string;
	types: string[];
	description?: string;
};

export type FormulaInfo = {
	name: string;
	fn: string;
	args: ArgType[];
	returnType?: string;
	category: string;
	difficulty?: number;
};

