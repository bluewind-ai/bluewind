/**
 * @fileoverview Class for validating comment blocks for proper content and format.
 * @author Rob Misasi
 */
"use strict";

const { normalizeComments, normalizeEol } = require("./utils");

class CommentBlockMatcher {
  /**
   * @param {{
   *   blockPrefix?: string;
   *   blockSuffix?: string;
   *   linePrefix?:string;
   *   style: "line" | "jsdoc" | "html";
   *   expectedLines?: string[];
   * }} config Configuration to match against
   */
  constructor({
    blockPrefix,
    blockSuffix,
    linePrefix,
    style,
    expectedLines,
  } = {}) {
    this.blockPrefix = blockPrefix ? normalizeEol(blockPrefix) : "";
    this.blockSuffix = blockSuffix ? normalizeEol(blockSuffix) : "";
    this.linePrefix = linePrefix ? normalizeEol(linePrefix) : "";
    this.style = style;
    this.expectedLines = expectedLines || [];
  }

  /**
   * Verifies {@link comments} matches the configuration.
   *
   * @param {import('@types/estree').Comment[]} comments The AST nodes to verify.
   * @returns {boolean} A flag indicating whether {@link comments} matches the configuration.
   */
  match(comments) {
    const normalizedComments = normalizeComments(comments);
    const prefixMatchInfo = this.tokensStartWith(
      normalizedComments,
      this.blockPrefix,
    );
    const suffixMatchInfo = this.tokensEndWith(
      normalizedComments,
      this.blockSuffix,
    );

    let expectedLines = this.expectedLines.map((line) =>
      `${this.linePrefix}${line}`.trimEnd(),
    );
    if (this.style !== "line") {
      expectedLines = [expectedLines.join("\n")];
    }

    let resultInfo = {
      matches: true,
      tokenIndex: prefixMatchInfo.tokenIndex,
      tokenCharacterIndex: prefixMatchInfo.tokenCharacterIndex,
    };
    const bodyMatch = expectedLines.every((line) => {
      resultInfo = this.tokensStartWith(
        normalizedComments,
        line,
        resultInfo.tokenIndex,
        resultInfo.tokenCharacterIndex,
      );
      return resultInfo.matches;
    });

    return bodyMatch && prefixMatchInfo.matches && suffixMatchInfo.matches;
  }

  /**
   * Verifies the Comment AST nodes in the array {@link tokens} start with {@link string}.
   *
   * @param {import('@types/estree').Comment[]} tokens
   * @param {string} string to match against.
   * @returns {boolean} A flag indicating the success of the operation.
   */
  tokensStartWith(tokens, string, tokenIndex = 0, tokenCharacterIndex = 0) {
    let resultInfo = {
      matches: true,
      tokenIndex,
      tokenCharacterIndex,
    };
    if (string.length === 0) {
      return resultInfo;
    }

    let characterIndex = 0;
    while (
      resultInfo.tokenIndex < tokens.length &&
      characterIndex < string.length
    ) {
      const remainingLength = string.length - characterIndex;
      if (
        remainingLength >
        tokens[resultInfo.tokenIndex].value.length -
          resultInfo.tokenCharacterIndex
      ) {
        const segment = string.substring(
          characterIndex,
          characterIndex + tokens[resultInfo.tokenIndex].value.length,
        );
        resultInfo.matches &=
          tokens[resultInfo.tokenIndex].value.substring(
            resultInfo.tokenCharacterIndex,
          ) === segment;
        characterIndex += tokens[resultInfo.tokenIndex].value.length;
      } else {
        const segment = string.substring(characterIndex);
        resultInfo.matches &= tokens[resultInfo.tokenIndex].value
          .substring(resultInfo.tokenCharacterIndex)
          .startsWith(segment);
        resultInfo.tokenCharacterIndex = remainingLength;
        characterIndex += segment.length;
      }

      if (
        resultInfo.tokenCharacterIndex ===
        tokens[resultInfo.tokenIndex].value.length
      ) {
        resultInfo.tokenIndex += 1;
        resultInfo.tokenCharacterIndex = 0;
      }

      if (!resultInfo.matches) {
        break;
      }
    }

    // If characterIndex was not incremented to string length, then
    // pattern is longer than tokens supplied and match is impossible.
    if (characterIndex !== string.length) {
      resultInfo.matches = false;
    }

    return resultInfo;
  }

  /**
   * Verifies {@link tokens} end with {@link string}
   *
   * @param {import('@types/estree').Comment[]} tokens
   * @param {string} string
   * @returns {boolean} A flag indicating the success of the operation.
   */
  tokensEndWith(tokens, string) {
    let resultInfo = {
      matches: true,
      tokenIndex: tokens.length - 1,
      tokenCharacterIndex: tokens[tokens.length - 1].value.length,
    };
    if (string.length === 0) {
      return resultInfo;
    }

    let characterIndex = string.length;
    while (resultInfo.tokenIndex >= 0 && characterIndex > 0) {
      if (characterIndex > tokens[resultInfo.tokenIndex].value.length) {
        const segment = string.substring(
          characterIndex - tokens[resultInfo.tokenIndex].value.length,
          characterIndex,
        );
        resultInfo.matches &= tokens[resultInfo.tokenIndex].value === segment;
        characterIndex -= tokens[resultInfo.tokenIndex].value.length;
      } else {
        const segment = string.substring(0, characterIndex);
        resultInfo.matches &=
          tokens[resultInfo.tokenIndex].value.endsWith(segment);
        resultInfo.tokenCharacterIndex =
          tokens[resultInfo.tokenIndex].value.length - segment.length;
        characterIndex -= segment.length;
      }
      if (resultInfo.tokenCharacterIndex === 0) {
        resultInfo.tokenIndex -= 1;
        resultInfo.tokenCharacterIndex =
          tokens[resultInfo.tokenIndex].value.length;
      }

      if (!resultInfo.matches) {
        break;
      }
    }

    // If characterIndex was not decremented to 0, a match was not found.
    if (characterIndex !== 0) {
      resultInfo.matches = false;
    }

    return resultInfo;
  }
}

module.exports = CommentBlockMatcher;
