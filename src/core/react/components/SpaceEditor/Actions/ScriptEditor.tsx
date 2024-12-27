import React, { useMemo } from "react";

import { javascript } from "@codemirror/lang-javascript";
import { githubDark } from "@uiw/codemirror-theme-github";
import ReactCodeMirror from "@uiw/react-codemirror";
import { Superstate } from "makemd-core";
import { Command } from "shared/types/commands";
import { ActionTester } from "./ActionTester";

export const ScriptEditor = (props: {
  superstate: Superstate;
  command: Command;
  saveCommand: (command: Command) => void;
  values: { [key: string]: any };
  path: string;
}) => {
  const { command } = props;
  const value = useMemo(() => {
    if (!command) return "";
    return `const ${command.schema.id} = (${command.fields
      .map((f) => `${f.name}: ${f.type}`)
      .join(", ")}, $api: API, $contexts) => {\n${command.code}\n}`;
  }, [command]);
  const saveCommand = (value: string) => {
    props.saveCommand({
      ...command,
      code: value.split("\n").slice(1, -1).join("\n"),
      codeType: "script",
    });
  };

  return (
    <div>
      <ReactCodeMirror
        className="mk-editor-code"
        value={value}
        height="100%"
        theme={githubDark}
        extensions={[javascript({ jsx: true })]}
        onChange={saveCommand}
      />
      <ActionTester
        type="script"
        code={command.code}
        fields={command.fields}
        value={{}}
        superstate={props.superstate}
        path={props.path}
      ></ActionTester>
    </div>
  );
};
