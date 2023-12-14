import { Command } from ".";

export default [
  {
    label: "todo",
    value: "- [ ] ",
    icon: "ui//mk-make-todo",
  },
  {
    label: "list",
    value: `- `,
    icon: "ui//mk-make-list",
  },
  {
    label: "ordered-list",
    value: `1. `,
    icon: "ui//mk-make-ordered",
  },
  {
    label: "h1",
    value: "# ",
    icon: "ui//mk-make-h1",
  },
  {
    label: "h2",
    value: "## ",
    icon: "ui//mk-make-h2",
  },
  {
    label: "h3",
    value: "### ",
    icon: "ui//mk-make-h3",
  },
  {
    label: "quote",
    value: "> ",
    icon: "ui//mk-make-quote",
  },
  {
    label: "divider",
    value: `
---
`,
    icon: "ui//mk-make-hr",
  },
  {
    label: "link",
    value: "<Paste Link>",
    offset: [-1, 1],
    icon: "ui//mk-make-link",
  },
  {
    label: "image",
    value: "![](Paste Link)",
    offset: [-1, 4],
    icon: "ui//mk-make-image",
  },
  {
    label: "codeblock",
    value: `
\`\`\`
Type/Paste Your Code
\`\`\``,
    offset: [-4, 5],
    icon: "ui//mk-make-codeblock",
  },
  {
    label: "callout",
    value: `> [!NOTE]
> Content`,
    offset: [-7, 12],
    icon: "ui//mk-make-callout",
  },
  {
    label: "note",
    value: "[[Note Name]]",
    offset: [-2, 2],
    icon: "ui//mk-make-note",
  },
  {
    label: "table",
    value: "table",
    icon: "ui//mk-make-table",
  },
  {
    label: "flow",
    value: `!![[Note Name]]`,
    offset: [-2, 4],
    icon: "ui//mk-make-flow",
  },
  {
    label: "tag",
    value: "#tag",
    offset: [0, 1],
    icon: "ui//mk-make-tag",
  },

] as Command[];
