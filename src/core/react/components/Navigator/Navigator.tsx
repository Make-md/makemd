import { SidebarProvider } from "core/react/context/SidebarContext";
import { Superstate } from "core/superstate/superstate";
import React from "react";
import { MainList } from "./MainList";
export const Navigator = (props: { superstate: Superstate }) => {
  return (
    <div className="mk-sidebar">
      <SidebarProvider superstate={props.superstate}>
        <MainList superstate={props.superstate}></MainList>
      </SidebarProvider>
    </div>
  );
};
