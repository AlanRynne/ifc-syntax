import { TextDocumentPositionParams, Hover } from 'vscode-languageserver';
import { connection, documents } from './server';
import { Ifc2Ast, PositionVisitor } from "ifc2ast";
import { ASTNode } from 'ifc2ast/out/ast';
import { ASTPosition } from 'ifc2ast/out/ast/core/ASTPosition';
import { AssignmentNode, ConstructorNode } from 'ifc2ast/out/ast/nodes';


const processASTHoverData = (node: ASTNode): Hover => {
    if (node === undefined || node === null) {
        return null;
    }

    //
    let val = "*PENDING YET!*";

    let lineRange = {
        start: {
            line: node.loc.start.line - 1,
            character: node.loc.start.character
        },
        end: {
            line: node.loc.end.line - 1,
            character: node.loc.end.character
        }
    };

    let h: Hover = {
        contents: val,
        range: lineRange
    };
    return h;
};

connection.onHover(async (params: TextDocumentPositionParams) => {
    connection.console.log(`Client asked for hover on ${params.position.line}:${params.position.character}`);

    let doc = documents.get(params.textDocument.uri);
    let text = doc ? doc.getText() : null;
    if (text) {
        let d = await new Ifc2Ast().parseIfcFile(text.split('\n'), true).then(doc => {

            let p = new ASTPosition(params.position.line + 1, params.position.character);

            let pv: AssignmentNode = new PositionVisitor().visit(doc, p);
            if (pv === undefined || pv === null) {
                return null;
            }

            let val = pv.value as ConstructorNode;
            if (val === undefined || val === null) {
                return null;
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
            };

            let h = {
                contents: val.name,
                range: lineRange
            };
            return h;
        });
        return d;
    }
    return null;
});
