import { initiateContextIfNotExists } from "dispatch/mdb";
import MakeMDPlugin from "main";
import React, { useContext } from "react";
import { uniq } from "utils/array";
import { connectContext } from "utils/contexts/mdb";
import { updateTagsForDefString } from "utils/metadata/tags";
import { MDBContext } from "../MDBContext";
import { TagsView } from "../TagsView/TagsView";
export const TagSelector = (props: {
  plugin: MakeMDPlugin;
  canAdd: boolean;
}) => {
  const {
    data,
    tagContexts,
    dbFileExists,
    setContextTable,
    saveDB,
    tableData,
    cols,
    contextTable,
    dbSchema,
    contextInfo,
    saveContextDB,
    saveSchema,
    loadContextFields,
  } = useContext(MDBContext);
  const removeContext = (value: string) => {
    const tags = tagContexts.filter((f) => value != f);
    saveSchema({
      ...dbSchema,
      def: updateTagsForDefString(dbSchema.def, tags),
    });
  };
  const addTag = async (tag: string) => {
    const tags = uniq([...tagContexts, tag]);
    tags.forEach((tag) => {
      initiateContextIfNotExists(props.plugin, tag).then((f) =>
        loadContextFields(tag)
      );
    });
    saveSchema({
      ...dbSchema,
      def: updateTagsForDefString(dbSchema.def, tags),
    });
    connectContext(props.plugin, tag, contextInfo.dbPath);
  };

  return (
    <TagsView
      plugin={props.plugin}
      tags={tagContexts}
      canOpen={false}
      addTag={props.canAdd && addTag}
      removeTag={removeContext}
    ></TagsView>
  );
};
