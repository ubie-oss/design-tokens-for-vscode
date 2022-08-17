"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const design_tokens_1 = __importDefault(require("@ubie/design-tokens"));
const node_1 = require("vscode-languageserver/node");
const vscode_languageserver_textdocument_1 = require("vscode-languageserver-textdocument");
// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection = (0, node_1.createConnection)(node_1.ProposedFeatures.all);
// Create a simple text document manager.
const documents = new node_1.TextDocuments(vscode_languageserver_textdocument_1.TextDocument);
connection.onInitialize(() => {
    const result = {
        capabilities: {
            textDocumentSync: node_1.TextDocumentSyncKind.Incremental,
            // Tell the client that this server supports code completion.
            completionProvider: {
                triggerCharacters: ['--'],
            },
        },
    };
    return result;
});
const groupedCompletionItemPatterns = {
    color: /color|background|shadow|border|column-rule|filter|opacity|outline|text-decoration/,
    size: /margin|padding|gap|top|left|right|bottom/,
    text: /font|line-height/,
};
// This handler provides the list of the token completion items.
connection.onCompletion((textDocumentPosition) => {
    const doc = documents.get(textDocumentPosition.textDocument.uri);
    // if the doc can't be found, return nothing
    if (!doc) {
        return [];
    }
    const currentText = doc.getText({
        start: { line: textDocumentPosition.position.line, character: 0 },
        end: { line: textDocumentPosition.position.line, character: 1000 },
    });
    const groupKeys = Object.keys(design_tokens_1.default);
    const allCompletionItems = [];
    const filteredCompletionItems = [];
    groupKeys.forEach((groupKey) => {
        Object.keys(design_tokens_1.default[groupKey]).map((key) => {
            const token = `--${groupKey}-${key}`;
            allCompletionItems.push({
                label: token,
                detail: `${design_tokens_1.default[groupKey][key].value}`,
                insertText: `var(${token});`,
                kind: groupKey === 'color' ? node_1.CompletionItemKind.Color : node_1.CompletionItemKind.Value,
            });
        });
    });
    groupKeys.forEach((groupKey) => {
        if (groupedCompletionItemPatterns[groupKey].test(currentText)) {
            // Filter items for `line-height`, `font-size`, and others
            if (/line-height/.test(currentText)) {
                filteredCompletionItems.push(...allCompletionItems.filter((item) => item.label.startsWith(`--${groupKey}-`) && item.label.endsWith('line')));
            }
            else if (/font-size/.test(currentText)) {
                filteredCompletionItems.push(...allCompletionItems.filter((item) => item.label.startsWith(`--${groupKey}-`) && item.label.endsWith('size')));
            }
            else {
                filteredCompletionItems.push(...allCompletionItems.filter((item) => item.label.startsWith(`--${groupKey}-`)));
            }
        }
    });
    if (filteredCompletionItems.length > 0) {
        return filteredCompletionItems;
    }
    return allCompletionItems;
});
// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);
// Listen on the connection
connection.listen();
//# sourceMappingURL=server.js.map