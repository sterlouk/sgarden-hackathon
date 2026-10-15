// src/routes/data-validation.js
// Centralized user input validation for file and path operations

/**
 * Checks if a string is a simple filename (single segment, no traversal).
 */
export const isSimpleName = (name) => {
    if (typeof name !== "string" || name.length === 0) return false;
    if (name === "." || name === "..") return false;
    if (name.includes("/") || name.includes("\\")) return false;
    return /^[a-zA-Z0-9._-]+$/.test(name);
};

/**
 * Checks if a string is a simple relative path.
 * - forward slashes only
 * - no traversal
 * - no empty segments
 */
export const isSimplePath = (p) => {
    if (typeof p !== "string") return false;
    if (p === "" || p === ".") return true;
    if (p.startsWith("/") || p.includes("\\")) return false;

    const parts = p.split("/");
    return parts.every(
        part =>
            part.length > 0 &&
            part !== "." &&
            part !== ".." &&
            /^[a-zA-Z0-9._-]+$/.test(part)
    );
};
