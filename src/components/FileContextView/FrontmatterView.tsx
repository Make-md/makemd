import { DataTypeView } from "components/ContextView/DataTypeView/DataTypeView";
import { showFMMenu } from "components/ui/menus/fmMenu";
import { showSelectMenu } from "components/ui/menus/menuItems";
import { MovePropertyModal } from "components/ui/modals/moveMetadataModal";
import "css/FileContext.css";
import { insertContextColumn, updateContextValue } from "dispatch/mdb";
import MakeMDPlugin from "main";
import { Point, TFile } from "obsidian";
import { useEffect } from "preact/hooks";
import React, { useState } from "react";
import { fieldTypes } from "schemas/mdb";
import { MDBColumn, MDBField } from "types/mdb";
import { eventTypes } from "types/types";
import { uniqCaseInsensitive } from "utils/array";
import {
  folderContextFromFolder,
  tagContextFromTag,
} from "utils/contexts/contexts";
import { getAbstractFileAtPath } from "utils/file";
import { parseDataview } from "utils/metadata/dataview/parseDataview";
import {
  changeFrontmatterType,
  deleteFrontmatterValue,
  frontMatterForFile,
  guestimateTypes,
  renameFrontmatterKey,
  saveFrontmatterValue,
} from "utils/metadata/frontmatter/fm";
import { frontMatterKeys } from "utils/metadata/frontmatter/frontMatterKeys";
import { parseFrontMatter } from "utils/metadata/frontmatter/parseFrontMatter";
import { yamlTypeToMDBType } from "utils/metadata/frontmatter/yamlTypeToMDBType";

