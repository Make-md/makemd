import { DataTypeView } from "components/ContextView/DataTypeView/DataTypeView";
import { TagsView } from "components/ContextView/TagsView/TagsView";
import MakeMDPlugin from "main";
import React, { useEffect, useState } from "react";
import { MDBColumn } from "types/mdb";
import { uniqCaseInsensitive } from "utils/array";
import { platformIsMobile } from "utils/file";
import { detectYAMLType } from "utils/metadata/frontmatter/detectYAMLType";
import { frontMatterKeys } from "utils/metadata/frontmatter/frontMatterKeys";
import { parseFrontMatter } from "utils/metadata/frontmatter/parseFrontMatter";
import { yamlTypeToMDBType } from "utils/metadata/frontmatter/yamlTypeToMDBType";
import { stickerFromString } from "utils/sticker";
import { fileNameToString } from "utils/strings";
import { NoteBannerView } from "./NoteBannerView";

export const FileHeaderContextView = (props: {
  plugin: MakeMDPlugin;
  name: string;
  fm: any;
}) => {
  const { name, fm } = props;
  const [collapsed, setCollapsed] = useState(false);
  const tags = fm.tags;
  const [values, setValues] = useState<Record<string, string>>({});
  const [columns, setColumns] = useState([]);
  useEffect(() => {
    let newCols = [];
    let newValues: Record<string, string> = {};
    const fmKeys = uniqCaseInsensitive(frontMatterKeys(fm));
    const cols: MDBColumn[] = fmKeys.map((f) => ({
      table: "",
      name: f,
      schemaId: "",
      type: yamlTypeToMDBType(detectYAMLType(fm[f], f)),
    }));
    if (fm) {
      newCols.push(...cols);
      Object.keys(fm).forEach((c) => {
        newValues[c] = parseFrontMatter(c, fm[c]);
      });
    }
    setValues(newValues);
    setColumns(newCols);
  }, []);

  return (
    <>
      {fm && (
        <NoteBannerView
          plugin={props.plugin}
          link={fm[props.plugin.settings.fmKeyBanner]}
        ></NoteBannerView>
      )}
      <div className="mk-file-context-component">
        <div
          className={`mk-spacer`}
          style={
            {
              "--header-height":
                fm && fm[props.plugin.settings.fmKeyBanner]
                  ? (
                      (platformIsMobile() ? 1 : 0) * 26 +
                      138 +
                      (!fm.icon ||
                      props.plugin.settings.inlineContextNameLayout ==
                        "horizontal"
                        ? 1
                        : 0) *
                        50
                    ).toString() + "px"
                  : 0,
            } as React.CSSProperties
          }
          onContextMenu={(e) => e.preventDefault()}
        ></div>
        <div
          className={`mk-file-context-file ${
            props.plugin.settings.inlineContextNameLayout == "horizontal"
              ? "mk-file-context-file-horizontal"
              : ""
          }`}
        >
          <>
            {fm.icon ? (
              <div className={`mk-file-icon`}>
                <div
                  dangerouslySetInnerHTML={{
                    __html: stickerFromString(fm.icon, props.plugin),
                  }}
                ></div>
              </div>
            ) : (
              <></>
            )}
            <div className="mk-inline-title inline-title">
              {fileNameToString(name)}
            </div>
            {tags?.length > 0 ? (
              <TagsView
                canOpen={true}
                plugin={props.plugin}
                tags={tags}
              ></TagsView>
            ) : (
              <></>
            )}
          </>
        </div>
      </div>

      {!collapsed ? (
        <div className="mk-file-context-component">
          <>
            <div className="mk-file-context-section">
              <>
                {columns.map((f, i) => (
                  <div key={i} className="mk-file-context-row">
                    <div className="mk-file-context-field">{f.name}</div>
                    <div className="mk-file-context-value">
                      <DataTypeView
                        plugin={props.plugin}
                        initialValue={values[f.name]}
                        index={0}
                        file={null}
                        column={{ ...f, table: "" }}
                        editable={false}
                        updateValue={() => {}}
                        updateFieldValue={(fieldValue, value) => {}}
                        contextTable={{}}
                      ></DataTypeView>
                    </div>
                  </div>
                ))}
              </>
            </div>
          </>
        </div>
      ) : (
        <></>
      )}
    </>
  );
};
