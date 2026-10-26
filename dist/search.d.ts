export interface Scenario {
    id: string;
    title: string;
    category: string;
    subCategory: string;
    level: string;
    tags: string[];
    summary: string;
    question: string;
    roleContext: string;
    intro: string;
    steps: Array<{
        title?: string;
        description?: string;
        command?: string;
        output?: string;
        explanation?: string;
        [key: string]: any;
    }>;
    keyTakeaway: string;
    elevatorPitch: string;
    mistakesToAvoid: string;
}
export declare function initSearchIndex(): {
    total: number;
};
export declare function searchScenarios(query: string, category?: string, limit?: number): Scenario[];
export declare function getScenarioById(id: string): Scenario | undefined;
export declare function getAllScenarios(): Scenario[];
