import {
  DocumentNode,
  SectionNode
} from "@alanrynne/ifc-syntax-ast-parser/out/ast/nodes"

export function findEntityInSchema(schema, name: string) {
  return (
    caseInsensitiveKeyValue(schema.types, name) ||
    caseInsensitiveKeyValue(schema.entities, name) ||
    caseInsensitiveKeyValue(schema.functions, name) ||
    caseInsensitiveKeyValue(schema.rules, name) ||
    null
  )
}
function propsToText(
  props: any,
  parentName: string,
  inheritMessage: boolean = false,
  ifcVersion: string
): string[] {
  if (!props) {
    return []
  }
  const inheritNotice = inheritMessage ? ` (from _${parentName}_)` : ""
  return Object.entries(props).map(([key, value]: [string, any]) => {
    const text =
      typeof value.type === "string"
        ? `[**${value.type}**](vscode://AlanRynne.ifc-syntax/docs?name=${value.type}&version=${ifcVersion})`
        : typeToText(value.type, ifcVersion)
    return `- _${key}_: **${text}**${inheritNotice}`
  })
}
function typeToText(type: any, ifcVersion: string) {
  return `${type.type} of [${type.contains}](vscode://AlanRynne.ifc-syntax/docs?name=${type.contains}&version=${ifcVersion})`
}
function getInheritedPropText(schema, entity, name: string = null) {
  let props = propsToText(
    entity.properties,
    entity.name,
    name !== null,
    schema.schema
  ).join("\n")
  if (entity.supertype === null) {
    return props
  }
  let parent = findEntityInSchema(schema, entity.supertype)
  let parentProps = getInheritedPropText(schema, parent, name || entity.name)
  return [parentProps, props].join("\n")
}
function getInheritedProps(schema, entity) {
  if (entity.supertype === null) {
    return entity.properties
  }
  let parent = findEntityInSchema(schema, entity.supertype)
  let props = getInheritedProps(schema, parent)
  return { ...props, ...entity.properties }
}
export function entityDataToText(entity: any, version: string, schema: any) {
  let link =
    "vscode://AlanRynne.ifc-syntax/docs?name=" +
    entity.name +
    "&version=" +
    schema.schema
  let header = `**${entity.name}**`
  if (entity.supertype) {
    header += `: [_${entity.supertype}_](${link})`
  }
  const type = `_${version} EXPRESS ${entity.ifcType.toUpperCase()}_`

  const props = getInheritedPropText(schema, entity)

  return [header, type, props]
}
function caseInsensitiveKeyValue(object: any, key: string) {
  const existingKey = Object.keys(object).find(
    schemaKey => schemaKey.toLowerCase() === key.toLowerCase()
  )
  if (existingKey) {
    return object[existingKey]
  }
}
export function getFileSchemaVersion(doc: any) {
  let schemaObj = ((doc as DocumentNode)
    .sections[0] as SectionNode).children.find(
    item => (item as any).name === "FILE_SCHEMA"
  )
  let schema = (schemaObj as any).args[0].items[0].text
  return schema
}
