import MiniSearch from 'minisearch';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
let scenariosData = [];
let scenarioMap = new Map();
let searchIndex = null;
export function initSearchIndex() {
    if (searchIndex) {
        return { total: scenariosData.length };
    }
    let dataPath = join(__dirname, 'data', 'scenarios.json');
    if (!existsSync(dataPath)) {
        dataPath = join(__dirname, '..', 'src', 'data', 'scenarios.json');
    }
    const raw = readFileSync(dataPath, 'utf-8');
    scenariosData = JSON.parse(raw);
    scenarioMap = new Map();
    for (const s of scenariosData) {
        scenarioMap.set(s.id, s);
    }
    searchIndex = new MiniSearch({
        fields: ['id', 'title', 'summary', 'question', 'tags', 'subCategory', 'category'],
        storeFields: ['id', 'title', 'summary', 'category', 'subCategory', 'level', 'tags'],
        searchOptions: {
            boost: { title: 4, tags: 3, id: 2, summary: 1.5 },
            fuzzy: 0.2,
            prefix: true
        }
    });
    searchIndex.addAll(scenariosData);
    return { total: scenariosData.length };
}
export function searchScenarios(query, category, limit = 5) {
    if (!searchIndex) {
        initSearchIndex();
    }
    const results = searchIndex.search(query, {
        filter: category
            ? (doc) => doc.category.toLowerCase().includes(category.toLowerCase())
            : undefined
    });
    const topResults = results.slice(0, Math.min(limit, 20));
    const scenarios = [];
    for (const r of topResults) {
        const full = scenarioMap.get(r.id);
        if (full) {
            scenarios.push(full);
        }
    }
    // If MiniSearch had no results, perform literal fallback search
    if (scenarios.length === 0) {
        const qLower = query.toLowerCase();
        for (const s of scenariosData) {
            if (s.id.toLowerCase().includes(qLower) ||
                s.title.toLowerCase().includes(qLower) ||
                s.summary.toLowerCase().includes(qLower) ||
                s.tags.some(t => t.toLowerCase().includes(qLower))) {
                if (!category || s.category.toLowerCase().includes(category.toLowerCase())) {
                    scenarios.push(s);
                    if (scenarios.length >= limit)
                        break;
                }
            }
        }
    }
    return scenarios;
}
export function getScenarioById(id) {
    if (scenarioMap.size === 0) {
        initSearchIndex();
    }
    return scenarioMap.get(id);
}
export function getAllScenarios() {
    if (scenariosData.length === 0) {
        initSearchIndex();
    }
    return scenariosData;
}
