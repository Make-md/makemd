import { TFile } from "obsidian";
import { uniqCaseInsensitive } from "utils/array";
import { DataViewMarkdownFiletypeAdapter } from "../dataviewMarkdownAdapter";
import { parseDataview } from "./parseDataview";

const fileToDV = (file: TFile, cols: string[], plugin: DataViewMarkdownFiletypeAdapter) => {
    const dvValues = plugin.api().page(file.path);
    const fmKeys = uniqCaseInsensitive(
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
    ).filter((f) => cols.some((g) => f == g));
  
    return fmKeys.reduce(
      (p, c) => ({
        ...p,
        [c]: parseDataview(c, dvValues[c]),
      }),
      {}
    );
  };


  // if (
  //   props.plugin.dataViewAPI() &&
  //   props.plugin.superstate.settings.dataviewInlineContext
  // ) {
  //   const types = guestimateTypes([metadataPath], props.plugin, true);
  //   const fm = frontMatterForFile(
  //     props.plugin,
  //     getAbstractFileAtPath(props.plugin, metadataPath)
  //   );
  //   const fmKeys = uniqCaseInsensitive(frontMatterKeys(fm));
  //   const dvValues = props.plugin.dataViewAPI().page(metadataPath);
  //   const dvKeys = uniqCaseInsensitive(
  //     Object.keys(dvValues ?? {})
  //       .filter((f, i, self) =>
  //         !self.find(
  //           (g, j) =>
  //             g.toLowerCase().replace(/\s/g, "-") ==
  //               f.toLowerCase().replace(/\s/g, "-") && i > j
  //         )
  //           ? true
  //           : false
  //       )
  //       .filter((f) => f != "file")
  //       .filter((f) => f != "tag" && f != "tags")
  //       .filter((f) => !fmKeys.includes(f))
  //       .filter((f) => !columns.some((g) => g.name == f))
  //   );
  //   const dvCols: MDBColumn[] = dvKeys.map((f) => ({
  //     table: "",
  //     name: f,
  //     schemaId: "",
  //     type: yamlTypeToMDBType(types[f]),
  //   }));
  //   const dv = dvKeys.reduce(
  //     (p, c) => ({
  //       ...p,
  //       [c]: parseDataview(c, dvValues[c]),
  //     }),
  //     {}
  //   );
  //   newCols.push(...dvCols);
  //   Object.keys(dv).forEach((c) => {
  //     newValues[c] = parseDataview(c, dvValues[c]);
  //   });
  // }