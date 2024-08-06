import { SidebarProvider } from "core/react/context/SidebarContext";
import { isTouchScreen } from "core/utils/ui/screen";
import MakeMDPlugin from "main";
import React from "react";
import { MainMenu } from "../../core/react/components/Navigator/MainMenu";

export const replaceMobileMainMenu = (plugin: MakeMDPlugin) => {
  if (isTouchScreen(plugin.superstate.ui)) {
    const header = plugin.app.workspace.containerEl.querySelector(
      ".workspace-drawer.mod-left .workspace-drawer-header-left"
    );
    header.innerHTML = "";
    const reactEl = plugin.superstate.ui.createRoot(header);
    reactEl.render(
      <SidebarProvider superstate={plugin.superstate}>
        <MainMenu superstate={plugin.superstate}></MainMenu>
      </SidebarProvider>
    );
  }
};
