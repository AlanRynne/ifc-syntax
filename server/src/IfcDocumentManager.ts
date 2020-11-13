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
    return await this.parseDocument(uri).then(value => {
      console.log("document finished", uri)
      return value
    })
  }

  update(uri: string) {
    console.log("updating ast of doc:", uri)
    this.parseDocument(uri).then(value => {
      console.log("document finished", uri)
      this.openDocuments[uri] = value
    })
  }

  delete(uri: string) {
    console.log("deleting ast for doc: ", uri)
    return this.openDocuments.delete(uri)
  }

  private async parseDocument(uri) {
    console.log("parsing doc", uri)
    let doc = documents.get(uri)
    let text = doc ? doc.getText() : null
    if (text) {
      return await new Ifc2Ast().parseIfcFile(text.split(/[\n\r]/), true)
    }
  }
}

export default IfcDocumentManager
