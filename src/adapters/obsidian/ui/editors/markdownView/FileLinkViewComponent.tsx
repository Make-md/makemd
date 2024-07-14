import { regexYaml } from "adapters/text/textCacher";
import { Superstate } from "makemd-core";
import { App, MarkdownRenderer, parseYaml } from "obsidian";

import classNames from "classnames";
import React, { useEffect, useRef, useState } from "react";
import { pathToString } from "utils/path";
import { RemoteMarkdownHeaderView } from "./RemoteMarkdownHeaderView";
export const FileLinkViewComponent = (props: {
  path: string;
  superstate: Superstate;
  app: App;
  component?: any;
  flow?: boolean;
}) => {
  const ref = useRef(null);
  const [markdown, setMarkdown] = useState("");
  const [fm, setFM] = useState<Record<string, any>>({});
  useEffect(() => {
    // markdownToHtml(markdown).then((html) => {
    //   ref.current.innerHTML = html;
    // });
    if (ref.current) {
      MarkdownRenderer.render(
        props.app,
        markdown,
        ref.current,
        props.path,
        props.component
      );
      const observer = new MutationObserver(() => {
        // Get all anchor links in ref.current
        const links = ref.current.querySelectorAll("a");
        links.forEach((link: Element) => {
          // If the href attribute ends with .md
          if (link.getAttribute("href").endsWith(".md")) {
            // Change the click action
            link.addEventListener("click", (event) => {
              event.preventDefault();
              // Add your custom click action here
            });
          }
        });
      });

      // Start observing ref.current for changes in its child list or subtree
      observer.observe(ref.current, { childList: true, subtree: true });

      // Clean up the observer when the component is unmounted or the markdown changes
      return () => observer.disconnect();
    }
  }, [markdown]);
  useEffect(() => {
    if (props.superstate.pathsIndex.get(props.path)) {
      props.superstate.spaceManager.readPath(props.path).then((f) => {
        const match = f.match(regexYaml);
        if (match) {
          setMarkdown(f.replace(match[0], ""));
          const yamlContent = match[1];
          setFM(parseYaml(yamlContent));
        } else {
          setMarkdown(f);
        }
      });
      return;
    }
    props.superstate.spaceManager.pathExists(props.path).then((f) => {
      if (f) {
        props.superstate.spaceManager.readPath(props.path).then((f) => {
          const match = f.match(regexYaml);
          if (match) {
            setMarkdown(f.replace(match[0], ""));
            const yamlContent = match[1];
            setFM(parseYaml(yamlContent));
          } else {
            setMarkdown(f);
          }
        });
      } else {
        fetch(props.path)
          .then((res) => res.text())
          .then((f) => {
            const match = f.match(regexYaml);
            if (match) {
              setMarkdown(f.replace(match[0], ""));
              const yamlContent = match[1];
              setFM(parseYaml(yamlContent));
            } else {
              setMarkdown(f);
            }
          });
      }
    });
  }, [props.path]);

  return (
    <div
      className={classNames(
        "markdown-preview-view markdown-rendered node-insert-event  allow-fold-headings show-indentation-guide allow-fold-lists show-frontmatter",
        props.superstate.settings.readableLineWidth
          ? "is-readable-line-width"
          : ""
      )}
    >
      {!props.flow && (
        <div className="mk-remote-header">
          <RemoteMarkdownHeaderView
            superstate={props.superstate}
            name={fm.name ?? pathToString(props.path)}
            fm={fm}
          ></RemoteMarkdownHeaderView>
        </div>
      )}
      <div
        className="markdown-preview-sizer markdown-preview-section"
        ref={ref}
      ></div>
    </div>
  );
};
