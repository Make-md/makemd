import MakeMDPlugin from "main";
import { TAbstractFile, TFile } from "obsidian";
import React from "react";
import { MDBColumn } from "types/mdb";
import { uniqCaseInsensitive } from "utils/array";
import { uiIconSet } from "utils/icons";
import { frontMatterForFile } from "utils/metadata/frontmatter/fm";
import { frontMatterKeys } from "utils/metadata/frontmatter/frontMatterKeys";

export type MetadataType = {
  type: "dv" | "fm";
  name: string;
};

export const allMetadataForFiles = (plugin: MakeMDPlugin, files: TFile[]) => {
  return files.reduce((p, c) => {
    const fm = frontMatterForFile(c);
    const fmKeys = uniqCaseInsensitive(frontMatterKeys(fm));
    if (plugin.dataViewAPI()) {
      const dvValues = plugin.dataViewAPI().page(c.path);
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
          .filter((f) => f != "file" && !fmKeys.some((g) => f == g))
      );
      return [
        ...p,
        ...fmKeys.map<MetadataType>((f) => ({ name: f, type: "fm" })),
        ...dvKeys.map<MetadataType>((f) => ({ name: f, type: "dv" })),
      ].filter(metadatTypeFilterPredicate);
    }
    return [
      ...p,
      ...fmKeys.map<MetadataType>((f) => ({ name: f, type: "fm" })),
    ].filter(metadatTypeFilterPredicate);
  }, [] as MetadataType[]);
};

const metadatTypeFilterPredicate = (value: any, index: number, self: any[]) => {
  return (
    self.findIndex(
      (v) => value["type"] == v["type"] && value["name"] == v["name"]
    ) === index
  );
};

export const SyncMetadataComponent = (props: {
  plugin: MakeMDPlugin;
  files: TAbstractFile[];
  syncColumn: (column: MetadataType, table: string) => void;
  columns: MDBColumn[];
}) => {
  const cols: MetadataType[] = allMetadataForFiles(
    props.plugin,
    props.files.filter((f) => f instanceof TFile) as TFile[]
  ).filter((f) =>
    props.columns ? !props.columns.some((g) => g.name == f.name) : true
  );

  return (
    <div className="mk-cell-option">
      {cols.map((f, index) => (
        <div
          className="mk-cell-option-item"
          onClick={() => props.syncColumn(f, "")}
        >
          <div>{f.name}</div>
          <div
            className={`mk-icon-xsmall`}
            dangerouslySetInnerHTML={{
              __html: uiIconSet["mk-ui-plus"],
            }}
          ></div>
        </div>
      ))}
    </div>
  );
};
