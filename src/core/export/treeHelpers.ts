import { absolutePathToRelativePath } from "adapters/obsidian/ui/kit/kits";
import { DefaultFolderNoteMDBTables } from "core/react/components/SpaceView/Frames/DefaultFrames/DefaultFrames";
import { parseFieldValue } from "core/schemas/parseFieldValue";
import { filterReturnForCol } from "core/utils/contexts/predicate/filter";
import { filterFnTypes } from "core/utils/contexts/predicate/filterFns/filterFnTypes";
import { sortReturnForCol } from "core/utils/contexts/predicate/sort";
import { applyPropsToState, buildRoot } from "core/utils/frames/ast";
import { frameToNode } from "core/utils/frames/nodes";
import { executeTreeNode } from "core/utils/frames/runner";
import { initiateString } from "core/utils/strings";
import { SelectOption, Superstate } from "makemd-core";
import { defaultFrameListViewID } from "schemas/mdb";
import { defaultContextSchemaID } from "shared/schemas/context";
import { defaultPredicate } from "shared/schemas/predicate";
import { FrameContexts, FrameRunInstance, StyleAst } from "shared/types/frameExec";
import { DBRows, SpaceProperty } from "shared/types/mdb";
import { FrameNode, FrameTreeProp, MDBFrame } from "shared/types/mframe";
import { Predicate } from "shared/types/predicate";
import { uniq } from "shared/utils/array";
import { safelyParseJSON } from "shared/utils/json";
import { mdbSchemaToFrameSchema } from "shared/utils/makemd/schema";
import { parseURI } from "shared/utils/uri";

export const resolvePath = (superstate: Superstate, oldPath: string, path: string) => {
  if (oldPath.startsWith('http')) return oldPath;
  let resolvedPath = superstate.spaceManager.resolvePath(oldPath, path);
  const parentSpace = superstate.spacesIndex.get(superstate.pathsIndex.get(resolvedPath)?.parent);
  if (parentSpace?.space.notePath == resolvedPath) {
    resolvedPath = parentSpace.path;
  }
  return resolvedPath
}


export const transformPath = (superstate: Superstate, oldPath: string, path: string, absolute?: boolean) => {
  if (oldPath.startsWith('http')) return oldPath;
  let transformedPath = resolvePath(superstate, oldPath, path);
  if (oldPath.endsWith('.md')) {
      transformedPath = oldPath.replace(new RegExp('.md$'), '.html');
    }
  if (superstate.spacesIndex.has(transformedPath)) {
    if (transformedPath == '/') {
      transformedPath = `index.html`;
    } else {
      transformedPath = `${transformedPath}/index.html`;
    }
  }
  if (path == '/') {
     return transformedPath;
  }
  if (absolute) return transformedPath;
    
return absolutePathToRelativePath(transformedPath, path);
}

export const getFrameInstanceFromPath = async (superstate: Superstate, path: string, schema: string, props: FrameTreeProp, context: FrameContexts, styleAst?: StyleAst) => {
    const frameSchema = await superstate.spaceManager.readFrame(path, schema);
    const root = await buildRoot(mdbSchemaToFrameSchema(frameSchema.schema), [], frameSchema.rows.map(row => frameToNode(row)), superstate);
    const treeNode = executeTreeNode(
            root,
            {
              prevState: {},
              state: {},
              newState: applyPropsToState({}, props, root.id),
              slides: {},
            },
            {
              api: superstate.api,
              contexts: context,
              saveState: () => null,
              root: root,
              exec: root,
              runID: '',
              selectedSlide: '',
              styleAst: styleAst,
            }
        )
    return treeNode;
}


