import { default as init, parseFile } from "astexplorer-syn";
import synWasmUrl from "astexplorer-syn/astexplorer_syn_bg.wasm?url";
import { default as dlv } from "dlv";
import * as vscode from "vscode";
import { walkAst } from "./ast";

export function activate(context: vscode.ExtensionContext) {
	const isDev = context.extensionMode === vscode.ExtensionMode.Development;
	let timeout: ReturnType<typeof setTimeout> | undefined = undefined;

	const synReady = fetch(synWasmUrl)
		.then((response) => init(response))
		.catch((e) => {
			console.error(e);
			vscode.window.showErrorMessage(
				`Failed to load Rust language parser. Check extension host logs for details.`
			);
		});

	const testDecoration = vscode.window.createTextEditorDecorationType({
		// use a themable color. See package.json for the declaration and default values.
		backgroundColor: { id: "rustTestHighlight.backgroundColor" },
		// IDEA: should this be user configurable?
		isWholeLine: true,
		rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
	});

	let activeEditor = vscode.window.activeTextEditor;

	if (import.meta.env.MODE === "development") {
		writeSampleToEditor(activeEditor);
	}

	async function updateDecorations() {
		if (!activeEditor) {
			return;
		}

		if (!(await synReady)) {
			return;
		}

		const text = activeEditor.document.getText();
		const testBlocks: vscode.DecorationOptions[] = [];

		try {
			const ast = parseFile(text);

			walkAst(ast, (node, _parent): false | void => {
				if (!activeEditor) {
					return false;
				}

				if (dlv(node, "_type") === "ItemMod") {
					// IDEA: should the name of the test module be configurable by a user?
					if (dlv(node, "ident.to_string") === "tests") {
						const startLine = dlv(node, "span.start.line");
						const startCol = dlv(node, "span.start.column");
						const endLine = dlv(node, "span.end.line");
						const endCol = dlv(node, "span.end.column");

						const hasRangeInfo =
							typeof startLine === "number" &&
							typeof startCol === "number" &&
							typeof endLine === "number" &&
							typeof endCol === "number";

						if (!hasRangeInfo) {
							return false;
						}

						const startPos = new vscode.Position(clamp(startLine - 1, 0), clamp(startCol - 1, 0));
						const endPos = new vscode.Position(clamp(endLine - 1, 0), clamp(endCol, 0));

						const decoration = { range: new vscode.Range(startPos, endPos) };

						testBlocks.push(decoration);
					}
				}
			});
		} catch (error) {
			// TODO: allow a user to opt in to seeing errors?
			if (isDev) {
				console.error(error);
			}
		}

		if (testBlocks.length > 0) {
			activeEditor.setDecorations(testDecoration, testBlocks);
		}
	}

	function triggerUpdateDecorations(throttle = false) {
		if (timeout) {
			clearTimeout(timeout);
			timeout = undefined;
		}
		if (throttle) {
			timeout = setTimeout(updateDecorations, 500);
		} else {
			updateDecorations();
		}
	}

	if (activeEditor) {
		triggerUpdateDecorations();
	}

	vscode.window.onDidChangeActiveTextEditor(
		(editor) => {
			activeEditor = editor;
			if (editor) {
				triggerUpdateDecorations();
			}
		},
		null,
		context.subscriptions
	);

	vscode.workspace.onDidChangeTextDocument(
		(event) => {
			if (activeEditor && event.document === activeEditor.document) {
				triggerUpdateDecorations(true);
			}
		},
		null,
		context.subscriptions
	);
}

export function deactivate() {}

function clamp(num: number, min?: number, max?: number) {
	if (min !== undefined && num < min) {
		return min;
	}

	if (max !== undefined && num > max) {
		return max;
	}

	return num;
}

function writeSampleToEditor(editor?: vscode.TextEditor) {
	setTimeout(() => {
		editor?.edit((b) => {
			b.insert(
				new vscode.Position(0, 0),
				`
	
					
// cool comment but not part of the module

/// some docs
///
///
/// wooo
#[cfg(test)]
mod tests {
		#[test]
		fn it_works() {
				
		}
}							
			`
			);
		});
	}, 500);
}
