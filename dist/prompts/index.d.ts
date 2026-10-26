export interface PromptDefinition {
    name: string;
    description: string;
    arguments?: Array<{
        name: string;
        description: string;
        required: boolean;
    }>;
}
export declare const PROMPTS: PromptDefinition[];
export declare function handleGetPrompt(name: string, args?: Record<string, string>): {
    description: string;
    messages: {
        role: string;
        content: {
            type: string;
            text: string;
        };
    }[];
};
