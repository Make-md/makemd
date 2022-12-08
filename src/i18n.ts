class T {
  lang: string;

  all = {
    en: {
      commands: {
        h1: "Heading 1",
        h2: "Heading 2",
        h3: "Heading 3",
        list: "Bullet List",
        "ordered-list": "Numbered List",
        todo: "To-do List",
        quote: "Quote",
        divider: "Divider",
        note: "Link to Note",
        link: "Web Link",
        callout: "Callout",
        codeblock: "Code Block",
        emoji: "Emoji",
        image: "Image",
        flow: "Flow Note",
        tag: "Tag",
        makeMenu: "Make Menu",
        selectStyle: "Style",
        toggleKeyboard: "Toggle Keyboard",
      },
      styles: {
        bold: "Bold",
        italics: "Italics",
        strikethrough: "Strikethrough",
        code: "Code",
        link: "Web Link",
        blocklink: "Link to Note",
        textColor: "Text Color",
        highlight: "Highlight",
      },
      commandsSuggest: {
        noResult: "No result",
      },
      commandPalette: {
        enable: "Enable",
        disabled: "Disable",
        openFlow: "Open Flow Editors in Selection",
        closeFlow: "Close Flow Editors in Selection",
        toggleBold: "Toggle Bold",
        toggleItalics: "Toggle Italics",
      },
      menu: {
        openFilePane: "Open in a new pane",
        rename: "Rename",
        moveFile: "Move file to...",
        duplicate: "Make a copy",
        edit: "Edit",
        delete: "Delete",
        getHelp: "Make.md Community",
        openVault: "Open Another Vault",
        obSettings: "Obsidian Settings",
        commandPalette: "Command Palette",
        backToSpace: "Back to Spaces",
        newSpace: "New Space",
        collapseAllSections: "Collapse All Spaces",
        expandAllSections: "Expand All Spaces",
        collapseAllFolders: "Collapse All Folders",
        expandAllFolders: "Expand All Folders",
        spaceTitle: "Add/Remove in Space",
      },
      buttons: {
        moreOptions: "More Options",
        newNote: "New Note",
        changeIcon: "Change Sticker",
        removeIcon: "Remove Sticker",
        rename: "Change Name",
        createFolder: "New Folder",
        createNote: "New Note",
        createSection: "New Space",
        cancel: "Cancel",
        search: "Search",
        toggleFlow: "Toggle Flow",
        openFlow: "Open Flow",
        hideFlow: "Hide Flow",
        openLink: "Open Link",
      },
      labels: {
        createFolder: "New Folder Name",
        rename: "Rename Note",
        renameSection: "Rename Space",
        createSection: "New Space",
        createNote: "New Note Name",
        collapse: "Collapse",
        expand: "Expand",
        findStickers: "Find Sticker",
        placeholder: "Type '/' for commands",
        noFile: "is not created yet. Click to create.",
      },
      flowView: {
        emptyDoc: "Empty Document",
        itemsCount: " Items",
        emptyFolder: "This Folder is Empty",
      },
      notice: {
        duplicateFile: "Folder already contains note with same name",
        addedToSection: "Added to Space",
      },
      settings: {
        sectionSidebar: "Spaces",
        sectionEditor: "Maker Mode",
        sectionFlow: "Flow Editor",
        sectionAdvanced: "Advanced",
        spaces: {
          name: "Spaces",
          desc: `Spaces gives you control over how you organize your files`,
        },
        spacesStickers: {
          name: "Stickers",
          desc: `Use Emojis to make it easier to find your notes`,
        },
        spacesFileExplorerDual: {
          name: "Use Spaces Alongside File Explorer",
          desc: "This will allow plugins that uses the File Explorer to work while using Spaces",
        },
        spacesDeleteOption: {
          name: "Delete File Option",
          desc: "Select how you want files to be deleted",
        },
        spacesDeleteOptions: {
          permanant: "Delete Permanently",
          trash: "Move to Obsidian Trash",
          "system-trash": "Move to System Trash",
        },
        
        sidebarTabs: {
          name: "Show Sidebar Tabs",
          desc: `Show/hide other sidebar tabs`,
        },
        spacesPerformance: {
          name: "Spaces Performance Mode",
          desc: `Turn on performance mode for Spaces, may affect scrolling appearance. Requires Restart`,
        },
        inlineStyler: {
          name: "Inline Styler",
          desc: `Select text to add styling, recommended for Flow Editor`,
        },
        inlineStylerColor: {
          name: "Text and Highlight Colors 🧪",
          desc: `Select text color and highlight color, (this may change in the future because of the limitations with HTML and Obsidian)`,
        },
        makeChar: {
          name: "Make Menu Trigger",
          desc: "Character to open the Make Menu",
        },
        mobileMakeBar: {
          name: "Make Bar (Mobile)",
          desc: "Replaces the mobile toolbar",
        },
        editorMarkSans: {
          name: "Mark Sans 🧪",
          desc: `Use the editor without Markdown.`,
        },
        editorMakePlacholder: {
          name: "Make Menu Hint Text",
          desc: `Show a hint text on how to open the Make Menu Shortcut`,
        },
        editorMakeMenu: {
          name: "Make Menu Shortcut",
          desc: `Open the Make menu to quickly add content`,
        },
        editorFlowReplace: {
          name: "Flow Editor",
          desc: `Open your internal links or toggle your embeds in the flow editor.`,
        },
        editorFlowStyle: {
          name: "Flow Editor Style",
          desc: "Select a theme for your flow editors",
          seamless: "Seamless",
          classic: "Classic",
        },
      },
    },
  };

  constructor() {
    this.lang = localStorage.getItem("language");
  }

  get texts(): typeof this.all.en {
    return this.all["en"];
  }
}

export default new T().texts;
