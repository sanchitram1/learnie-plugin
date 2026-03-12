import { readFrontmatter } from "./file";
import { getAllNotes } from "./note";

export function normalizeCourse(value: string): string {
    let normalized = value.trim();

    if (normalized.startsWith("[[") && normalized.endsWith("]]")) {
        normalized = normalized.slice(2, -2).trim();
    }

    if (normalized.includes("|")) {
        const parts = normalized.split("|");
        normalized = parts[parts.length - 1].trim();
    }

    const pathSegments = normalized.split("/").filter(Boolean);
    if (pathSegments.length > 1) {
        normalized = pathSegments[pathSegments.length - 1].trim();
    }

    if (normalized.endsWith(".md")) {
        normalized = normalized.slice(0, -3).trim();
    }

    return normalized;
}

export function extractCourses(frontmatterValue: unknown): string[] {
    if (!frontmatterValue) {
        return [];
    }

    const values = Array.isArray(frontmatterValue) ? frontmatterValue : [frontmatterValue];

    return values
        .filter((value): value is string => typeof value === "string")
        .map((value) => normalizeCourse(value))
        .filter((value) => value.length > 0);
}

export async function getAllCourses(): Promise<Set<string>> {
    const files = await getAllNotes();
    const courses = new Set<string>();

    for (const file of files) {
        const frontmatter = readFrontmatter(file);
        for (const course of extractCourses(frontmatter?.courses)) {
            courses.add(course);
        }
    }

    return courses;
}
