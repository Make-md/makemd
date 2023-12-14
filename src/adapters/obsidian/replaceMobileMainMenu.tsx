import { SidebarProvider } from "core/react/context/SidebarContext";
import { Superstate } from "core/superstate/superstate";
import React from "react";
import { createRoot } from "react-dom/client";
import { MainMenu } from "../../core/react/components/Navigator/MainMenu";

export const replaceMobileMainMenu = (superstate: Superstate) => {
  if (superstate.ui.getScreenType() == "mobile") {
    const header = app.workspace.containerEl.querySelector(
      ".workspace-drawer.mod-left .workspace-drawer-header-left"
    );
    header.empty();
    const reactEl = createRoot(header);
    reactEl.render(
      <SidebarProvider superstate={superstate}>
        <MainMenu superstate={superstate}></MainMenu>
      </SidebarProvider>
    );
  }
};
