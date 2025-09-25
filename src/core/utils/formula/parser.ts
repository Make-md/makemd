import * as math from "mathjs"
import { IndexMap } from "shared/types/indexMap"
import { DBRow, SpaceProperty } from "shared/types/mdb"
import { PathState } from "shared/types/PathState"
import { parseProperty } from "utils/parsers"
import { formulas } from "./formulas"


export function compact<T>(arr: T[]): NonNullable<T>[] {
	return arr.filter(Boolean) as NonNullable<T>[]
}

export function unreachable(never: never): never {
	throw new Error(`Expected value to never occur: ${JSON.stringify(never)}`)
}





export type FormulaFunctionNode = {
	type: "function"
	name: string
	args: FormulaNode[]
}

export type FormulaPropertyNode = {
	type: "property"
	name: string
	propertyType: string
}

export type FormulaLiteralNode = {
	type: "literal"
	value: string
}

export type FormulaParenthesesNode = {
	type: "parentheses"
	inner: FormulaNode
}

export type FormulaOperatorNode = {
	type: "operator"
	operator: string
	args: FormulaNode[]
}

export type FormulaConditionalNode = {
	type: "conditional"
	condition: FormulaNode
	ifTrue: FormulaNode
	ifFalse: FormulaNode
}

export type FormulaErrorNode = {
	type: "error"
	message: string
}

export type FormulaSymbolNode = {
	type: "symbol"
	name: string
}

export type FormulaNode =
	| FormulaFunctionNode
	| FormulaPropertyNode
	| FormulaLiteralNode
	| FormulaParenthesesNode
	| FormulaOperatorNode
	| FormulaConditionalNode
	| FormulaErrorNode
	| FormulaSymbolNode

type FormulaParserResult = {
	formula: FormulaNode | undefined
	errors: string[]
}


export function parseFormula(
	oldFormula: string,
	propMap: SpaceProperty[]
): FormulaParserResult {
	try {
		const mathNode = math.parse(oldFormula)
		const formulaNode = nodeToFormula(mathNode, propMap, [])
		return formulaNode
			? {
					formula: formulaNode,
					errors: [],
			}
			: {
					formula: undefined,
					errors: ["Could not parse formula 😭"],
            }
	} catch (e) {
		return {
			formula: undefined,
			errors: ["Could not parse formula 😭"],
		}
	}
}

function nodeToFormula(
	node: math.MathNode | undefined,
	propMap: SpaceProperty[],
	errors: string[]
): FormulaNode | undefined {
	if (!node) {
		return
	}
	if (
		node.type === "AccessorNode" ||
		node.type === "ArrayNode" ||
		node.type === "AssignmentNode" ||
		node.type === "BlockNode" ||
		node.type === "FunctionAssignmentNode" ||
		node.type === "IndexNode" ||
		node.type === "ObjectNode" ||
		node.type === "RangeNode"
	) {
		const error = {
			type: "error" as const,
			message: "Invalid syntax: " + node.toString(),
		}
		errors.push(error.message)
		return error
	} else if (node.type === "ConditionalNode") {
		const condition = nodeToFormula((node as math.ConditionalNode).condition, propMap, errors)
		const trueExpr = nodeToFormula((node as math.ConditionalNode).trueExpr, propMap, errors)
		const falseExpr = nodeToFormula((node as math.ConditionalNode).falseExpr, propMap, errors)
		if (!condition) {
			return
		}
		if (condition.type === "error") {
			return condition
		}
		if (trueExpr && trueExpr.type === "error") {
			return trueExpr
		}
		if (falseExpr && falseExpr.type === "error") {
			return falseExpr
		}
		if (!trueExpr || !falseExpr) {
			const error = {
				type: "error" as const,
				message: "Invalid conditional: " + node.toString(),
			}
			errors.push(error.message)
			return error
		}
		return {
			type: "conditional",
			condition,
			ifTrue: trueExpr,
			ifFalse: falseExpr,
		}
	} else if (node.type === "ConstantNode") {
		return {
			type: "literal",
			value:
				(typeof (node as math.ConstantNode).value === "string"
					? // Preserver \n, \" and \t for strings
					  `"${((node as math.ConstantNode).value as unknown as string)
							.replace(/\n/g, "\\n")
							.replace(/"/g, '\\"')
							.replace(/\t/g, "\\t")}"`
					: (node as math.ConstantNode).value) as string,
		}
	} else if (node.type === "FunctionNode") {
		const { fn, args } = node as math.FunctionNode
		if (fn.name === "prop") {
			if (args.length !== 1) {
				return {
					type: "error",
					message: "Too many arguments passed to prop().",
				}
			}
			const arg = args[0]
			if (arg.type !== "ConstantNode") {
				const error = {
					type: "error" as const,
					message: "Invalid property reference: " + arg.toString(),
				}
				errors.push(error.message)
				return error
			}
			const value = (arg as math.ConstantNode).value as unknown as string;
			return {
				type: "property",
				name: value,
				propertyType: propMap.find(f => f.name == value)?.type ?? "other",
			}
		}
		const functionArgs: FormulaNode[] = compact(
			(args || []).map(arg => nodeToFormula(arg, propMap, errors))
		)
		// Note: Does not check for invalid functions.
		return {
			type: "function",
			name: fn.name,
			args: functionArgs,
		}
	} else if (node.type === "OperatorNode") {
		const { op, args } = node as math.OperatorNode

		const functionArgs: FormulaNode[] = compact(
			(args || []).map(arg => nodeToFormula(arg, propMap, errors))
		)
		// Note: Does not check for invalid operators.
		return {
			type: "operator",
			operator: op,
			args: functionArgs,
		}
	} else if (node.type === "ParenthesisNode") {
		return nodeToFormula((node as math.ParenthesisNode).content, propMap, errors)
	} else if (node.type === "SymbolNode") {
		const { name } = node as math.SymbolNode
		if (["e", "pi", "true", "false"].includes(name)) {
			return {
				type: "symbol",
				name,
			}
		} else {
			const error = {
				type: "error" as const,
				message: "Undefined constant:" + name,
			}
			errors.push(error.message)
			return error
		}
	}
	return
}
export const runFormulaNode = (node: FormulaNode, propMap: DBRow): string => {
	const all = {
		...math.all,
		createAdd: math.factory('add', [], () => function add (a: any, b: any) {
			return a + b
		  }),
		  createEqual: math.factory('equal', [], () => function equal (a: any, b: any) {
			return a == b
		  }),
		  createUnequal: math.factory('unequal', [], () => function unequal (a: any, b: any) {
			return a != b
		  })
		  
		
	}
	const config :math.ConfigOptions = {
		matrix: "Array"
	}
	const runContext = math.create(all, config)
	runContext.import(formulas, { override: true })
	if (node.type === "literal") {
		return node.value
	} else if (node.type === "property") {
		return propMap[node.name] ?? ""
	} else if (node.type === "function") {
		const args = node.args.map(f => runFormulaNode(f, propMap))
		if (node.name === "prop") {
			return args[0]
		}
		return runContext.evaluate(`${node.name}(${args.join(",")})`)
	} else if (node.type === "operator") {
		const args = node.args.map(f => runFormulaNode(f, propMap))
		return runContext.evaluate(`${args.join(node.operator)}`)
	} else if (node.type === "conditional") {
		const condition = runFormulaNode(node.condition, propMap)
		if (condition === "true") {
			return runFormulaNode(node.ifTrue, propMap)
		} else {
			return runFormulaNode(node.ifFalse, propMap)
		}
	} else if (node.type === "error") {
		return ""
	} else if (node.type === "symbol") {
		if (node.name === "true") {
			return "true"
		} else if (node.name === "false") {
			return "false"
		} else if (node.name === "pi") {
			return "3.141592653589793"
		} else if (node.name === "e") {
			return "2.718281828459045"
		}
	}
	return ""
}

