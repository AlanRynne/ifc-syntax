import { Ifc2Ast } from "@alanrynne/ifc-syntax-ast-parser"
import { documents } from "./server"

class IfcDocumentManager {
  private openDocuments: Map<string, any>
  constructor() {
    this.openDocuments = new Map<string, any>()
  }

  async get(uri: string) {
    let ast = this.openDocuments[uri]
    if (ast) {
      return ast
    }
    return await this.parseDocument(uri)
  }

  async update(uri: string) {
    console.log("updating ast of doc:", uri)
    this.openDocuments[uri] = await this.parseDocument(uri)
  }

  delete(uri: string) {
    console.log("deleting ast for doc: ", uri)
    return this.openDocuments.delete(uri)
  }

  private async parseDocument(uri) {
    let doc = documents.get(uri)
    let text = doc ? doc.getText() : null
    if (text) {
      return await new Ifc2Ast().parseIfcFile(text.split("\n"), true)
    }
  }
}

export default IfcDocumentManager
