// data-validation.js
// This module provides user input validation utilities for file and path operations.
// All user input must be validated here before being used in any path resolution or file system operations.

/**
 * Checks if a string is a simple filename (no path separators, no traversal).
 */
export const isSimpleName = (name) => {
    if (!name || typeof name !== 'string') return false;
    if (name.includes('/') || name.includes('\\')) return false;
    if (name === '.' || name === '..') return false;
    return /^[a-zA-Z0-9._-]+$/.test(name);
};

/**
 * Checks if a string is a simple path (no backslashes, no traversal, only valid segments).
 */
export const isSimplePath = (p) => {
    if (!p || typeof p !== 'string') return false;
    if (p.includes('\\')) return false;
    const parts = p.split('/');
    return parts.every(part => part !== '.' && part !== '..' && /^[a-zA-Z0-9._-]+$/.test(part));
};

/**
 * Sanitizes and validates user input for file operations.
 * Throws an error if input is invalid or potentially unsafe.
 */
export const validateUserInput = (userInput) => {
    if (!userInput) throw new Error('Path is required');
    if (String(userInput).includes('..') || String(userInput).includes('\\') || String(userInput).startsWith('/') || /^[A-Za-z]:\\/.test(String(userInput))) {
        throw new Error('Directory traversal attempt detected');
    }
    return userInput;
};