export const FrontmatterView = (props: {
  plugin: MakeMDPlugin;
  path: string;
  metadataPath: string;
  tags: string[];
  folder: string;
  excludeKeys: string[];
  editable?: boolean;
}) => {
  const { metadataPath, path } = props;
  const [values, setValues] = useState<Record<string, string>>({});
  const [cols, setCols] = useState([]);

  const refreshData = async () => {
    const fileContexts: Set<string> =
      props.plugin.index.contextsMap.get(path) ?? new Set();
    const columns = [...fileContexts]
      .map((f) => props.plugin.index.contextsIndex.get(f)?.cols ?? [])
      .reduce((p, c) => [...p, ...c], []);
    const newCols = [];
    const newValues: Record<string, string> = {};
    const types = guestimateTypes([metadataPath], props.plugin, false);
    const fm = frontMatterForFile(getAbstractFileAtPath(app, metadataPath));
    const fmKeys = uniqCaseInsensitive(frontMatterKeys(fm)).filter(
      (f) => !columns.some((g) => g.name == f)
    );
    const cols: MDBColumn[] = fmKeys.map((f) => ({
      table: "",
      name: f,
      schemaId: "",
      type: yamlTypeToMDBType(types[f]),
    }));
    if (fm) {
      newCols.push(...cols);
      Object.keys(fm).forEach((c) => {
        newValues[c] = parseFrontMatter(c, fm[c]);
      });
    }
    if (
      props.plugin.dataViewAPI() &&
      props.plugin.settings.dataviewInlineContext
    ) {
      const types = guestimateTypes([metadataPath], props.plugin, true);
      const fm = frontMatterForFile(getAbstractFileAtPath(app, metadataPath));
      const fmKeys = uniqCaseInsensitive(frontMatterKeys(fm));
      const dvValues = props.plugin.dataViewAPI().page(metadataPath);
      const dvKeys = uniqCaseInsensitive(
        Object.keys(dvValues ?? {})
          .filter((f, i, self) =>
            !self.find(
              (g, j) =>
                g.toLowerCase().replace(/\s/g, "-") ==
                  f.toLowerCase().replace(/\s/g, "-") && i > j
            )
              ? true
              : false
          )
          .filter((f) => f != "file")
          .filter((f) => f != "tag" && f != "tags")
          .filter((f) => !fmKeys.includes(f))
          .filter((f) => !columns.some((g) => g.name == f))
      );
      const dvCols: MDBColumn[] = dvKeys.map((f) => ({
        table: "",
        name: f,
        schemaId: "",
        type: yamlTypeToMDBType(types[f]),
      }));
      const dv = dvKeys.reduce(
        (p, c) => ({
          ...p,
          [c]: parseDataview(c, dvValues[c]),
        }),
        {}
      );
      newCols.push(...dvCols);
      Object.keys(dv).forEach((c) => {
        newValues[c] = parseDataview(c, dvValues[c]);
      });
    }
    setCols(
      newCols.filter((f) => !props.excludeKeys?.some((g) => g == f.name))
    );
    setValues(newValues);
  };

  useEffect(() => {
    refreshData();
  }, [path, props.tags]);

  const mdbChanged = (evt: CustomEvent) => {
    if (
      evt.detail.type == "context" &&
      evt.detail.contextPath &&
      props.tags.find(
        (f) =>
          tagContextFromTag(props.plugin, f).contextPath ==
          evt.detail.contextPath
      )
    ) {
      refreshData();
    } else if (evt.detail.type == "file" && evt.detail.name == path) {
      refreshData();
    }
  };
  useEffect(() => {
    window.addEventListener(eventTypes.spacesChange, mdbChanged);
    return () => {
      window.removeEventListener(eventTypes.spacesChange, mdbChanged);
    };
  }, [path, props.tags]);
  const saveFMValue = (value: string, f: MDBColumn) => {
    saveFrontmatterValue(props.plugin, metadataPath, f.name, value, f.type);
  };
  const deleteFMValue = (property: MDBField) => {
    deleteFrontmatterValue(props.plugin, metadataPath, property.name);
  };
  const saveMetadata = async (property: MDBField, table: string) => {
    const field: MDBField = {
      ...property,
      schemaId: "files",
    };
    let context;
    let tag;
    if (table == "") {
      context = folderContextFromFolder(props.plugin, props.folder);
      tag = false;
    } else {
      context = tagContextFromTag(props.plugin, table);
      tag = true;
    }
    await insertContextColumn(props.plugin, context, field);
    await updateContextValue(
      props.plugin,
      context,
      path,
      field.name,
      values[field.name]
    );
  };
  const syncFMValue = (property: MDBField) => {
    let vaultChangeModal = new MovePropertyModal(
      props.plugin,
      saveMetadata,
      property,
      getAbstractFileAtPath(app, metadataPath) as TFile
    );
    vaultChangeModal.open();
  };
  const renameFMKey = (key: string, name: string) => {
    renameFrontmatterKey(props.plugin, metadataPath, key, name);
  };
  const selectedType = (value: string[], key: string) => {
    changeFrontmatterType(props.plugin, metadataPath, key, value[0]);
  };
  const selectType = (p: Point, key: string) => {
    showSelectMenu(p, {
      multi: false,
      editable: false,
      searchable: false,
      saveOptions: (_, v) => selectedType(v, key),
      value: [],
      showAll: true,
      options: fieldTypes
        .filter((f) => f.metadata)
        .map((f, i) => ({
          id: i + 1,
          name: f.label,
          value: f.type,
          icon: "",
        })),
    });
  };
  const showMenu = (e: React.MouseEvent, property: MDBField) => {
    const offset = (e.target as HTMLElement).getBoundingClientRect();
    showFMMenu(
      props.plugin,
      { x: offset.left, y: offset.top + 30 },
      property,
      deleteFMValue,
      syncFMValue,
      renameFMKey,
      selectType
    );
  };
  return cols.length > 0 ? (
    <>
      <div className="mk-file-context-section">
        <>
          {cols.map((f, i) => (
            <div key={i} className="mk-file-context-row">
              <div
                className="mk-file-context-field"
                onClick={(e) => showMenu(e, f)}
              >
                {f.name}
              </div>
              <div className="mk-file-context-value">
                <DataTypeView
                  plugin={props.plugin}
                  initialValue={values[f.name]}
                  index={0}
                  file={metadataPath}
                  column={{ ...f, table: "" }}
                  editable={props.editable}
                  updateValue={(value) => saveFMValue(value, f)}
                  updateFieldValue={(fieldValue, value) =>
                    saveFMValue(value, f)
                  }
                  contextTable={{}}
                ></DataTypeView>
              </div>
            </div>
          ))}
        </>
      </div>
    </>
  ) : (
    <></>
  );
};
