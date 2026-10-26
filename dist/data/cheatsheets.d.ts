export interface Cheatsheet {
    id: string;
    title: string;
    topic: string;
    summary: string;
    content: string;
    canonicalUrl: string;
}
export declare const CHEATSHEETS: Record<string, Cheatsheet>;
