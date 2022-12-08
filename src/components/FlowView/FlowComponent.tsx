import dayjs from "dayjs";
import MakeMDPlugin from "main";
import { TAbstractFile, TFile, TFolder } from "obsidian";
import React, { useState } from "react";
import { openFile } from "utils/utils";
import { FileRow } from "./FileRow";
import { FlowRow } from "./FlowRow";
import "css/FlowComponent.css";
import t from "i18n";
interface FolderComponentProps {
  folder: TFolder;
  plugin: MakeMDPlugin;
}

export type FolderObject = {
  children?: TAbstractFile[];
  file: TAbstractFile;
  type: string;
  icon: string;
  name: string;
  path: string;
  created?: number;
};

export const FolderComponent = (props: FolderComponentProps) => {
  // @ts-ignore
  const filteredNotes: FolderObject[] = props.folder.children.map((f) => {
    return {
      //@ts-ignore
      type: f.children ? "folder" : f.extension,
      file: f,
      name: f.name,
      path: f.path,
      icon: props.plugin.settings.fileIcons.find(
        ([path, icon]) => path == f.path
      ),
      //@ts-ignore
      children: f.children,
      //@ts-ignore
      created: f.stat ? f.stat.ctime : undefined,
    };
  });
  return (
    <div className="mk-folder-scroller">
      <div className="mk-folder-sizer">
        <div className="mk-folder-header">
          <div className="inline-title">{props.folder.name}</div>
        </div>
        {filteredNotes.length > 0 ? (
          <div>
            {filteredNotes.map((f, i) => (
              <FlowRow key={i} item={f} plugin={props.plugin}></FlowRow>
            ))}
          </div>
        ) : (
          <div className="mk-folder-empty">{t.flowView.emptyFolder}</div>
        )}
      </div>
    </div>
  );
};
