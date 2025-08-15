import { i18n, Superstate } from "makemd-core";
import React, { useEffect, useState } from "react";

export const showWarningsModal = (superstate: Superstate, win: Window) => {
  superstate.ui.openModal(
    i18n.labels.syncWarnings,
    <SyncWarnings superstate={superstate} />,
    win
  );
};

export const SyncWarnings = (props: {
  superstate: Superstate;
  hide?: () => void;
}) => {
  const { superstate } = props;
  const [warnings, setWarnings] = useState(superstate.ui.getWarnings());
  const settingsChanged = () => {
    setWarnings(
      props.superstate.ui
        .getWarnings()
        .filter(
          (f) =>
            !props.superstate.settings.suppressedWarnings.some((g) => f.id == g)
        )
    );
  };

  useEffect(() => {
    props.superstate.eventsDispatcher.addListener(
      "settingsChanged",
      settingsChanged
    );
    return () => {
      props.superstate.eventsDispatcher.removeListener(
        "settingsChanged",
        settingsChanged
      );
    };
  }, []);
  return (
    <div className="mk-modal-contents">
      <div className='mk-modal-message'>
          {i18n.labels.syncWarnings}
      </div>
      <div className="mk-button-group">
        <button
          onClick={() => {
            superstate.eventsDispatcher.dispatchEvent("warningsChanged", null);
          }}
        >
          {i18n.buttons.refresh}
        </button>
        {superstate.settings.suppressedWarnings.length > 0 && (
          <button
            onClick={() => {
              superstate.settings.suppressedWarnings = [];
              superstate.saveSettings();
            }}
          >
            {i18n.buttons.showHidden}
          </button>
        )}
      </div>
      {warnings.length == 0 && (
        <div>
          <div className="mk-modal-heading">{i18n.labels.noWarnings}</div>
        </div>
      )}
      {warnings.map((f, i) => (
        <div key={i} className="mk-modal-card">
          <div className="mk-modal-heading">{f.message}</div>
          <div className="mk-modal-description">{f.description}</div>
          <div className="mk-button-group">
            {f.command.length > 0 && (
              <button
                onClick={() => {
                  superstate.cli.runCommand(f.command, {
                    iterations: 0,
                    instanceProps: {},
                    props: {},
                  });
                }}
              >
                {i18n.labels.resolve}
              </button>
            )}
            <button
              onClick={() => {
                superstate.settings.suppressedWarnings = [
                  ...superstate.settings.suppressedWarnings,
                  f.id,
                ];
                superstate.saveSettings();
              }}
            >
              {i18n.labels.ignore}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
