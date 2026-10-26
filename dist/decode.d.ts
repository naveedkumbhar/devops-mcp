import { ErrorEntry } from './data/errors.js';
export interface ErrorMatch {
    entry: ErrorEntry;
    score: number;
}
export declare function matchErrors(input: string, platform?: string, limit?: number): ErrorMatch[];
