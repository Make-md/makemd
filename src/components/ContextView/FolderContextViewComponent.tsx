import "css/FlowComponent.css";
import MakeMDPlugin from "main";
import { TFile, TFolder } from "obsidian";
import React, { useEffect, useRef, useState } from "react";
import { folderContextFromFolder } from "utils/contexts/contexts";
import { getAbstractFileAtPath } from "utils/file";
import { spawnPortal } from "utils/flow/flowEditor";
import { ContextListView } from "./ContextListView";
import { FilterBar } from "./FilterBar/FilterBar";
import { MDBProvider } from "./MDBContext";

export interface ContextViewComponentProps {
  folder?: TFolder;
  type: "folder" | "tag";
  tag?: string;
  plugin: MakeMDPlugin;
}

export const FolderContextViewComponent = (
  props: ContextViewComponentProps
) => {
  const folder = props.folder?.path;
  const path = folderContextFromFolder(props.plugin, folder);
  const ref = useRef<HTMLDivElement>(null);


  const folderNotePath = props.plugin.settings.folderNoteInsideFolder
    ? `${props.folder.path}/${props.folder.name}.md`
    : props.folder && props.folder.parent.path == "/"
    ? `${props.folder.name}.md`
    : `${props.folder.parent.path}/${props.folder.name}.md`;

  const folderNote = getAbstractFileAtPath(app, folderNotePath);

  const [flowOpen, setFlowOpen] = useState(
    props.plugin.settings.enableFolderNote &&
      props.plugin.settings.folderNoteOpenDefault &&
      folderNote
  );

  const loadFile = async () => {
    const folderNote = getAbstractFileAtPath(app, folderNotePath);
    if (folderNote) {
      const div = ref.current;
      const newLeaf = spawnPortal(props.plugin, div);
      newLeaf.openFile(folderNote as TFile);
    } else {
      const div = ref.current;
      //@ts-ignore
      const newFile = await app.fileManager.createNewMarkdownFile(
        app.vault.getRoot(),
        folderNotePath
      );
      const newLeaf = spawnPortal(props.plugin, div);
      newLeaf.openFile(newFile as TFile);
    }
  };

  useEffect(() => {
    if (flowOpen) {
      loadFile();
    } else {
      if (ref.current) ref.current.empty();
    }
  }, [flowOpen]);
  const viewFolderNote = (open: boolean) => {
    setFlowOpen(open);
  };

  return (
    <div className="mk-folder-scroller">
      <div className="mk-folder-header">
        <div className="inline-title">{props.folder.name}</div>
      </div>
      {props.plugin.settings.enableFolderNote ? (
        <MDBProvider plugin={props.plugin} dbPath={path} folder={folder}>
          <FilterBar
            plugin={props.plugin}
            folderNoteName={props.folder.name}
            folderNoteOpen={flowOpen}
            viewFolderNote={viewFolderNote}
          ></FilterBar>
          {path && !flowOpen && (
            <ContextListView plugin={props.plugin}></ContextListView>
          )}
          {flowOpen && (
            <div className="mk-flowspace-editor mk-foldernote" ref={ref}></div>
          )}
        </MDBProvider>
      ) : (
        <MDBProvider plugin={props.plugin} dbPath={path} folder={folder}>
          <FilterBar plugin={props.plugin}></FilterBar>
          <ContextListView plugin={props.plugin}></ContextListView>
        </MDBProvider>
      )}
    </div>
  );
};
