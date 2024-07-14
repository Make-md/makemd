import { SidebarProvider } from "core/react/context/SidebarContext";
import { Superstate } from "core/superstate/superstate";
import { isTouchScreen } from "core/utils/ui/screen";
import React from "react";
import { MainMenu } from "../../core/react/components/Navigator/MainMenu";

export const replaceMobileMainMenu = (superstate: Superstate) => {
  if (isTouchScreen(superstate.ui)) {
    const header = app.workspace.containerEl.querySelector(
      ".workspace-drawer.mod-left .workspace-drawer-header-left"
    );
    header.innerHTML = "";
    const reactEl = superstate.ui.createRoot(header);
    reactEl.render(
      <SidebarProvider superstate={superstate}>
        <MainMenu superstate={superstate}></MainMenu>
      </SidebarProvider>
    );
  }
};
