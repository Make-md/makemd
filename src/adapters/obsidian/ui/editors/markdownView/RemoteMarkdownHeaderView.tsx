import { frontMatterKeys } from "adapters/obsidian/filetypes/frontmatter/frontMatterKeys";
import { BannerView } from "core/react/components/MarkdownEditor/BannerView";
import { DataTypeView } from "core/react/components/SpaceView/Contexts/DataTypeView/DataTypeView";
import { Superstate } from "makemd-core";
import React, { useEffect, useState } from "react";
import { SpaceTableColumn } from "types/mdb";
import { uniqCaseInsensitive } from "utils/array";
import { parseProperty } from "utils/parsers";
import { pathNameToString } from "utils/path";
import { detectPropertyType, yamlTypeToMDBType } from "utils/properties";

export const RemoteMarkdownHeaderView = (props: {
  superstate: Superstate;
  name: string;
  fm: any;
}) => {
  const { name, fm } = props;

  const [collapsed, setCollapsed] = useState(false);
  const tags = fm.tags ?? [];
  const [values, setValues] = useState<Record<string, string>>({});
  const [columns, setColumns] = useState([]);
  useEffect(() => {
    const newCols = [];
    const newValues: Record<string, string> = {};
    const fmKeys = uniqCaseInsensitive(frontMatterKeys(fm));
    const cols: SpaceTableColumn[] = fmKeys.map((f) => ({
      table: "",
      name: f,
      schemaId: "",
      type: yamlTypeToMDBType(detectPropertyType(fm[f], f)),
    }));
    if (fm) {
      newCols.push(...cols);
      Object.keys(fm).forEach((c) => {
        newValues[c] = parseProperty(c, fm[c]);
      });
    }
    setValues(newValues);
    setColumns(newCols);
  }, []);

  return (
    <>
      {fm && (
        <BannerView
          superstate={props.superstate}
          bannerPath={fm[props.superstate.settings.fmKeyBanner]}
        ></BannerView>
      )}
      <div className="mk-path-context-component">
        <div
          className={`mk-spacer`}
          style={
            {
              "--mk-header-height":
                fm && fm[props.superstate.settings.fmKeyBanner]
                  ? (
                      (props.superstate.ui.getScreenType() == "mobile"
                        ? 1
                        : 0) *
                        26 +
                      138 +
                      (!fm.icon ||
                      props.superstate.settings.inlineContextNameLayout ==
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
          className={`mk-path-context-file ${
            props.superstate.settings.inlineContextNameLayout == "horizontal"
              ? "mk-path-context-file-horizontal"
              : ""
          }`}
        >
          <>
            {fm.icon ? (
              <div className={`mk-path-icon`}>
                <div
                  dangerouslySetInnerHTML={{
                    __html: props.superstate.ui.getSticker(fm.icon),
                  }}
                ></div>
              </div>
            ) : (
              <></>
            )}
            <div className="mk-inline-title inline-title">
              {pathNameToString(name)}
            </div>
          </>
        </div>
      </div>
      {!collapsed ? (
        <div className="mk-path-context-component">
          <>
            <div className="mk-path-context-section">
              <>
                {columns.map((f, i) => (
                  <div key={i} className="mk-path-context-row">
                    <div className="mk-path-context-field">{f.name}</div>
                    <div className="mk-path-context-value">
                      <DataTypeView
                        superstate={props.superstate}
                        initialValue={values[f.name]}
                        row={{}}
                        column={{ ...f, table: "" }}
                        editable={false}
                        updateValue={() => {
                          /*empty*/
                        }}
                        updateFieldValue={(fieldValue, value) => {
                          /*empty*/
                        }}
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