export const runExec = (paths: Map<string, PathState>, spaceMap: IndexMap, exec: (scope: any) => string, properties: {[key: string]: SpaceProperty}, values: {[key: string] : any}, path?: string): string => {
	const scope = new Map();
	Object.keys(values).forEach(f => scope.set(f, values[f]))
	scope.set("$properties", properties)
	scope.set("$paths", paths)
	scope.set("$items", spaceMap.invMap)
	scope.set("$spaces", spaceMap.map)
	if (path)
		scope.set("$current", paths?.get(path))
	return exec(scope)
}

export const runFormulaWithContext = (runContext: math.MathJsInstance, paths: Map<string, PathState>, spaceMap: IndexMap, formula: string, properties: {[key: string]: SpaceProperty}, values: {[key: string] : any}, path?: PathState, emitError?: boolean): string => {
	if (!formula) return ""
	
	const scope = new Map();
	Object.keys(values).forEach(f => scope.set(f, values[f]))
	scope.set("$properties", properties)
	scope.set("$paths", paths)
	scope.set("$items", spaceMap.invMap)
	scope.set("$spaces", spaceMap.map)
	if (path)
		scope.set("$current", path)
	let value;
	
	try {
		runContext.evaluate("current = _current()", scope)
		value = runContext.evaluate(formula, scope)
		value = parseProperty("", value)
		if (typeof value != "string") {
			if (emitError) throw(value)
		}
	} catch (e) {
		value = ""
		if (emitError) console.log(e)
	}
	return  value
}

export const runFormula = (paths: Map<string, PathState>, spaceMap: IndexMap, formula: string, properties: {[key: string]: SpaceProperty}, values: {[key: string] : any}, path?: string): string => {
	if (!formula) return ""
	// const parsed = parseFormula(formula, propMap)
	// if (parsed.errors.length > 0) {
	// 	return parsed.errors.join("\n")
	// }
	const scope = new Map();
	Object.keys(values).forEach(f => scope.set(f, values[f]))
	scope.set("$properties", properties)
	scope.set("$paths", paths)
	scope.set("$items", spaceMap.invMap)
	scope.set("$spaces", spaceMap.map)
	if (path)
		scope.set("$current", paths?.get(path))
	const all = {
		...math.all,
		createAdd: math.factory('add', [], () => function add (a: any, b: any) {
			return a + b
		  }),
		  createEqual: math.factory('equal', [], () => function equal (a: any, b: any) {
			return a == b
		  }),
		  createUnequal: math.factory('unequal', [], () => function unequal (a: any, b: any) {
			return a != b
		  })
		
	}
	const config :math.ConfigOptions = {
		matrix: "Array"
	}
	const runContext = math.create(all, config)
	runContext.import(formulas, { override: true })
	let value;
	try {
		value = runContext.evaluate(formula, scope)
		value = parseProperty("", value)
	} catch (e) {
	}
	return  value
}

