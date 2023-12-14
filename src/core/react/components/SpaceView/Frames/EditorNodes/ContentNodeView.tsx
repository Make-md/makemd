import React from "react";

export const ContentNodeView = (props: {
  children?: React.ReactNode;
  editable?: boolean;
}) => {
  return <>{props.children}</>;
};
