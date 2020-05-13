// The example settings
export interface IfcSyntaxSettings {
    maxNumberOfProblems: number;
}
// The global settings, used when the `workspace/configuration` request is not supported by the client.
// Please note that this is not the case when using this server with the client provided in this example
// but could happen with other clients.
export const DefaultSettings: IfcSyntaxSettings = {
    maxNumberOfProblems: 1000
};
