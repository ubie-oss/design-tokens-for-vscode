import DesignTokens from '@ubie/design-tokens';
import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  CompletionItem,
  CompletionItemKind,
  TextDocumentPositionParams,
  TextDocumentSyncKind,
  InitializeResult,
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager.
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

connection.onInitialize(() => {
  const result: InitializeResult = {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      // Tell the client that this server supports code completion.
      completionProvider: {
        triggerCharacters: ['--'],
      },
    },
  };
  return result;
});

type GroupedCompletionItemsKey = keyof typeof DesignTokens;

type GroupedCompletionItemPatterns = {
  [T in GroupedCompletionItemsKey]: RegExp;
};

const groupedCompletionItemPatterns: GroupedCompletionItemPatterns = {
  color: /color|background|shadow|border|column-rule|filter|opacity|outline|text-decoration/,
  size: /margin|padding|gap|top|left|right|bottom|width|height/,
  text: /font|line-height/,
};

// This handler provides the list of the token completion items.
connection.onCompletion((textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
  const doc = documents.get(textDocumentPosition.textDocument.uri);

  // if the doc can't be found, return nothing
  if (!doc) {
    return [];
  }

  const currentText = doc.getText({
    start: { line: textDocumentPosition.position.line, character: 0 },
    end: { line: textDocumentPosition.position.line, character: 1000 },
  });

  const groupKeys = Object.keys(DesignTokens);
  const allCompletionItems: CompletionItem[] = [];
  const filteredCompletionItems: CompletionItem[] = [];

  groupKeys.forEach((groupKey) => {
    Object.keys(DesignTokens[groupKey]).map((key) => {
      const token = `--${groupKey}-${key}`;
      const note = DesignTokens[groupKey][key].attributes['note'] ?? '';
      allCompletionItems.push({
        label: token,
        detail: `${DesignTokens[groupKey][key].value}${note ? ` (${note})` : ''}`,
        insertText: `var(${token});`,
        kind: groupKey === 'color' ? CompletionItemKind.Color : CompletionItemKind.Value,
      });
    });
  });

  groupKeys.forEach((groupKey) => {
    if (groupedCompletionItemPatterns[groupKey].test(currentText)) {
      // Filter items for `line-height`, `font-size`, and others
      if (/line-height/.test(currentText)) {
        filteredCompletionItems.push(
          ...allCompletionItems.filter(
            (item) => item.label.startsWith(`--${groupKey}-`) && item.label.endsWith('line'),
          ),
        );
      } else if (/font-size/.test(currentText)) {
        filteredCompletionItems.push(
          ...allCompletionItems.filter(
            (item) => item.label.startsWith(`--${groupKey}-`) && item.label.endsWith('size'),
          ),
        );
      } else {
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
