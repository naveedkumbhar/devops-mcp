export declare function handleDecodeError(args: {
    error: string;
    platform?: string;
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
