import i18n from "core/i18n";
import React from "react";

export const ConfirmationModal = (props: {
  hide: () => void;
  confirmAction: () => void;
  message: string;
  confirmLabel: string;
}) => {
  const { hide, confirmAction, message, confirmLabel } = props;
  const confirm = () => {
    confirmAction();
    hide();
  };
  return (
    <div className="mk-layout-column mk-gap-16">
      <div>{message}</div>
      <div className="mk-layout-row mk-layout-justify-end mk-gap-16">
        <button onClick={() => confirm()} className="mod-warning">
          {confirmLabel}
        </button>
        <button onClick={() => hide()}>{i18n.buttons.cancel}</button>
      </div>
    </div>
  );
};
