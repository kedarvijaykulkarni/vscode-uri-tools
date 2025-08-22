import * as vscode from 'vscode';

function encodeText(text: string): string {
  try {
    // Use encodeURI for URL-safe encoding but preserve reserved characters in query components?
    // For general-purpose, encodeURIComponent is safer; keep as user-friendly default.
    return encodeURIComponent(text);
  } catch (err: any) {
    throw new Error(`Failed to encode text: ${err?.message || String(err)}`);
  }
}

function decodeText(text: string): string {
  try {
    // Try decodeURIComponent first; if it fails, fall back to decodeURI
    try {
      return decodeURIComponent(text);
    } catch {
      return decodeURI(text);
    }
  } catch (err: any) {
    throw new Error(`Failed to decode text: ${err?.message || String(err)}`);
  }
}

async function replaceSelections(editor: vscode.TextEditor, mapper: (t: string) => string) {
  const { document, selections } = editor;
  await editor.edit(editBuilder => {
    if (selections.some(s => !s.isEmpty)) {
      // Replace each non-empty selection independently
      for (const sel of selections) {
        if (!sel.isEmpty) {
          const text = document.getText(sel);
          const mapped = mapper(text);
          editBuilder.replace(sel, mapped);
        }
      }
    } else {
      // No selection: operate on entire document
      const fullRange = new vscode.Range(
        document.positionAt(0),
        document.positionAt(document.getText().length)
      );
      const text = document.getText(fullRange);
      const mapped = mapper(text);
      editBuilder.replace(fullRange, mapped);
    }
  });
}

async function encodeSelectionCmd() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) { return; }
  try {
    await replaceSelections(editor, encodeText);
    vscode.window.setStatusBarMessage('URI Tools: Encoded ✅', 2000);
  } catch (e: any) {
    vscode.window.showErrorMessage(e.message || String(e));
  }
}

async function decodeSelectionCmd() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) { return; }
  try {
    await replaceSelections(editor, decodeText);
    vscode.window.setStatusBarMessage('URI Tools: Decoded ✅', 2000);
  } catch (e: any) {
    vscode.window.showErrorMessage(e.message || String(e));
  }
}

async function encodeDocumentCmd() {
  return encodeSelectionCmd();
}

async function decodeDocumentCmd() {
  return decodeSelectionCmd();
}

async function encodeClipboardCmd() {
  try {
    const clip = await vscode.env.clipboard.readText();
    const out = encodeText(clip);
    await vscode.env.clipboard.writeText(out);
    vscode.window.setStatusBarMessage('URI Tools: Clipboard encoded ✅', 2000);
  } catch (e: any) {
    vscode.window.showErrorMessage(e.message || String(e));
  }
}

async function decodeClipboardCmd() {
  try {
    const clip = await vscode.env.clipboard.readText();
    const out = decodeText(clip);
    await vscode.env.clipboard.writeText(out);
    vscode.window.setStatusBarMessage('URI Tools: Clipboard decoded ✅', 2000);
  } catch (e: any) {
    vscode.window.showErrorMessage(e.message || String(e));
  }
}

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('uri-tools.encodeSelection', encodeSelectionCmd),
    vscode.commands.registerCommand('uri-tools.decodeSelection', decodeSelectionCmd),
    vscode.commands.registerCommand('uri-tools.encodeDocument', encodeDocumentCmd),
    vscode.commands.registerCommand('uri-tools.decodeDocument', decodeDocumentCmd),
    vscode.commands.registerCommand('uri-tools.encodeClipboard', encodeClipboardCmd),
    vscode.commands.registerCommand('uri-tools.decodeClipboard', decodeClipboardCmd),
  );
}

export function deactivate() {}
