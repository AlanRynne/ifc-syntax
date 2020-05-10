import { TextDocumentPositionParams, Hover } from 'vscode-languageserver';
import { connection, documents } from './server';

connection.onHover((params: TextDocumentPositionParams): Hover => {
    connection.console.log(`Client asked for hover on ${params.position.line}:${params.position.character}`);
    let doc = documents.get(params.textDocument.uri);
    let lineRange = {
        start: {
            line: params.position.line,
            character: 0
        },
        end: {
            line: params.position.line,
            character: 10
        }
    };
    let hoverText = doc ? doc.getText(lineRange) : 'Something!';
    let h: Hover = {
        contents: hoverText,
        range: lineRange
    };
    return h;
});
