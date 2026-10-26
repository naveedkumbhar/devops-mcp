export interface Blueprint {
    id: string;
    title: string;
    blogSlug: string;
    summary: string;
    architecture: string;
}
export declare const BLUEPRINTS: Record<string, Blueprint>;
export declare function handleGetBlueprint(args: {
    blueprint: string;
}): {
    content: {
        type: string;
        text: string;
    }[];
    isError: boolean;
} | {
    content: {
        type: string;
        text: string;
    }[];
    isError?: undefined;
};
