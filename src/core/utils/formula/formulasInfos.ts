

export const formulasInfos: Record<string, FormulaInfo> = {
	prop: {
		name: "prop",
		fn: "prop",
		args: [{ name: 'property', types: ["text"] }],
		returnType: "any",
		description: "Get the value of a property",
		category: "Property",
		difficulty: 1
	},

	slice: {
		name: "slice",
		fn: "slice",
		args: [{ name: 'text', types: ["text"] }, { name: 'start', types: ["number"] }, { name: 'end', types: ["number"] }],
		returnType: "text",
		description: "Get a part of a text",
		category: "String",
		difficulty: 1
	},
	if: {
		name: "if",
		fn: "if",
		args: [{ name: 'condition', types: ["boolean"] }, { name: 'ifTrue', types: ["any"] }, { name: 'ifFalse', types: ["any"] }],
		returnType: "any",
		description: "If condition is true return the first argument else return the second",
		category: "Logic",
		difficulty: 2
	},
	ifs: {
		name: "ifs",
		fn: "ifs",
		args: [{ name: 'condition', types: ["boolean"] }, { name: 'ifTrue', types: ["any"] }, { name: '...', types: [] }, { name: 'ifFalse', types: ["any"] }],
		returnType: "any",
		description: "If the first condition is true return the first argument else check the next condition",
		category: "Logic",
		difficulty: 2
	},
	empty: {
		name: "empty",
		fn: "empty",
		args: [{ name: 'value', types: ["any"] }],
		returnType: "boolean",
		description: "Check if a list is empty",
		category: "String",
		difficulty: 1
	},
	length: {
		name: "length",
		fn: "length",
		args: [{ name: 'list', types: ["any-multi"] }],
		returnType: "number",
		description: "Get the length of a list",
		category: "List",
		difficulty: 1
	},
	values: {
		name: "values",
		fn: "values",
		args: [{ name: 'list', types: ["any-multi"] }],
		returnType: "number",
		description: "Get the number of values in a list",
		category: "List",
		difficulty: 1
	},
	uniques: {
		name: "uniques",
		fn: "uniques",
		args: [{ name: 'list', types: ["any-list"] }],
		returnType: "number",
		description: "Get the number of unique values in a list",
		category: "List",
		difficulty: 1
	},
	substring: {
		name: "substring",
		fn: "substring",
		args: [{ name: 'string', types: ["text"] }, { name: 'start', types: ["number"] }, { name: 'end', types: ["number"] }],
		returnType: "text",
		description: "Get a substring of a string",
		category: "String",
		difficulty: 2
	},
	startsWith: {
		name: "startsWith",
		fn: "startsWith",
		args: [{ name: 'string', types: ["text"] }, { name: 'substring', types: ["text"] }],
		returnType: "boolean",
		description: "Check if a string starts with another string",
		category: "String",
		difficulty: 1
	},
	contains: {
		name: "contains",
		fn: "contains",
		args: [{ name: 'string', types: ["text"] }, { name: 'substring', types: ["text"] }],
		returnType: "boolean",
		description: "Check if a string contains another string",
		category: "String",
		difficulty: 1
	},
	test: {
		name: "test",
		fn: "test",
		args: [{ name: 'string', types: ["text"] }, { name: 'regex', types: ["text"] }],
		returnType: "boolean",
		description: "Test a string with a regex",
		category: "String",
		difficulty: 3
	},
	match: {
		name: "match",
		fn: "match",
		args: [{ name: 'string', types: ["text"] }, { name: 'regex', types: ["text"] }],
		returnType: "boolean",
		description: "Match a string with a regex",
		category: "String",
		difficulty: 3
	},
	replace: {
		name: "replace",
		fn: "replace",
		args: [{ name: 'string', types: ["text"] }, { name: 'search', types: ["text"] }, { name: 'replace', types: ["text"] }],
		returnType: "text",
		description: "Replace a string with another string",
		category: "String",
		difficulty: 1
	},
	replaceAll: {
		name: "replaceAll",
		fn: "replaceAll",
		args: [{ name: 'string', types: ["text"] }, { name: 'search', types: ["text"] }, { name: 'replace', types: ["text"] }],
		returnType: "text",
		description: "Replace all occurences of a string with another string",
		category: "String",
		difficulty: 1
	},
	lower: {
		name: "lower",
		fn: "lower",
		args: [{ name: 'string', types: ["text"] }],
		returnType: "text",
		description: "Convert a string to lowercase",
		category: "String",
		difficulty: 1
	},
	upper: {
		name: "upper",
		fn: "upper",
		args: [{ name: 'string', types: ["text"] }],
		returnType: "text",
		description: "Convert a string to uppercase",
		category: "String",
		difficulty: 1
	},
	repeat: {
		name: "repeat",
		fn: "repeat",
		args: [{ name: 'string', types: ["text"] }, { name: 'times', types: ["number"] }],
		returnType: "text",
		description: "Repeat a string",
		category: "String",
		difficulty: 1
	},
	format: {
		name: "format",
		fn: "format",
		args: [{ name: 'value', types: ["any"] }],
		returnType: "text",
		description: "Format a value to string",
		category: "String",
		difficulty: 1
	},
	toNumber: {
		name: "toNumber",
		fn: "toNumber",
		args: [{ name: 'value', types: ["any"] }],
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
		args: [{ name: 'date', types: ["date"] }],
		returnType: "number",
		description: "Get the minutes of a date",
		category: "Date",
		difficulty: 1
	},
	hour: {
		name: "hour",
		fn: "hour",
		args: [{ name: 'date', types: ["date"] }],
		returnType: "number",
		description: "Get the hours of a date",
		category: "Date",
		difficulty: 1
	},
	day: {
		name: "day",
		fn: "day",
		args: [{ name: 'date', types: ["date"] }],
		returnType: "number",
		description: "Get the day of a date",
		category: "Date",
		difficulty: 1
	},
	date: {
		name: "date",
		fn: "date",
		args: [{ name: 'date', types: ["date"] }],
		returnType: "number",
		description: "Get the date of a date",
		category: "Date",
		difficulty: 1
	},
	week: {
		name: "week",
		fn: "week",
		args: [{ name: 'date', types: ["date"] }],
		returnType: "number",
		description: "Get the week of a date",
		category: "Date",
		difficulty: 1
	},
	month: {
		name: "month",
		fn: "month",
		args: [{ name: 'date', types: ["date"] }],
		returnType: "number",
		description: "Get the month of a date",
		category: "Date",
		difficulty: 1
	},
	year: {
		name: "year",
		fn: "year",
		args: [{ name: 'date', types: ["date"] }],
		returnType: "number",
		description: "Get the year of a date",
		category: "Date",
		difficulty: 1
	},
	pad: {
		name: "pad",
		fn: "pad",
		args: [{ name: 'number', types: ["number"] }, { name: 'length', types: ["number"] }, { name: 'text', types: ["text"] }],
		returnType: "text",
		description: "Pad a number with text",
		category: "String",
		difficulty: 1
	},
	range: {
		name: "range",
		fn: "range",
		args: [{ name: 'numbers', types: ["number-multi"] }],
		returnType: "number",
		description: "Get the difference between the largest and smallest from a list of numbers",
		category: "List",
		difficulty: 1
	},
	latest: {
		name: "latest",
		fn: "latest",
		args: [{ name: 'dates', types: ["date-multi"] }],
		returnType: "date",
		description: "Get the latest date of a list of dates",
		category: "Date",
		difficulty: 1
	},
	earliest: {
		name: "earliest",
		fn: "earliest",
		args: [{ name: 'dates', types: ["date-multi"] }],
		returnType: "date",
		description: "Get the earliest date of a list of dates",
		category: "Date",
		difficulty: 1
	},
	dateRange: {
		name: "dateRange",
		fn: "dateRange",
		args: [{ name: 'dates', types: ["date-multi"] }, { name: 'type', types: ["text"] }],
		returnType: "number",
		description: "Get the date range of a list of dates",
		category: "Date",
		difficulty: 1
	},
	dateAdd: {
		name: "dateAdd",
		fn: "dateAdd",
		args: [{ name: 'date', types: ["date"] }, { name: 'amount', types: ["number"] }, { name: 'type', types: ["text"] }],
		returnType: "date",
		description: "Add an amount to a date",
		category: "Date",
		difficulty: 2
	},
	dateSubtract: {
		name: "dateSubtract",
		fn: "dateSubtract",
		args: [{ name: 'date', types: ["date"] }, { name: 'amount', types: ["number"] }, { name: 'type', types: ["text"] }],
		description: "Subtract an amount from a date",
		category: "Date",
		difficulty: 2
	},
	dateBetween: {
		name: "dateBetween",
		fn: "dateBetween",
		args: [{ name: 'date1', types: ["date"] }, { name: 'date2', types: ["date"] }, { name: 'type', types: ["text"] }],
		returnType: "number",
		description: "Get the difference between two dates",
		category: "Date",
		difficulty: 2
	},

	spaceItems: {
		name: "spaceItems",
		fn: "spaceItems",
		args: [{ name: 'path', types: ["text"] }],
		returnType: "link-multi",
		description: "Get the items inside of a path",
		category: "Path",
		difficulty: 2
	},
	spaces: {
		name: "spaces",
		fn: "spaces",
		args: [{ name: 'path', types: ["text"] }],
		returnType: "link-multi",
		description: "Get the spaces the path is inside of",
		category: "Path",
		difficulty: 2
	},

	timeStamp: {
		name: "timeStamp",
		fn: "timeStamp",
		args: [{ name: 'date', types: ["date"] }],
		returnType: "number",
		description: "Get the timestamp of a date",
		category: "Date",
		difficulty: 1
	},
	at: {
		name: "at",
		fn: "at",
		args: [{ name: 'list', types: ["any-list"] }, { name: 'index', types: ["number"] }],
		returnType: "any",
		description: "Get an element at a specific index",
		category: "List",
		difficulty: 2
	},
	first: {
		name: "first",
		fn: "first",
		args: [{ name: 'list', types: ["any-multi"] }],
		returnType: "any",
		description: "Get the first element of a list",
		category: "List",
		difficulty: 1
	},
	last: {
		name: "last",
		fn: "last",
		args: [{ name: 'list', types: ["any-multi"] }],
		returnType: "any",
		description: "Get the last element of a list",
		category: "List",
		difficulty: 1
	},
	concat: {
		name: "concat",
		fn: "concat",
		args: [{ name: 'list 1', types: ["any-multi"] }, { name: 'list 2', types: ["any-multi"] }],
		returnType: "any-multi",
		description: "Concatenate two lists",
		category: "List",
		difficulty: 1
	},
	sort: {
		name: "sort",
		fn: "sort",
		args: [{ name: 'list', types: ["any-multi"] }],
		returnType: "any-multi",
		description: "Sort a list",
		category: "List",
		difficulty: 1
	},
	reverse: {
		name: "reverse",
		fn: "reverse",
		args: [{ name: 'list', types: ["any-multi"] }],
		returnType: "any-multi",
		description: "Reverse a list",
		category: "List",
		difficulty: 1
	},
	join: {
		name: "join",
		fn: "join",
		args: [{ name: 'list', types: ["text-multi"] }, { name: 'separator', types: ["text"] }],
		returnType: "text",
		description: "Turn a list into text separator",
		category: "List",
		difficulty: 1
	},
	includes: {
		name: "includes",
		fn: "includes",
		args: [{ name: 'list', types: ["any-multi"] }, { name: 'value', types: ["any"] }],
		returnType: "boolean",
		description: "Check if a list includes a value",
		category: "List",
		difficulty: 1
	},
	split: {
		name: "split",
		fn: "split",
		args: [{ name: 'string', types: ["text"] }, { name: 'separator', types: ["text"] }],
		returnType: "text-multi",
		description: "Split text into a list using a separator",
		category: "String",
		difficulty: 1
	},
	formatDate: {
		name: "formatDate",
		fn: "formatDate",
		args: [{ name: 'date', types: ["date"] }, { name: 'format', types: ["text"] }],
		returnType: "text",
		description: "Format a date into text",
		category: "Date",
		difficulty: 2
	},
	parseDate: {
		name: "parseDate",
		fn: "parseDate",
		args: [{ name: 'date', types: ["text"] }],
		returnType: "date",
		description: "Transform date from text",
		category: "Date",
		difficulty: 1
	},
	find: {
		name: "find",
		fn: "find",
		args: [{ name: 'list', types: ["any-multi"] }, { name: 'condition', types: ["boolean"] }],
		returnType: "any",
		description: "Find an element in a list",
		category: "List",
		difficulty: 2
	},
	findIndex: {
		name: "findIndex",
		fn: "findIndex",
		args: [{ name: 'list', types: ["any-multi"] }, { name: 'condition', types: ["boolean"] }],
		returnType: "number",
		description: "Find the index of an element in a list",
		category: "List",
		difficulty: 2
	},
	filter: {
		name: "filter",
		fn: "filter",
		args: [{ name: 'list', types: ["any-multi"] }, { name: 'condition', types: ["boolean"] }],
		returnType: "any-multi",
		description: "Filter a list based on a condition",
		category: "List",
		difficulty: 2
	},
	map: {
		name: "map",
		fn: "map",
		args: [{ name: 'list', types: ["any-multi"] }, { name: 'formula', types: ["any"] }],
		returnType: "any-multi",
		description: "Change all the values in a list based on a formula",
		category: "List",
		difficulty: 2
	},
	some: {
		name: "some",
		fn: "some",
		args: [{ name: 'list', types: ["any-multi"] }, { name: 'condition', types: ["boolean"] }],
		returnType: "boolean",
		description: "Check if some elements in a list are true",
		category: "List",
		difficulty: 2
	},
	every: {
		name: "every",
		fn: "every",
		args: [{ name: 'list', types: ["any-multi"] }, { name: 'condition', types: ["boolean"] }],
		returnType: "boolean",
		description: "Check if every element in a list is true",
		category: "List",
		difficulty: 2
	},
	flat: {
		name: "flat",
		fn: "flat",
		args: [{ name: 'list', types: ["any-multi"] }],
		returnType: "any-multi",
		description: "Flatten a list of lists into a single list",
		category: "List",
		difficulty: 2
	},
	path: {
		name: "path",
		fn: "path",
		args: [{ name: 'path', types: ["text"] }],
		returnType: 'link',
		description: "Get the path object of a path",
		category: "Path",
		difficulty: 2
	},
	let: {
		name: "let",
		fn: "let",
		args: [{ name: 'variable', types: ["text"] }, { name: 'value', types: ["any"] }, { name: 'formula', types: ["any"] }],
		returnType: "any",
		description: "Define a variable to use in a formula",
		category: "Variable",
		difficulty: 3
	},
	lets: {
		name: "lets",
		fn: "lets",
		args: [{ name: 'variable', types: ["text"] }, { name: 'value', types: ["any"] }, { name: '...', types: [] }, { name: 'formula', types: ["any"] }],
		returnType: "any",
		description: "Define multiple variables to use in a formula",
		category: "Variable",
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
	description: string;
	category: string;
	difficulty?: number;
};

