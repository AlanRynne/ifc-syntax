import { TextDocumentPositionParams, Hover } from "vscode-languageserver"
import { documents, IfcDocManager } from "../server"
import { PositionVisitor } from "@alanrynne/ifc-syntax-ast-parser"
import { ASTPosition } from "@alanrynne/ifc-syntax-ast-parser/out/ast/core/ASTPosition"
import {
  DocumentNode,
  SectionNode
} from "@alanrynne/ifc-syntax-ast-parser/out/ast/nodes"
import IfcSchemas from "../schemas"

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
      if (entity) {
        let hover: Hover = {
          contents: entityDataToText(entity),
          range: lineRange
        }
        return hover
      }
    }
  })
}

function findEntityInSchema(schema, name: string) {
  return (
    caseInsensitiveKeyValue(schema.types, name) ||
    caseInsensitiveKeyValue(schema.entities, name) ||
    caseInsensitiveKeyValue(schema.functions, name) ||
    caseInsensitiveKeyValue(schema.rules, name) ||
    null
  )
}

function entityDataToText(entity: any) {
  return [
    `**${entity.name}**: EXPRESS ${entity.ifcType.toUpperCase()}`,
    Object.entries(entity.properties)
      .map(
        ([key, value]: [string, any]) => `- _${key}_: [${value.type}](link://)`
      )
      .join("\n")
  ]
}

function caseInsensitiveKeyValue(object: any, key: string) {
  const existingKey = Object.keys(object).find(
    schemaKey => schemaKey.toLowerCase() === key.toLowerCase()
  )
  if (existingKey) {
    return object[existingKey]
  }
}

function getFileSchemaVersion(doc: any) {
  let schemaObj = ((doc as DocumentNode)
    .sections[0] as SectionNode).children.find(
    item => (item as any).name === "FILE_SCHEMA"
  )
  let schema = (schemaObj as any).args[0].items[0].text
  return schema
}
