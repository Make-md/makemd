
export type Task = {
    text: string;
    tags: string[];
    date?: string;
    completed: boolean;
  };
export const parseTask = (task: string) : Task => {
    let completed = false;
    let text = '';
    if (task.startsWith("- [ ] ")) {
        completed = false;
        text = task.slice(6);
    } else if (task.startsWith("- [x] ")) {
        completed = true;
        text = task.slice(6);
    }
    const tags = text.match(/#(\w+)/g) ?? [];
    const date = text.match(/\^(\d{4}-\d{2}-\d{2})/) ?? [];
    return {
        text: text.replace(/#(\w+)/g, "").replace(/\^(\d{4}-\d{2}-\d{2})/, ""),
        tags: tags.map(f => f.replace("#", "")),
        date: date[1],
        completed
    }
}

