import { Superstate } from "makemd-core";
import i18n from "shared/i18n";
import React from "react";

export const Templates = (props: { superstate: Superstate }) => {
  return (
    <div>
      <h1>{i18n.labels.templates}</h1>
    </div>
  );
};
