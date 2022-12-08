import MakeMDPlugin from "main";
import { useRecoilState } from "recoil";
import { createNewMarkdownFile } from "utils/utils";
import * as recoilState from "recoil/pluginState";
import React from "react";
import "css/NewNote.css";
import t from "i18n";
import { uiIconSet } from "utils/icons";
interface NewNotesComponentProps {
  plugin: MakeMDPlugin;
}

export const NewNotes = (props: NewNotesComponentProps) => {
  const [focusedFolder, setFocusedFolder] = useRecoilState(
    recoilState.focusedFolder
  );
  const { plugin } = props;
  const newFile = async () => {
    await createNewMarkdownFile(props.plugin.app, focusedFolder, "", "");
  };
  return (
    <div className="mk-flow-bar">
      <button
        aria-label={t.buttons.newNote}
        className="mk-new-note"
        onClick={() => newFile()}
      >
        <div
          dangerouslySetInnerHTML={{ __html: uiIconSet["mk-ui-new-note"] }}
        ></div>
        <p>{t.buttons.newNote}</p>
      </button>
    </div>
  );
};
