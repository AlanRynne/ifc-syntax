import { TextDocumentPositionParams, Hover } from "vscode-languageserver"
import { documents, IfcDocManager, connection } from "../server"
import { PositionVisitor } from "@alanrynne/ifc-syntax-ast-parser"
import { ASTPosition } from "@alanrynne/ifc-syntax-ast-parser/out/ast/core/ASTPosition"
import IfcSchemas from "../schemas"
import {
  getFileSchemaVersion,
  findEntityInSchema,
  entityDataToText
} from "./IfcUtilities"

export const processHoverData = async (params: TextDocumentPositionParams) => {
  const doc = documents.get(params.textDocument.uri)
  return await IfcDocManager.get(params.textDocument.uri).then(parsedDoc => {
    let p = new ASTPosition(params.position.line + 1, params.position.character)

    let pv: any = new PositionVisitor().visit(parsedDoc, p)
    if (pv === undefined || pv === null) {
      return null
    }

    let lineRange = {
      start: {
        line: pv.loc.start.line - 1,
        character: pv.loc.start.character
      },
      end: {
        line: pv.loc.end.line - 1,
        character: pv.loc.end.character
      }
    }
    // Check only if it is a string node
    // TODO: This must be better specified, clearer code...
    if (pv.type === 12) {
      let version = getFileSchemaVersion(parsedDoc)
      let schema = IfcSchemas[version]
      let text = doc.getText(lineRange)
      let entity = findEntityInSchema(schema, text)
      //   entity.properties = getInheritedProps(schema, entity)
      if (entity) {
        let hover: Hover = {
          contents: entityDataToText(entity, version, schema),
          range: lineRange
        }
        return hover
      }
    }
  })
}