export const contextNodeToInstances = async (superstate: Superstate, node: FrameNode, instance: FrameRunInstance, og: string) : Promise<{ type: string, instances?: {listView: FrameRunInstance, listGroups: FrameRunInstance[], listItems: FrameRunInstance[][]}, predicate: Predicate, cols: SpaceProperty[], data: Record<string, DBRows>, path: string, source: string }> => {
  const path = superstate.spaceManager.resolvePath(instance.state[node.id].props.value, og);
  if (!path) return null;
    const uri = parseURI(path);

    let contextView : MDBFrame = await superstate.spaceManager.readFrame(uri.basePath, uri.ref ?? defaultFrameListViewID);
    if (!contextView) {
      contextView = DefaultFolderNoteMDBTables[defaultFrameListViewID];
    }
    const schema = mdbSchemaToFrameSchema(contextView.schema);
    const db = schema.def?.db ?? defaultContextSchemaID;
    const source = schema.def?.context ?? uri.basePath;
    const dbTable = await superstate.spaceManager.readTable(source, db);
    const predicate = {...defaultPredicate, ...(safelyParseJSON(schema.predicate) ?? {})} as Predicate;
    const data = filterContextData(superstate, dbTable.rows.map((f, i) => ({...f, _index: i.toString()})), dbTable.cols, predicate);
    const groupBy = dbTable.cols.find((f) => f.name == predicate.groupBy?.[0]);
    const cols = dbTable.cols;
    if (predicate.view == 'table') {
      return {type: 'table',
      predicate,
      cols,
      data,
      path,
      source,
      }
    }

    const listViewFrame = initiateString(predicate.listView, "spaces://$kit/#*listView");
    const listGroupFrame = initiateString(predicate.listGroup, "spaces://$kit/#*listGroup");
    const listItemFrame = initiateString(predicate.listItem, "spaces://$kit/#*rowItem");



    const primaryKey = cols.find((f) => f.primary == "true")?.name;
    const dbSchema = dbTable.schema;
    const visibleCols = cols.filter((f) => predicate.colsHidden.indexOf(f.name) == -1);
    const context = {
      _path: source,
      _schema: dbSchema?.id,
      _key: primaryKey,
      _properties: visibleCols,
    };
    const listGroupInstances = await Promise.all(Object.keys(data).map((c) => getFrameInstance(superstate, listGroupFrame, {
      _groupValue: c,
                _groupField: groupBy?.name,
                _groupType: groupBy?.type,
                _readMode: true,
                _selectedIndex: -1,
                ...predicate.listGroupProps,
    },
    {
      $context: context,

    }, instance.styleAst)));

    const listItemInstaces = await Promise.all(Object.keys(data).map((c) => Promise.all(data[c].map((r) => getFrameInstance(superstate, listItemFrame, {
      _groupValue: c,
      _groupField: groupBy?.name,
      _groupType: groupBy?.type,
      _readMode: true,
      ...predicate.listItemProps,
    },
    {
      $context: {
        _index: r["_index"],
        _keyValue: r[primaryKey],
        _schema: dbSchema.id,
        _name: superstate.pathsIndex.get(r[primaryKey])?.name,
        ...context,
      },
      $properties: cols,
      [source]: cols.reduce((a, b) => {
        return {
          ...a,
          [b.name]: r[b.name],
        };
      }, {}),
    }, instance.styleAst)
    ))));

    const listViewInstance = await getFrameInstance(superstate, listViewFrame, {
      _readMode: true,
      ...predicate.listViewProps,
    },
    {

    }, instance.styleAst);
    return {
      type: 'list',
      instances: {
      listView: listViewInstance,
      listGroups: listGroupInstances,
      listItems: listItemInstaces,
      }
      ,
      predicate,
      cols,
      data,
      path,
      source,
    }
  }
const getFrameInstance = async (superstate: Superstate, framePath: string, props: FrameTreeProp, context: FrameContexts, styleAst?: StyleAst) => {
  if (!framePath) return null;
    const uri = parseURI(framePath);
        if (uri.authority == '$kit') {
            const root = superstate.kitFrames.get(uri.ref);
            if (!root) return null;
            const instance = await executeTreeNode(root, {
                prevState: {},
                state: {},
                newState: applyPropsToState({}, props, root.id),
                slides: {},
              },
              {
                api: superstate.api,
                contexts: context,
                saveState: () => null,
                root: root,
                exec: root,
                runID: '',
                selectedSlide: '',
                styleAst: styleAst
              });
            return instance;
        }
        return await getFrameInstanceFromPath(superstate, uri.basePath, uri.ref, props, context, styleAst);

}
const filterContextData = (superstate: Superstate, data: DBRows, cols: SpaceProperty[], predicate: Predicate) => {
  const filteredData = data
          .filter((f) => {
            return (predicate?.filters ?? []).reduce((p, c) => {
              return p
                ? filterReturnForCol(
                    cols.find((col) => col.name == c.field),
                    c,
                    f,
                    {}
                  )
                : p;
            }, true);
          })
          .sort((a, b) => {
            return (predicate?.sort ?? []).reduce((p, c) => {
              return p == 0
                ? sortReturnForCol(
                    cols.find((col) => col.name == c.field),
                    c,
                    a,
                    b
                  )
                : p;
            }, 0);
          });
    const groupBy =
        predicate?.groupBy?.length > 0
          ? cols.find((f) => f.name == predicate.groupBy?.[0])
          : null;

        const options: string[] = uniq([
          "",
          ...(
            parseFieldValue(groupBy?.value, groupBy?.type, superstate)
              ?.options ?? []
          ).map((f: SelectOption) => f.value),
          ...filteredData.reduce(
            (p, c) => [...p, c[groupBy?.name] ?? ""],
            []
          ),
        ]) as string[];

      const items : Record<string, DBRows> =  options.reduce(
          (acc, c) => {
            if (!groupBy) {
              return c == ""
                  ? {
                      ...acc,
                      [c]: filteredData.map((f, i) => ({ ...f })) ?? [],
                    }
                  : {
                      ...acc,
                      [c]: [],
                    }
              ;
            }
            const newItems = filteredData.filter((r) => {

              return filterFnTypes.is.fn(r[groupBy.name], c);
            });
            return newItems.length > 0
                ? {
                    ...acc,
                    [c]: newItems.map((f, i) => ({
                      ...f,
                    })),
                  }
                : {
                    ...acc,
                    [c]: [],
                  }
            ;
          },
          {}
        );

        return items;
}
