import * as vscode from "vscode";
import {
  clamp,
  findRustTestModules,
  findVitestBlocks,
} from "./parser";


export function activate(context: vscode.ExtensionContext) {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  let rustTestDecoration: vscode.TextEditorDecorationType | undefined;
  let typescriptVitestDecoration: vscode.TextEditorDecorationType | undefined;
  let highlightingEnabled = true;

  let activeEditor = vscode.window.activeTextEditor;

  if (import.meta.env.MODE === "development") {
    import("./sample").then((module) => {
      if (activeEditor != null) {
        writeSampleRustToEditor(activeEditor, module.getSampleRustCode());
        writeSampleTypeScriptToNewTab(module.getSampleTypeScriptCode());
      }
    });
  }


  async function updateDecorations(): Promise<void> {
    if (activeEditor == null || highlightingEnabled === false) {
      // Clear all decorations if highlighting is disabled
      if (highlightingEnabled === false && activeEditor != null) {
        if (rustTestDecoration != null) {
          activeEditor.setDecorations(rustTestDecoration, []);
        }
        if (typescriptVitestDecoration != null) {
          activeEditor.setDecorations(typescriptVitestDecoration, []);
        }
      }
      return;
    }

    const languageId = activeEditor.document.languageId;
    const text = activeEditor.document.getText();

    switch (languageId) {
      case "rust":
        await updateRustDecorations(text);
        // Clear TypeScript decorations if switching from TS/JS to Rust
        if (typescriptVitestDecoration != null) {
          activeEditor.setDecorations(typescriptVitestDecoration, []);
        }
        break;

      case "typescript":
      case "javascript":
        updateTypescriptDecorations(text);
        // Clear Rust decorations if switching from Rust to TS/JS
        if (rustTestDecoration != null) {
          activeEditor.setDecorations(rustTestDecoration, []);
        }
        break;
    }
  }

  async function updateRustDecorations(text: string): Promise<void> {
    if (activeEditor == null) {
      return;
    }

    const testModules = findRustTestModules(text);
    const testBlocks: Array<vscode.DecorationOptions> = testModules.map((module) => {
      const startPos = new vscode.Position(
        clamp(module.startLine, 0),
        clamp(module.startColumn, 0),
      );
      const endPos = new vscode.Position(
        clamp(module.endLine, 0),
        clamp(module.endColumn, 0),
      );
      return { range: new vscode.Range(startPos, endPos) };
    });

    if (testBlocks.length > 0) {
      // we have tests to highlight, create the decoration if one does not yet exist
      rustTestDecoration ??= vscode.window.createTextEditorDecorationType({
        // use a themable color. See package.json for the declaration and default values.
        backgroundColor: { id: "rustTestHighlight.backgroundColor" },
        // IDEA: should this be user configurable?
        isWholeLine: true,
        rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
      });

      activeEditor.setDecorations(rustTestDecoration, testBlocks);
    } else {
      // we do not have tests to highlight, so get rid of the decorations if they still exist
      rustTestDecoration?.dispose();
      rustTestDecoration = undefined;
    }
  }

  function updateTypescriptDecorations(text: string): void {
    if (activeEditor == null) {
      return;
    }

    const vitestBlocks = findVitestBlocks(text);
    const decorations: Array<vscode.DecorationOptions> = vitestBlocks.map(
      (block) => {
        const startPos = new vscode.Position(
          clamp(block.startLine, 0),
          clamp(block.startColumn, 0),
        );
        const endPos = new vscode.Position(
          clamp(block.endLine, 0),
          clamp(block.endColumn, 0),
        );
        return { range: new vscode.Range(startPos, endPos) };
      },
    );

    if (decorations.length > 0) {
      typescriptVitestDecoration ??=
        vscode.window.createTextEditorDecorationType({
          backgroundColor: { id: "rustTestHighlight.backgroundColor" },
          isWholeLine: true,
          rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
        });

      activeEditor.setDecorations(typescriptVitestDecoration, decorations);
    } else {
      typescriptVitestDecoration?.dispose();
      typescriptVitestDecoration = undefined;
    }
  }

  function triggerUpdateDecorations(throttle = false): void {
    if (timeout != null) {
      clearTimeout(timeout);
      timeout = undefined;
    }
    if (throttle) {
      timeout = setTimeout(() => {
        updateDecorations().catch(() => {
          // Handle error silently
        });
      }, 500);
    } else {
      updateDecorations().catch(() => {
        // Handle error silently
      });
    }
  }

  if (activeEditor != null) {
    triggerUpdateDecorations();
  }

  vscode.window.onDidChangeActiveTextEditor(
    (editor) => {
      activeEditor = editor;
      if (editor != null) {
        triggerUpdateDecorations();
      }
    },
    null,
    context.subscriptions,
  );

  vscode.workspace.onDidChangeTextDocument(
    (event) => {
      if (activeEditor != null && event.document === activeEditor.document) {
        triggerUpdateDecorations(false);
      }
    },
    null,
    context.subscriptions,
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "rust-test-highlight.toggle-highlight",
      () => {
        highlightingEnabled = !highlightingEnabled;
        const status = highlightingEnabled ? "enabled" : "disabled";
        vscode.window.showInformationMessage(`Test highlighting ${status}`);
        triggerUpdateDecorations();
      },
    ),
  );
}

export function deactivate() {}

function writeSampleRustToEditor(editor: vscode.TextEditor, content: string): void {
  setTimeout(() => {
    editor.edit((b) => {
      b.insert(new vscode.Position(0, 0), content);
    });
  }, 1000);
}

function writeSampleTypeScriptToNewTab(content: string): void {
  setTimeout(() => {
    vscode.workspace
      .openTextDocument({
        language: "typescript",
        content: content,
      })
      .then((doc) => {
        vscode.window.showTextDocument(doc, {
          viewColumn: vscode.ViewColumn.Beside,
        });
      });
  }, 2000);
}
