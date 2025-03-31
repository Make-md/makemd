import { generateStyleAst } from "core/export/styleAst/generateStyleAst";
import { styleAstToCSS } from "core/export/styleAst/styleAstToCSS";
import { noteToHtml, spaceToHtml } from "core/export/toHtml/spaceToHtml";
import { SpaceContext } from "core/react/context/SpaceContext";
import { Superstate } from "makemd-core";
import React, { useContext } from "react";
import { Dropdown } from "../UI/Dropdown";

type SpaceExportOptions = {
  recursive: boolean;
  nav: boolean;
};

export const SpaceExport = (props: {
  superstate: Superstate;
  close: () => void;
}) => {
  const { spaceState } = useContext(SpaceContext);
  const [options, setOptions] = React.useState<SpaceExportOptions>({
    recursive: true,
    nav: true,
  });
  const [generating, setGenerating] = React.useState<boolean>(false);
  const exportWithOptions = async (path: string, open: boolean) => {
    setGenerating(true);
    const styleAst = await generateStyleAst();
    const css = styleAstToCSS(styleAst);
    const payload = `${css}`;
    if (options.recursive) {
      const generateChildren = async (_path: string) => {
        const children = await props.superstate.spaceManager.childrenForPath(
          _path
        );

        return Promise.all(
          children.map(async (childPath) => {
            const childState = props.superstate.pathsIndex.get(childPath);
            if (!childState) return;

            if (childState.type == "space") {
              await generateChildren(childPath);
            }

            return exportPath(childPath, payload, options, false, path);
          })
        );
      };
      await generateChildren(path);
    }
    await exportPath(path, payload, options, open, path);
    setGenerating(false);
    props.superstate.ui.notify("Successfully exported to HTML");
  };
  const exportPath = async (
    path: string,
    style: string,
    options: SpaceExportOptions,
    open?: boolean,
    root?: string
  ) => {
    const pathState = props.superstate.pathsIndex.get(path);
    if (!pathState) return;
    let htmlPath: string;
    let output: string;
    if (pathState.type == "space") {
      htmlPath = path + "/index.html";
      output = await spaceToHtml(props.superstate, path, {
        header: true,
        nav: {
          enabled: options.nav,
          root: root,
        },
        head: {
          styles: {
            enabled: true,
            themes: true,
            payload: style,
          },
        },
      });
    } else if (pathState.subtype == "md") {
      const parentPath = props.superstate.spaceManager.parentPathForPath(path);
      const parentSpace = props.superstate.spacesIndex.get(parentPath);
      if (!parentSpace || parentSpace.space.notePath == path) {
        return;
      }
      htmlPath = path.replace(new RegExp(".md$"), ".html");
      output = await noteToHtml(props.superstate, path, {
        header: true,
        nav: {
          enabled: options.nav,
          root: root,
        },
        head: {
          styles: {
            enabled: true,
            themes: true,
            payload: style,
          },
        },
      });
    } else {
      return;
    }

    return props.superstate.spaceManager
      .writeToPath(htmlPath, output)
      .then((f) => {
        if (open) props.superstate.ui.openPath(htmlPath, "split");
      });
  };

  return (
    <div className="mk-space-editor-smart">
      <div className="mk-space-editor-smart-join-header">
        <div
          className="mk-icon-small"
          dangerouslySetInnerHTML={{
            __html: props.superstate.ui.getSticker("ui//pin"),
          }}
        ></div>
        <span>Make a static web version of </span>
        <Dropdown
          superstate={props.superstate}
          options={[
            {
              name: "This Space",
              value: "false",
            },
            {
              name: "This Space and All Subfolders",
              value: "true",
            },
          ]}
          value={options.recursive ? "true" : "false"}
          selectValue={(value) => {
            setOptions({
              ...options,
              recursive: value == "true" ? true : false,
            });
          }}
        ></Dropdown>
        <Dropdown
          superstate={props.superstate}
          options={[
            {
              name: "With Navigator",
              value: "true",
            },
            {
              name: "Without Navigator",
              value: "false",
            },
          ]}
          value={options.nav ? "true" : "false"}
          selectValue={(value) => {
            setOptions({ ...options, nav: value == "true" ? true : false });
          }}
        ></Dropdown>
      </div>
      {generating ? (
        <div className="mk-button-group">
          <button disabled>Making...</button>
        </div>
      ) : (
        <div className="mk-button-group">
          <button onClick={() => exportWithOptions(spaceState.path, true)}>
            Export
          </button>
          <button onClick={() => props.close()}>Cancel</button>
        </div>
      )}
    </div>
  );
};
