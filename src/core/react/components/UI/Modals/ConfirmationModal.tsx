import i18n from "core/i18n";
import React from "react";

export const ConfirmationModal = (props: {
  hide?: () => void;
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
    <div className="mk-modal-contents">
      <div className="mk-modal-message">{message}</div>
      <div className="mk-button-group">
        <button onClick={() => confirm()} className="mod-warning">
          {confirmLabel}
        </button>
        <button onClick={() => hide && hide()}>{i18n.buttons.cancel}</button>
      </div>
    </div>
  );
};
