/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as path from 'path';
import * as vscode from 'vscode';

import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
    TransportKind
} from 'vscode-languageclient';
import { IfcHeadInfoProvider } from './ifcHeadTreeProvider';
// import { DepNodeProvider } from './nodeDependencies';

let client: LanguageClient;

// class IfcHover implements vscode.HoverProvider {
//     provideHover(
//         document: vscode.TextDocument,
//         position: vscode.Position,
//         token: vscode.CancellationToken): vscode.ProviderResult<vscode.Hover> {

//         throw new Error("Method not implemented.");
//     }
// }

export function activate(context: vscode.ExtensionContext) {
    console.log('IFC-Syntax has been activated.');

    const ifcHeaderProvider = new IfcHeadInfoProvider();
    vscode.window.registerTreeDataProvider('ifcHeader', ifcHeaderProvider);

    registerCommands(context);

    // The server is implemented in node
    let serverModule = context.asAbsolutePath(
        path.join('server', 'out', 'server.js')
    );

    // vscode.languages.registerHoverProvider('ifc', new IfcHover());

    // The debug options for the server
    // --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging
    let debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] };

    // If the extension is launched in debug mode then the debug server options are used
    // Otherwise the run options are used
    let serverOptions: ServerOptions = {
        run: {
            module: serverModule,
            transport: TransportKind.ipc
        },
        debug: {
            module: serverModule,
            transport: TransportKind.ipc,
            options: debugOptions,
        }
    };

    // Options to control the language client
    let clientOptions: LanguageClientOptions = {
        // Register the server for ifc text documents
        documentSelector: [{ scheme: 'file', language: 'ifc' }],
        synchronize: {
            // Notify the server about file changes to '*.ifcconfig' files contained in the workspace
            fileEvents: vscode.workspace.createFileSystemWatcher('**/*.ifcconfig'),
        }
    };

    // Create the language client and start the client.
    client = new LanguageClient(
        'ifcServer',
        'IFC Syntax Server',
        serverOptions,
        clientOptions
    );

    // Start the client. This will also launch the server
    client.start();
    console.log("Client has started");
}

function registerCommands(context: vscode.ExtensionContext) {
    const command = 'ifcSyntax.openViewer';
    const commandHandler = () => {
        const panel = vscode.window.createWebviewPanel('ifcViewer', 'IFC Viewer', vscode.ViewColumn.Two, {});
        // And set its HTML content
        panel.webview.html = getWebviewContent();
    };
    context.subscriptions.push(vscode.commands.registerCommand(command, commandHandler));
}

export function deactivate(): Thenable<void> | undefined {
    if (!client) {
        return undefined;
    }
    return client.stop();
}


function getWebviewContent() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cat Coding</title>
</head>
<body>
    <img src="https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif" width="300" />
</body>
</html>`;
}