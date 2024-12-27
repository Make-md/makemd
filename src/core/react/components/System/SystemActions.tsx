import { Superstate } from "makemd-core";
import React, { useState } from "react";
import { Command } from "shared/types/commands";
import { SpaceCommand } from "../SpaceEditor/Actions/SpaceActions";
export const SystemActionsEditor = (props: { superstate: Superstate }) => {
  const [selectedCommand, setSelectedCommand] = useState<{
    library: string;
    command: Command;
  }>();

  const saveCommand = (command: Command) => {
    props.superstate.spaceManager.saveSystemCommand(
      selectedCommand.library,
      command
    );
  };
  const addLibrary = () => {
    props.superstate.spaceManager.saveSystemCommand(
      selectedCommand.library,
      null
    );
  };
  return (
    <div style={{ display: "flex" }}>
      {selectedCommand && (
        <div>
          <SpaceCommand
            superstate={props.superstate}
            action={
              "spaces://$actions/" +
              selectedCommand.library +
              "/#;" +
              selectedCommand.command.schema.id
            }
          ></SpaceCommand>
        </div>
      )}
    </div>
  );
};
