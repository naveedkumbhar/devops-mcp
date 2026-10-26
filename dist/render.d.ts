export interface Mistake {
    mistake?: string;
    why?: string;
}
export declare function htmlToMarkdown(html: unknown): string;
export declare function renderMistakes(mistakes: unknown): string;
export declare function renderStep(st: Record<string, any>, i: number): string;
