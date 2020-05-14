import { Location, TextDocumentPositionParams } from 'vscode-languageserver';

// TODO: Create IVisitor provider and hook it up.
export const processGoToDefinition = (params: TextDocumentPositionParams) => {
    return Location.create(params.textDocument.uri, {
        start: { line: 2, character: 5 },
        end: { line: 2, character: 6 }
    });
};
