/**
 * @fileoverview Helper functions for formatting, generating, and parsing docblocks.
 * @author Rob Misasi
 */
"use strict";

const os = require("os");

/**
 * Format docblock with trailing newlines.
 *
 * @param {string} docblock JSDoc to format
 * @param {string} eol End of Line character(s).
 * @param {number} trailingNewlines number of trailing newlines to append to formatted text.
 * @returns
 */
function appendNewlines(docblock, eol, trailingNewlines) {
  let newlines = eol.repeat(trailingNewlines);
  return `${docblock}${newlines}`;
}

/**
 * Gets End of line character(s) from {@link code}.
 *
 * @param {string} code Code to parse
 * @returns {string} End of Line character from {@link code}
 */
function getEolCharacter(code) {
  let match = /\r\n|\r|\n/.exec(code);
  return (match && match[0]) || os.EOL;
}

/**
 * Normalizes line endings in a string.
 *
 * @param {string} string String with EOL characters.
 * @returns A copy of {@link string} with EOL characters replaced with `\n`
 */
function normalizeEol(string) {
  const stringCopy = string.substring(0);
  return stringCopy.replaceAll(/\r\n|\r/g, "\n");
}

/**
 * Normalizes a string of comments with a consistent eol character.
 *
 * @param {import('@types/estree').Comment[]} comments - The comments to normalize
 * @returns {import('@types/estree').Comment[]} A list of with the normalized comment content.
 */
function normalizeComments(comments) {
  return comments.map((comment) => {
    return {
      ...comment,
      value: normalizeEol(comment.value),
    };
  });
}

module.exports = {
  appendNewlines,
  getEolCharacter,
  normalizeComments,
  normalizeEol,
};
