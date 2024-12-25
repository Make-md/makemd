import { Command } from ".";

export default [
  {
    label: "todo",
    value: "- [ ] ",
    icon: "mk-make-todo",
  },
  {
    label: "list",
    value: `- `,
    icon: "mk-make-list",
  },
  {
    label: "ordered-list",
    value: `1. `,
    icon: "mk-make-ordered",
  },
  {
    label: "h1",
    value: "# ",
    icon: "mk-make-h1",
  },
  {
    label: "h2",
    value: "## ",
    icon: "mk-make-h2",
  },
  {
    label: "h3",
    value: "### ",
    icon: "mk-make-h3",
  },
  {
    label: "quote",
    value: "> ",
    icon: "mk-make-quote",
  },
  {
    label: "divider",
    value: `
---
`,
    icon: "mk-make-hr",
    section: 'Basic',
  },
  {
    label: "codeblock",
    value: `
\`\`\`
Type/Paste Your Code
\`\`\``,
    offset: [-4, 5],
    icon: "mk-make-codeblock",
  },
  {
    label: "callout",
    value: `> [!NOTE]
> Content`,
    offset: [-7, 12],
    icon: "mk-make-callout",
  },
  {
    label: "internal",
    value: "link",
    icon: "mk-make-note",
  },
  {
    label: "link",
    value: "<Paste Link>",
    offset: [-1, 1],
    icon: "mk-make-link",
  },
  {
    label: "image",
    value: "image",
    icon: "mk-make-image",
  },
  {
    label: "flow",
    value: `note`,
    offset: [-2, 4],
    icon: "mk-make-flow",
  },
  {
    label: "context",
    value: "context",
    icon: "layout-list",
  },
  {
    label: "table",
    value: "table",
    icon: "mk-make-table",
  },
  {
    label: "board",
    value: "board",
    icon: "square-kanban",
  },
  
  {
    label: "tag",
    value: "#tag",
    offset: [0, 1],
    icon: "mk-make-tag",
  },

] as Command[];
