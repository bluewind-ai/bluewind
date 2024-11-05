/**
 * @fileoverview Class for formatting comment blocks.
 * @author Rob Misasi
 */
"use strict";

class CommentFormatter {
  constructor(lines, { blockPrefix, blockSuffix, linePrefix, eol } = {}) {
    this.blockPrefix = blockPrefix;
    this.blockSuffix = blockSuffix;
    this.linePrefix = linePrefix;
    this.eol = eol;
    this.lines = lines;
  }

  /**
   *
   * @param {"line" | "jsdoc" | "html"} style style to format into
   * @returns formatted string.
   */
  format(style) {
    const formatFn = {
      line: () => this.getLineBlock(),
      jsdoc: () => this.getJsdoc(),
      html: () => this.getHtmlBlock(),
    }[style];
    return formatFn();
  }

  getJsdoc() {
    let blockPrefix = this.blockPrefix || `*${this.eol}`;
    let blockSuffix = this.blockSuffix || `${this.eol} `;
    let linePrefix = this.linePrefix || " * ";
    let body = this.lines
      .map((line) => `${linePrefix}${line}`.trimEnd())
      .join(this.eol);
    return `/*${blockPrefix}${body}${blockSuffix}*/`;
  }

  getLineBlock() {
    let blockPrefix =
      (this.blockPrefix && `//${this.blockPrefix}${this.eol}`) || "";
    let blockSuffix =
      (this.blockSuffix && `${this.eol}//${this.blockSuffix}`) || "";
    let linePrefix = this.linePrefix || " ";
    const body = this.lines
      .map((line) => `//${linePrefix}${line}`.trimEnd())
      .join(this.eol);
    return `${blockPrefix}${body}${blockSuffix}`;
  }

  getHtmlBlock() {
    let blockPrefix = this.blockPrefix || this.eol;
    let blockSuffix = this.blockSuffix || this.eol;
    let linePrefix = this.linePrefix || "  ";
    const body = this.lines
      .map((line) => `${linePrefix}${line}`.trimEnd())
      .join(this.eol);
    return `<!--${blockPrefix}${body}${blockSuffix}-->`;
  }
}

module.exports = CommentFormatter;
