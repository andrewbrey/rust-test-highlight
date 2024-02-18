import { default as init, parseFile } from "astexplorer-syn";
import synWasmUrl from "astexplorer-syn/astexplorer_syn_bg.wasm?url";
import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
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
	});

	let activeEditor = vscode.window.activeTextEditor;

	async function updateDecorations() {
		if (!activeEditor) {
			return;
		}

		if (!(await synReady)) {
			return;
		}

		const regEx = /#\[test\]/g;
		const text = activeEditor.document.getText();
		const testBlocks: vscode.DecorationOptions[] = [];

		try {
			let ast = parseFile(text);
			console.log(ast);
		} catch (error) {}

		let match;
		while ((match = regEx.exec(text))) {
			const startPos = activeEditor.document.positionAt(match.index);
			const endPos = activeEditor.document.positionAt(match.index + match[0].length);
			const decoration = {
				range: new vscode.Range(startPos, endPos),
			};

			testBlocks.push(decoration);
		}

		activeEditor.setDecorations(testDecoration, testBlocks);
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
