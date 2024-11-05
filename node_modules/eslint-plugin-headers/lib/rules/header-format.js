/**
 * @fileoverview Verifies the content and format of a file's leading comment block.
 * @author Rob Misasi
 */
"use strict";

const fs = require("fs");

const { appendNewlines, getEolCharacter, normalizeEol } = require("../utils");
const CommentFormatter = require("../comment-formatter");
const CommentBlockMatcher = require("../comment-block-matcher");

/**
 * Checks if the file being linted is a Vue file.
 *
 * @param {import('eslint').Rule.RuleContext} context The rule context.
 * @returns {boolean}
 */
function parseAsVue(context) {
  return context.options[0].enableVueSupport;
}

/**
 * Checks if a Vue file has a header comment.
 *
 * @param {import('@types/estree').Program} program The program AST node to check.
 * @returns {boolean} A flag indicating the presence of a leading comment
 */
function vueHasHeaderComment(program) {
  const comments = program.templateBody.parent.comments;
  if (comments.length === 0) {
    return false;
  }

  let result = true;
  const firstComment = comments[0];
  if (firstComment.range[0] !== 0) {
    result = false;
  }
  return result;
}

/**
 * Checks if {@link program} is preceded by a comment block. Ignores shebang,
 * if present.
 *
 * @param {import('@types/estree').Program} program The program AST node to check.
 * @param {import('eslint').Rule.RuleContext} context The rule context.
 * @returns {boolean} A flag indicating the presence of a leading comment.
 */
function hasHeaderComment(program, context) {
  if (parseAsVue(context)) {
    return vueHasHeaderComment(program);
  }
  const firstComments = context.sourceCode.getCommentsBefore(program);
  if (firstComments.length === 0) {
    return false;
  } else if (
    firstComments.length === 1 &&
    firstComments[0].type === "Shebang"
  ) {
    return false;
  } else {
    return true;
  }
}

/**
 * Gets header comment. Assumes at least one leading comment exists. Joins
 * consecutive line comments.
 *
 * @param {import('eslint').Rule.RuleContext} context Rule context
 * @param {import('@types/estree').Program} program Program node
 * @returns {import('@types/estree').Comment[]} Array of comment AST nodes.
 */
function getHeaderComments(context, program) {
  if (parseAsVue(context)) {
    return [program.templateBody.parent.comments[0]];
  }

  const comments = context.sourceCode.getAllComments();
  const startingIndex = comments[0].type === "Shebang" ? 1 : 0;
  if (comments[startingIndex].type === "Block") {
    return [comments[startingIndex]];
  }

  let lineComments = [comments[startingIndex]];
  for (let i = startingIndex + 1; i < comments.length; i += 1) {
    if (
      !context.sourceCode
        .getText()
        .slice(comments[i - 1].range[1], comments[i].range[0])
        .match(/^(\r\n|\r|\n)$/) ||
      comments[i].type !== "Line"
    ) {
      break;
    }
    lineComments.push(comments[i]);
  }

  return lineComments;
}

function getFirstVueContentNode(program) {
  let firstVueNode;
  for (let i = 0; i < program.templateBody.parent.children.length; i += 1) {
    if (program.templateBody.parent.children[i].type === "VElement") {
      firstVueNode = program.templateBody.parent.children[i];
      break;
    }
  }

  // If a subsequent comment exists and occurs before the element node, use this instead.
  const headerCommentIndex = 0;
  if (
    program.templateBody.parent.comments.length >= hasHeaderComment + 1 &&
    program.templateBody.parent.comments[headerCommentIndex + 1].range[0] <
      firstVueNode.range[1]
  ) {
    firstVueNode = program.templateBody.parent.comments[0];
  }

  return firstVueNode;
}

/**
 * Gets the first node following a leading header comment.
 *
 * @param {import('eslint').RuleContext} context The context.
 * @param {import('@types/estree').Program} program The program AST node.
 * @param {import('@types/estree').Comment[]} headerComments The list of leading header comment nodes.
 * @returns {import('@types/estree').Node}
 */
function getFirstContentNode(context, program, headerComments) {
  if (parseAsVue(context)) {
    return getFirstVueContentNode(program);
  }

  return context.sourceCode.getTokenAfter(
    headerComments[headerComments.length - 1],
    { includeComments: true },
  );
}

/**
 * Gets the insertion node.
 *
 * @param {import('eslint').RuleContext} context The rule context
 * @param {import('@types/estree').Program} program The program node.
 * @returns Node
 */
