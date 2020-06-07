import { TextDocumentPositionParams, Hover } from 'vscode-languageserver';
import { connection, documents } from '../server';
import { Ifc2Ast, PositionVisitor } from "@alanrynne/ifc-syntax-ast-parser";
import { ASTPosition } from '@alanrynne/ifc-syntax-ast-parser/out/ast/core/ASTPosition';
import { AssignmentNode, ConstructorNode, VariableNode } from '@alanrynne/ifc-syntax-ast-parser/out/ast/nodes';
import { ASTType } from '@alanrynne/ifc-syntax-ast-parser/out/ast';
import { ASTDefinitionFinderVisitor } from '@alanrynne/ifc-syntax-ast-parser/out/ast/visitor/ASTVisitor';

export const processHoverData = async (params: TextDocumentPositionParams) => {
    let doc = documents.get(params.textDocument.uri);
    let text = doc ? doc.getText() : null;
    if (text) {
        let d = await new Ifc2Ast().parseIfcFile(text.split('\n'), true).then(doc => {

            let p = new ASTPosition(params.position.line + 1, params.position.character);

            let pv: any = new PositionVisitor().visit(doc, p);
            if (pv === undefined || pv === null) {
                return null;
            }
            // let val = pv.value as ConstructorNode; // Value in an IFC assigment will always be a constructor node.
            // if (val === undefined || val === null) {
            //     return null;
            // }

            let lineRange = {
                start: {
                    line: pv.loc.start.line - 1,
                    character: pv.loc.start.character
                },
                end: {
                    line: pv.loc.end.line - 1,
                    character: pv.loc.end.character
                }
            };

            let h = {
                contents: JSON.stringify(pv.loc),
                range: lineRange
            };
            return h;
        });
        return d;
    }
    return null;
};