import { type UnknownRecord } from "type-fest";

type Node = UnknownRecord;
type MaybeNode = UnknownRecord | null | undefined;
type Callback = (node: Node, parent: MaybeNode) => boolean | void;
type NodeCheck = (node: MaybeNode) => boolean;

export function walkAst(ast: Node, cb: Callback, isNode = isAstNode) {
	if (isNode(ast)) {
		walk(ast, null, cb, isNode);
	}
}

function isAstNode(node: MaybeNode): boolean {
	return node !== null && typeof node === "object" && typeof node._type === "string";
}

function walk(node: Node, parent: MaybeNode, cb: Callback, isNode: NodeCheck) {
	if (cb(node, parent) === false) {
		return;
	}

	for (const key in node) {
		if (Object.prototype.hasOwnProperty.call(node, key)) {
			const value = node[key] as MaybeNode | Array<MaybeNode>;

			if (Array.isArray(value)) {
				walkArray(value, node, cb, isNode);
			} else if (isNode(value)) {
				walk(value as Node, node, cb, isNode);
			}
		}
	}
}

function walkArray(nodes: Array<MaybeNode>, parent: MaybeNode, cb: Callback, isNode: NodeCheck) {
	for (const node of nodes) {
		if (isNode(node)) {
			walk(node as Node, parent, cb, isNode);
		}
	}
}
