import * as path from "path"
import * as vscode from "vscode"

import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind
} from "vscode-languageclient"
import { IfcHeadInfoProvider } from "./ifcHeadTreeProvider"

let client: LanguageClient

export function activate(context: vscode.ExtensionContext) {
  console.log("IFC-Syntax has been activated.")

  const ifcHeaderProvider = new IfcHeadInfoProvider()
  vscode.window.registerTreeDataProvider("ifcHeader", ifcHeaderProvider)
  vscode.window.registerUriHandler({
    handleUri(uri: vscode.Uri) {
      let query: any = parseQueryString(uri.query)
      client.sendRequest("ifc-syntax.docs", query).then(value => {
        vscode.commands.executeCommand("ifcSyntax.openDocsViewer", uri, value)
      })
    }
  })
  registerCommands(context)

  // The server is implemented in node
  let serverModule = context.asAbsolutePath(
    path.join("server", "out", "server.js")
  )
  // The debug options for the server
  let debugOptions = { execArgv: ["--nolazy", "--inspect=6009"] }

  let serverOptions: ServerOptions = {
    run: {
      module: serverModule,
      transport: TransportKind.ipc
    },
    debug: {
      module: serverModule,
      transport: TransportKind.ipc,
      options: debugOptions
    }
  }
  interface Test {
    (value: string): vscode.Uri
  }

  // Options to control the language client
  let clientOptions: LanguageClientOptions = {
    // Register the server for ifc text documents
    documentSelector: [{ scheme: "file", language: "ifc" }],
    synchronize: {
      // Notify the server about file changes to '*.ifcconfig' files contained in the workspace
      fileEvents: vscode.workspace.createFileSystemWatcher("**/*.ifcconfig")
    }
  }

  // Create the language client and start the client.
  client = new LanguageClient(
    "ifcServer",
    "IFC Syntax Server",
    serverOptions,
    clientOptions
  )
  // Start the client. This will also launch the server
  client.start()
  console.log("Client has started")
}

let documentationPanel: vscode.WebviewPanel | undefined = undefined
let viewerPanel: vscode.WebviewPanel | undefined = undefined

function registerCommands(context: vscode.ExtensionContext) {
  const command = "ifcSyntax.openDocsViewer"
  const commandHandler = (uri: vscode.Uri, value: any) => {
    if (documentationPanel) {
      documentationPanel.reveal(undefined, true)
    } else {
      documentationPanel = vscode.window.createWebviewPanel(
        "ifcViewer",
        uri.path,
        vscode.ViewColumn.Two
      )
    }

    documentationPanel.onDidDispose(
      () => (documentationPanel = undefined),
      null,
      context.subscriptions
    )

    let queryObj = parseQueryString(uri.query)
    documentationPanel.title = queryObj.version + " - " + queryObj.name
    documentationPanel.webview.html = getDocsWebviewContent(
      uri.path,
      queryObj,
      value
    )
  }
  context.subscriptions.push(
    vscode.commands.registerCommand(command, commandHandler)
  )

  const viewerCommand = "ifcSyntax.threeDimensionalViewer"
  const viewerCommandHandler = () => {
    if (viewerPanel) {
      viewerPanel.reveal()
    } else {
      viewerPanel = vscode.window.createWebviewPanel(
        "ifcViewer",
        "IFC 3D",
        vscode.ViewColumn.Two
      )
    }
    viewerPanel.onDidDispose(
      () => (documentationPanel = undefined),
      null,
      context.subscriptions
    )

    viewerPanel.title = "IFC — 3D"
    viewerPanel.webview.html = get3DViewerWebviewContent()
  }
  context.subscriptions.push(
    vscode.commands.registerCommand(viewerCommand, viewerCommandHandler)
  )
}

export function deactivate(): Thenable<void> | undefined {
  if (!client) {
    return undefined
  }
  return client.stop()
}

function getDocsWebviewContent(path, query, entity) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${query.name}</title>
</head>
<body>
    <h1>IFC Syntax ${query.version} Docs</h1>
    <h2>${query.name}</h2>
    <p>${JSON.stringify(entity)}</p>
</body>
</html>`
}

function get3DViewerWebviewContent() {
  return `<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>IFC Syntax 3D window</title>
  </head>
  <body>
      <h1>IFC Syntax 3D Viewer</h1>
      <p>In progress... Viewer will go here</p>
  </body>
  </html>`
}
function parseQueryString(query: string): any {
  let pairs = query.split("&")
  let queryObj = {}
  pairs.forEach(pair => {
    let [key, value] = pair.split("=")
    queryObj[key] = value
  })
  return queryObj
}
