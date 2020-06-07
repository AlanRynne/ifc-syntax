import { Location, TextDocumentPositionParams } from 'vscode-languageserver';
import { documents } from '../server';
import { Ifc2Ast, PositionVisitor } from 'ifc2ast';
import { IVisitor } from 'ifc2ast/out/ast/visitor/IVisitor';
import { ASTNode } from 'ifc2ast/out/ast';
import { ASTPosition } from 'ifc2ast/out/ast/core/ASTPosition';
import * as nodes from 'ifc2ast/out/ast/nodes';
import { ASTDefinitionFinderVisitor } from 'ifc2ast/out/ast/visitor/ASTVisitor';

// TODO: Create IVisitor provider and hook it up.
export const processGoToDefinition = async (params: TextDocumentPositionParams) => {
    let doc = documents.get(params.textDocument.uri);
    let text = doc ? doc.getText() : null;
    if (text) {
        return await new Ifc2Ast().parseIfcFile(text.split('\n'), true).then(doc => {
            let p = new ASTPosition(params.position.line + 1, params.position.character);
            let pv: any = new PositionVisitor().visit(doc, p);
            if (pv instanceof nodes.VariableNode) {
                let def: ASTNode = new ASTDefinitionFinderVisitor().visit(doc, pv.id);
                if (def) {
                    return Location.create(params.textDocument.uri, {
                        start: { line: def.loc.start.line - 1, character: def.loc.start.character },
                        end: { line: def.loc.end.line - 1, character: def.loc.end.character }
                    });
                }
            }
        });
    }
};

class GoToDefinitionProvider implements IVisitor {
    visit(node: ASTNode, refNum: number) {
    }

}