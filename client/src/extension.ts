import * as path from "path"
import * as vscode from "vscode"

import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind
} from "vscode-languageclient"

import registerCommands from "./registerCommands"
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

export function deactivate(): Thenable<void> | undefined {
  if (!client) {
    return undefined
  }
  return client.stop()
}

export function parseQueryString(query: string): any {
  let pairs = query.split("&")
  let queryObj = {}
  pairs.forEach(pair => {
    let [key, value] = pair.split("=")
    queryObj[key] = value
  })
  return queryObj
}
