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
  Hover,
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
      // Tell the client that this server supports hover.
      hoverProvider: true,
    },
  };
  return result;
});

type GroupedCompletionItemsKey = keyof typeof DesignTokens;

type GroupedCompletionItemPatterns = {
  [T in GroupedCompletionItemsKey]: RegExp;
};

const groupedCompletionItemPatterns: GroupedCompletionItemPatterns = {
  color: /color|background|shadow|border[^-radius]|column-rule|filter|opacity|outline|text-decoration/,
  size: /margin|padding|gap|top|left|right|bottom/,
  text: /font|line-height/,
  radius: /border-radius/,
  icon: /height|width/,
};

const tokens: { [key: string]: { value: string; note: string | undefined; groupKey: string } } = {};

Object.keys(DesignTokens).forEach((groupKey) => {
  Object.keys(DesignTokens[groupKey]).map((key) => {
    const token = `--${groupKey}-${key}`;
    const value = `${DesignTokens[groupKey][key].value}`;
    const note = DesignTokens[groupKey][key].attributes['note'] ?? '';
    tokens[token] = { value, note, groupKey };
  });
});

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

  const allCompletionItems: CompletionItem[] = [];
  const filteredCompletionItems: CompletionItem[] = [];

  Object.keys(tokens).map((token) => {
    allCompletionItems.push({
      label: token,
      detail: `${tokens[token].value}${tokens[token].note ? ` (${tokens[token].note})` : ''}`,
      insertText: `var(${token})`,
      kind: tokens[token].groupKey === 'color' ? CompletionItemKind.Color : CompletionItemKind.Value,
    });
  });

  Object.keys(DesignTokens).forEach((groupKey) => {
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

// This handler provides the hover information for the token.
connection.onHover((textDocumentPosition: TextDocumentPositionParams): Hover => {
  const doc = documents.get(textDocumentPosition.textDocument.uri);

  // if the doc can't be found, return nothing
  if (!doc) {
    return { contents: [] };
  }

  const currentText = doc.getText({
    start: { line: textDocumentPosition.position.line, character: 0 },
    end: { line: textDocumentPosition.position.line, character: 1000 },
  });

  const result = Object.keys(tokens).find((token) => {
    const indexOfFirst = currentText.indexOf(token);
    return (
      indexOfFirst > -1 &&
      indexOfFirst <= textDocumentPosition.position.character &&
      indexOfFirst >= textDocumentPosition.position.character - token.length
    );
  });

  if (result === undefined) {
    return {
      contents: [],
    };
  }

  return {
    contents: `${result}: ${tokens[result].value};${tokens[result].note ? ` /* ${tokens[result].note} */` : ''}`,
  };
});

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();
