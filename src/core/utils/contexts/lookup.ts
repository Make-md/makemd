import { Superstate } from "core/superstate/superstate";
import { PathState } from "core/types/superstate";
import { serializeMultiString } from "utils/serializers";
import { parseMultiString, parseProperty } from "../../../utils/parsers";
import { serializeMultiDisplayString } from "../../../utils/serializers";


export const appendPathsMetaData = (superstate: Superstate, propType: string, pathsString: string) => {
  const paths = parseMultiString(pathsString)
    .map((f) => superstate.pathsIndex.get(f))
    .filter((f) => f);
  return serializeMultiString(paths.map((f) => appendPathMetaData(propType, f)));
};

export const appendPathMetaData = (propType: string, pathState: PathState) => {
  let value = "";
  if (pathState) {
    if (propType == "folder") {
      value = pathState.parent;
    } else if (propType == "name") {
      value = pathState.name;
    } else if (propType == "ctime") {
      value = pathState.metadata?.file?.stat?.ctime?.toString();
    } else if (propType == "mtime") {
      value = pathState.metadata?.file?.stat?.mtime?.toString();
    } else if (propType == "extension") {
      value = pathState.metadata.extension;
    } else if (propType == "sticker") {
      value = pathState.label.sticker;
    } else if (propType == "size") {
      value = pathState.metadata?.file?.stat?.size?.toString();
    } else if (propType == "inlinks") {
      value = serializeMultiDisplayString(pathState.inlinks);
    } else if (propType == "outlinks") {
      value = serializeMultiDisplayString(pathState.outlinks);
    } else if (propType == "tags") {
      value = serializeMultiDisplayString(pathState.tags);
    } else if (propType == 'spaces') {
      value = serializeMultiDisplayString(pathState.spaces);
    } else {
      value = parseProperty(null, pathState.metadata?.[propType]);
    }
  }
  return value;
};
