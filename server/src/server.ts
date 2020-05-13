/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import {
    createConnection,
    TextDocuments,
    ProposedFeatures,
    InitializeParams,
    DidChangeConfigurationNotification,
    TextDocument,
    CancellationToken,
    Definition,
    Location,
    TextDocumentPositionParams,
    DocumentSymbolParams,
    DocumentSymbol,
    SymbolKind
} from 'vscode-languageserver';
import { validateTextDocument } from './validateTextDocument';
import { Ifc2Ast, DefinitionVisitor, PositionVisitor } from "ifc2ast";

import { DocumentNode } from 'ifc2ast/out/ast/nodes';
import { IfcSyntaxSettings, DefaultSettings } from './IfcSyntaxSettings';

// Create a connection for the server. The connection uses Node's IPC as a transport.
// Also include all preview / proposed LSP features.
export let connection = createConnection(ProposedFeatures.all);
import './hoverHandler';
import './completionHandler';

// Create a simple text document manager. The text document manager
// supports full document sync only
export let documents: TextDocuments = new TextDocuments();

// Create a map to hold the AST `DocumentNode`s of each file
export let documentsAST: Map<string, DocumentNode> = new Map<string, DocumentNode>();

// Setup configuration flags
export let hasConfigurationCapability: boolean = false;
let hasWorkspaceFolderCapability: boolean = false;
export let hasDiagnosticRelatedInformationCapability: boolean = false;

connection.onDefinition((params: TextDocumentPositionParams) => {
    return Location.create(params.textDocument.uri, {
        start: { line: 2, character: 5 },
        end: { line: 2, character: 6 }
    });
});

connection.onDocumentSymbol((params: DocumentSymbolParams) => {
    let symbol = DocumentSymbol.create('A symbol', 'A symbol detail', SymbolKind.Variable, {
        start: { line: 2, character: 5 },
        end: { line: 2, character: 9 }
    }, {
        start: { line: 2, character: 5 },
        end: { line: 2, character: 6 }
    });
    return [symbol];
});

connection.onInitialize((params: InitializeParams) => {
    let capabilities = params.capabilities;

    // Does the client support the `workspace/configuration` request?
    // If not, we will fall back using global settings
    hasConfigurationCapability = !!(
        capabilities.workspace && !!capabilities.workspace.configuration
    );
    hasWorkspaceFolderCapability = !!(
        capabilities.workspace && !!capabilities.workspace.workspaceFolders
    );
    hasDiagnosticRelatedInformationCapability = !!(
        capabilities.textDocument &&
        capabilities.textDocument.publishDiagnostics &&
        capabilities.textDocument.publishDiagnostics.relatedInformation
    );
    return {
        capabilities: {
            workspace: {
                workspaceFolders: {
                    supported: hasWorkspaceFolderCapability,
                    changeNotifications: true
                }
            },
            textDocumentSync: documents.syncKind,
            // Tell the client that the server supports code completion
            completionProvider: {
                resolveProvider: true,
            },
            hoverProvider: true,
            definitionProvider: true,
            documentSymbolProvider: true
        }
    };
});

connection.onInitialized(() => {
    if (hasConfigurationCapability) {
        // Register for all configuration changes.
        connection.client.register(DidChangeConfigurationNotification.type, undefined);
    }
    if (hasWorkspaceFolderCapability) {
        connection.workspace.onDidChangeWorkspaceFolders(_event => {
            connection.console.log('Workspace folder change event received.');
        });
    }

});

export let globalSettings: IfcSyntaxSettings = DefaultSettings;

// Cache the settings of all open documents
export let documentSettings: Map<string, Thenable<IfcSyntaxSettings>> = new Map();

connection.onDidChangeConfiguration(change => {

    if (hasConfigurationCapability) {
        // Reset all cached document settings
        documentSettings.clear();
    } else {
        globalSettings = <IfcSyntaxSettings>(
            (change.settings.ifcSyntax || DefaultSettings)
        );
    }
    // Revalidate all open ifc documents
    documents.all().forEach(validateTextDocument);
});

connection.onDidChangeWatchedFiles(_change => {
    // Monitored files have change in VSCode
    connection.console.log(`We received an file change event ${_change.changes[0].uri}`);
});

// Only keep settings for open documents
documents.onDidClose(e => {
    documentSettings.delete(e.document.uri);
});

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent(change => {
    connection.console.log('file content was changed');
    validateTextDocument(change.document);
});

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();