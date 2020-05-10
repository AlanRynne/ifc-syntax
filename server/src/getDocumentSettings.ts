import { IfcSyntaxSettings, hasConfigurationCapability, globalSettings, documentSettings, connection } from './server';
export function getDocumentSettings(resource: string): Thenable<IfcSyntaxSettings> {
    if (!hasConfigurationCapability) {
        return Promise.resolve(globalSettings);
    }
    let result = documentSettings.get(resource);
    if (!result) {
        result = connection.workspace.getConfiguration({
            scopeUri: resource,
            section: 'ifcSyntax'
        });
        documentSettings.set(resource, result);
    }
    return result;
}
