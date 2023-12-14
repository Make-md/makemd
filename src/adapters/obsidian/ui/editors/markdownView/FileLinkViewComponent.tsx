import { App, Component, MarkdownRenderer } from "obsidian";
import { useEffect } from "preact/hooks";
import React, { useRef, useState } from "react";
export const FileLinkViewComponent = (props: {
  path: string;
  app: App;
  component: Component;
}) => {
  const ref = useRef(null);
  const [markdown, setMarkdown] = useState("");
  useEffect(() => {
    if (ref.current)
      MarkdownRenderer.render(
        props.app,
        markdown,
        ref.current,
        props.path,
        props.component
      );
  }, [markdown]);
  useEffect(() => {
    fetch(props.path)
      .then((res) => res.text())
      .then((f) => setMarkdown(f));
  }, [props.path]);
  return (
    <div className="markdown-preview-view markdown-rendered node-insert-event is-readable-line-width allow-fold-headings show-indentation-guide allow-fold-lists show-frontmatter">
      <div
        className="markdown-preview-sizer markdown-preview-section"
        ref={ref}
      ></div>
    </div>
  );
};
