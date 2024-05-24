import Handlebars from "handlebars";

// Fetch-only script, no imports allowed but benefits from a dedicated highly efficient runtime
export async function main(
  subject_line: string,
  salutation: string,
  block_1: string,
  block_2: string,
  block_3: string,
  block_4: string,
  block_5: string,
  signature: string,
) {
  const blocks = [block_1, block_2, block_3, block_4, block_5].filter(Boolean);

  const templateSource = `{{salutation}}{{#each blocks}}{{#if @index}}
{{/if}}
{{this}}
{{/each}}

{{signature}}
  `;

  const template = Handlebars.compile(templateSource);

  const body = template({
    salutation,
    blocks,
    signature,
  });

  return {
    "subject_line": subject_line,
    "body": body.trim(),
  };
}
