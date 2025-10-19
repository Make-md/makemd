import i18n from "shared/i18n";

import { defaultTableFields } from "shared/schemas/fields";
import { ISuperstate } from "shared/types/superstate";
import { uniqueNameFromString } from "shared/utils/array";
import { defaultPredicate } from "../../schemas/predicate";


export const predicateForViewType = (type: string) => {
  if (type == "table") {
    return ({
      view: "table",
      listView: "",
      listGroup: "",
      listItem: "",
    });
  }
  if (type == "flow") {
    return ({
      view: "list",
      listView: "spaces://$kit/#*listView",
      listGroup: "spaces://$kit/#*listGroup",
      listItem: "spaces://$kit/#*flowListItem",
    });
  }
  if (type == "list") {
    return ({
      view: "list",
      listView: "spaces://$kit/#*listView",
      listGroup: "spaces://$kit/#*listGroup",
      listItem: "spaces://$kit/#*rowItem",
    });
  }
  if (type == "details") {
    return ({
      view: "list",
      listView: "spaces://$kit/#*listView",
      listGroup: "spaces://$kit/#*listGroup",
      listItem: "spaces://$kit/#*detailItem",
    });
  }
  if (type == "board") {
    return ({
      view: "list",
      listView: "spaces://$kit/#*columnView",
      listGroup: "spaces://$kit/#*columnGroup",
      listItem: "spaces://$kit/#*cardListItem",
    });
  }
  if (type == "cards") {
    return ({
      view: "list",
      listView: "spaces://$kit/#*listView",
      listGroup: "spaces://$kit/#*gridGroup",
      listItem: "spaces://$kit/#*cardsListItem",
    });
  }
  if (type == "catalog") {
    return ({
      view: "list",
      listView: "spaces://$kit/#*listView",
      listGroup: "spaces://$kit/#*rowGroup",
      listItem: "spaces://$kit/#*coverListItem",
    });
  }
  if (type == "gallery") {
    return ({
      view: "list",
      listView: "spaces://$kit/#*listView",
      listGroup: "spaces://$kit/#*masonryGroup",
      listItem: "spaces://$kit/#*imageListItem",
    });
  }
  if (type == "calendar") {
    return ({
      view: "list",
      listView: "spaces://$kit/#*calendarView",
      listGroup: "spaces://$kit/#*dateGroup",
      listItem: "spaces://$kit/#*eventItem",
    });
  }
}

export const createInlineTable = async (superstate: ISuperstate, path: string, type?: string) => {

  
  let tableName = type == 'board' ? i18n.labels.board : i18n.menu.table;
    const schemas = await superstate.spaceManager.tablesForSpace(path)
    if (schemas) {
      tableName = uniqueNameFromString(
        tableName,
        schemas.map((f) => f.id)
      )
    }
  const viewID = await superstate.spaceManager.createTable(path, { id: tableName,
  name: tableName,
  type: "db",}).then(f => 
    superstate.spaceManager.addSpaceProperty(path, {...defaultTableFields[0], schemaId: tableName})
  ).then(async (f) => 
    { 
      const schemaTable = await superstate.spaceManager.framesForSpace(path)
      const schema = {
        id: uniqueNameFromString(
          tableName,
          schemaTable?.map((f) => f.id) ?? []
        ),
        name: tableName,
        type: "view",
        predicate: JSON.stringify({
          ...defaultPredicate,
          ...(type ? predicateForViewType(type) : {view: "table"}),
        }),
        def: JSON.stringify({
          db: tableName,
          icon: type == 'board' ? "ui//square-kanban" : "ui//table",
        }),
      }
      await superstate.spaceManager.createFrame(path, schema)
      return schema.id;
      }
  )
   
    return viewID;
  };