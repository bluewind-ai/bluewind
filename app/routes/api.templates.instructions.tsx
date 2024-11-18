// app/routes/api.templates.instructions.tsx
import { type ActionFunctionArgs } from "@remix-run/node";

type InstructionsProps = {
  fileCount?: number;
};
// eslint-disable-next-line unused-imports/no-unused-vars
async function _action(args: ActionFunctionArgs) {}
export async function action(args: ActionFunctionArgs) {
  const { fileCount } = (await args.request.json()) as InstructionsProps;
  const content = `0- Never use try {} catch {} unless the code was given to you

1- ONE FILE PER SNIPPET. meaning ${fileCount ? `${fileCount} copy paste` : "one copy paste"} icon per file.

2- Always put the file paths before any file WITHING the \`\`\`typescript snippet. Follow the structure you're given.

3- Do not ever throw errors, handle errors or whatever. DO NOT think about unhappy paths, or bad user inputs. Never handle cases where some data could be empty. Always assume all the functions you use just work. When they don't work, do not try to patch your code and hanlde the case when they don't work. Just tell me "hey I think here something is wrong with a module outside of my current scope", and then explain the problem. I will analyze myself.

4- routes are intentionally colocated with their loader, action, component, EVERYTHING. THIS IS INTENTIONAL. THESE ARE LONG ROUTES but it's worth it.

5- Your only way to see my app is through console.log, so use them.

5- IF you want to suggest to edit files, ALWAYS return entire file or files updated please. EVEN WHEN THEY'RE LONG.
I repeat: ALWAYS return entire file or files updated please. Even when it looks stupid to do so. even when the change is literally one line.`;
  return { content };
}
