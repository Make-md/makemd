import i18n from "shared/i18n";
import MakeBasicsPlugin from "../basics";

export const loadFlowCommands = (plugin: MakeBasicsPlugin) => {
    // this.addCommand({
      //   id: 'mk-prev',
      //   name: "Mod Up",
      //   callback: () => {
      //     const cm = getActiveCM(this);
      //     if (cm) {
      //       const value = cm.state.field(flowEditorInfo, false);
      //       const currPosition = cm.state.selection.main;
      //       const sod = cursorDocStart({state: cm.state, dispatch: cm.dispatch});
      //     }
      //   },
      //   hotkeys: [{
      //     modifiers: ["Mod"],
      //     key: "ArrowUp",
      //   },]
      // })
      // this.addCommand({
      //   id: 'mk-next',
      //   name: "Mod Down",
      //   callback: () => {
      //     const cm = getActiveCM(this);
      //     if (cm) {
      //       const value = cm.state.field(flowEditorInfo, false);
      //       const currPosition = cm.state.selection.main;
      //       if (cm.state.selection.main.to == cm.state.doc.length) {
      //         alert('hello')
      //       } else {
      //         cursorDocEnd({state: cm.state, dispatch: cm.dispatch});
      //       }
            
      //     }
      //   },
      //   hotkeys: [{
      //     modifiers: ["Mod"],
      //     key: "ArrowDown",
      //   },]
      // })


      plugin.plugin.addCommand({
        id: "mk-open-flow",
        name: i18n.commandPalette.openFlow,
        callback: () => plugin.openFlow(),
      });

      plugin.plugin.addCommand({
        id: "mk-close-flow",
        name: i18n.commandPalette.closeFlow,
        callback: () => plugin.closeFlow(),
      });
}