function getMissingHeaderInsertionNode(context, program) {
  if (parseAsVue(context)) {
    return program.templateBody.parent;
  }

  return program.body[0] || program;
}

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "layout",
    docs: {
      description:
        "Verifies the content and format of a file's leading comment block.",
      recommended: false,
    },
    messages: {
      missingHeader: "No header found.",
      headerContentMismatch: "Header does not include expected content.",
      trailingNewlinesMismatch: "Mismatched trailing newlines",
    },
    fixable: "code",
    schema: [
      {
        type: "object",
        properties: {
          source: {
            enum: ["file", "string"],
          },
          style: {
            enum: ["line", "jsdoc"],
            default: "jsdoc",
          },
          content: {
            type: "string",
          },
          path: {
            type: "string",
          },
          preservePragmas: {
            type: "boolean",
            default: true,
          },
          blockPrefix: {
            type: "string",
          },
          blockSuffix: {
            type: "string",
          },
          linePrefix: {
            type: "string",
          },
          trailingNewlines: {
            type: "number",
          },
          variables: {
            type: "object",
            patternProperties: {
              "^.+$": {
                anyOf: [{ type: "string" }],
              },
            },
            additionalProperties: false,
          },
          enableVueSupport: {
            type: "boolean",
            default: false,
          },
        },
        required: ["source"],
        allOf: [
          {
            if: {
              properties: { source: { const: "file" } },
              required: ["source"],
            },
            then: {
              required: ["path"],
            },
          },
          {
            if: {
              properties: { source: { const: "string" } },
              required: ["source"],
            },
            then: {
              required: ["content"],
            },
          },
        ],
      },
    ],
  },

  create(context) {
    let expectedHeaderText =
      context.options[0]["source"] === "file"
        ? fs.readFileSync(context.options[0]["path"], "utf-8").trimEnd()
        : context.options[0]["content"];

    let variables = context.options[0]["variables"];
    if (variables) {
      Object.keys(variables).forEach((key) => {
        expectedHeaderText = expectedHeaderText.replaceAll(
          `{${key}}`,
          variables[key],
        );
      });
    }

    const normalizedHeaderText = normalizeEol(expectedHeaderText);
    const expectedHeaderLines = normalizedHeaderText.split("\n");
    const sourceEol = getEolCharacter(context.sourceCode.getText());

    let style = context.options[0]["style"];
    if (parseAsVue(context)) {
      style = "html";
    }

    const defaultBlockFormat = {
      blockPrefix: `*${sourceEol}`,
      blockSuffix: `${sourceEol} `,
      linePrefix: " * ",
    };

    const defaultLineFormat = {
      blockPrefix: undefined,
      blockSuffix: undefined,
      linePrefix: " ",
    };

    const defaultHtmlFormat = {
      blockPrefix: `${sourceEol}`,
      blockSuffix: `${sourceEol}`,
      linePrefix: "  ",
    };

    const defaultFormat = {
      jsdoc: defaultBlockFormat,
      line: defaultLineFormat,
      html: defaultHtmlFormat,
    }[style];

    const formatConfig = {
      blockPrefix:
        context.options[0]["blockPrefix"] || defaultFormat.blockPrefix,
      blockSuffix:
        context.options[0]["blockSuffix"] || defaultFormat.blockSuffix,
      linePrefix: context.options[0]["linePrefix"] || defaultFormat.linePrefix,
      eol: sourceEol,
    };

    const headerFormatter = new CommentFormatter(
      expectedHeaderLines,
      formatConfig,
    );

    //----------------------------------------------------------------------
    // Public
    //----------------------------------------------------------------------

    return {
      Program: function (node) {
        if (!hasHeaderComment(node, context)) {
          const missingHeaderinsertionPoint = getMissingHeaderInsertionNode(
            context,
            node,
          );
          context.report({
            node: missingHeaderinsertionPoint,
            messageId: "missingHeader",
            fix: function (fixer) {
              return fixer.insertTextBefore(
                missingHeaderinsertionPoint,
                appendNewlines(
                  headerFormatter.format(style),
                  sourceEol,
                  context.options[0]["trailingNewlines"] || 1,
                ),
              );
            },
          });
          return;
        }

        const headerComments = getHeaderComments(context, node);
        const headerCommentLines =
          style === "line"
            ? headerComments.map((comment) => comment.value)
            : headerComments[0].value.split(sourceEol);
        const commentBlockMatcher = new CommentBlockMatcher({
          ...formatConfig,
          style,
          expectedLines: expectedHeaderLines,
        });

        const match = commentBlockMatcher.match(headerComments);

        if (!match) {
          const headerPragmas = headerCommentLines
            .map((line) => {
              const match = line.match(/^[^\w]*(@\w.*)$/);
              return match ? match[1] : undefined;
            })
            .filter((x) => x);

          if (
            style === "jsdoc" &&
            context.options[0]["preservePragmas"] &&
            headerPragmas.length > 0
          ) {
            headerFormatter.lines = headerFormatter.lines.concat([
              "",
              ...headerPragmas,
            ]);
          }

          context.report({
            loc: {
              start: headerComments[0].loc.start,
              end: headerComments[headerComments.length - 1].loc.end,
            },
            messageId: "headerContentMismatch",
            fix: function (fixer) {
              return fixer.replaceTextRange(
                [
                  headerComments[0].range[0],
                  headerComments[headerComments.length - 1].range[1],
                ],
                headerFormatter.format(style),
              );
            },
          });
        }

        const firstContentNode = getFirstContentNode(
          context,
          node,
          headerComments,
        );

        // Report newlines issue only if there's a valid AST token after the header block
        if (
          context.options[0]["trailingNewlines"] &&
          firstContentNode &&
          context.sourceCode
            .getText()
            .slice(
              headerComments[headerComments.length - 1].range[1],
              firstContentNode.range[0],
            ) !== sourceEol.repeat(context.options[0]["trailingNewlines"])
        ) {
          context.report({
            loc: {
              start: headerComments[headerComments.length - 1].loc.end,
              end: firstContentNode.loc.start,
            },
            messageId: "trailingNewlinesMismatch",
            fix: function (fixer) {
              return fixer.replaceTextRange(
                [
                  headerComments[headerComments.length - 1].range[1],
                  firstContentNode.range[0],
                ],
                sourceEol.repeat(context.options[0]["trailingNewlines"]),
              );
            },
          });
        }
      },
    };
  },
};
