export type ErrorKind = 'exit-code' | 'http' | 'kubernetes' | 'docker' | 'ecs' | 'aws' | 'terraform' | 'linux' | 'network' | 'tls';
export interface ErrorEntry {
    id: string;
    kind: ErrorKind;
    title: string;
    /** Numeric exit codes or HTTP status codes this entry explains. */
    codes?: number[];
    /** Lowercase substrings matched against the user's error text. */
    patterns?: string[];
    meaning: string;
    causes: string[];
    diagnose: string[];
    fix: string[];
    /** Query used to pull matching incident scenarios from the scenario index. */
    search: string;
}
export declare const ERRORS: ErrorEntry[];
