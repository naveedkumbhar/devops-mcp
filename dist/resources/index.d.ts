export interface ResourceDefinition {
    uri: string;
    name: string;
    description: string;
    mimeType: string;
}
export declare const RESOURCES: ResourceDefinition[];
export declare function handleReadResource(uri: string): {
    contents: {
        uri: string;
        mimeType: string;
        text: string;
    }[];
};
