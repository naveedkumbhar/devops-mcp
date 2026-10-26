export declare function handleSearchScenarios(args: {
    query: string;
    category?: string;
    limit?: number;
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
