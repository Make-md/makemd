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
        table: "Table",
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
        openSpaces: 'Open Spaces',
        blink: 'Blink',
        openFileContext: "Open File Context",
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
        none: 'None',
        tableView: 'Table View',
        cardView: 'Card View',
        listView: 'List View',
        flowView: 'Flow View',
        groupBy: 'Group By',
        sortBy: 'Sort By',
        newFilter: 'New Filter',
        clearFilters: 'Clear Filters',
        unhideFields: 'Unhide All Properties',
        importDataview: "Import All Dataview Properties",
        saveAllProperties: "Save All Properties to Files",
        mergeProperties: "Merge Properties",
        openTag: 'Open Tag',
        removeTag: 'Remove Tag',
        deleteProperty: 'Delete Property',
        hideProperty: 'Hide Property',
        saveProperty: 'Save Property',
        sortAscending: 'Sort Ascending',
        sortDescending: 'Sort Descending',
        deleteRow: 'Delete Item',
        collapseAll: 'Collapse All',
        customSort: 'Custom Sort',
        fileNameSortAlphaAsc: "File Name (A to Z)",
        fileNameSortAlphaDesc: "File Name (Z to A)",
        createdTimeSortAsc: "Created Time (new to old)",
        createdTimeSortDesc: "Created Time (old to new)",
        spaces: 'Spaces',
        tags: 'Tags',
        manageHiddenFiles: 'Manage Hidden Files',
        unpinSpace: 'Unpin Space',
        pinSpace: 'Pin Space',
        deleteSpace: 'Delete Space',
        changeColor: 'Change Color',
        deleteFiles: 'Delete Files',
        createFolderSpace: 'Create Folder Space',
        folder: 'Folder'

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
        delete: 'Delete',
        toggleFlow: "Toggle Flow",
        openFlow: "Open Flow",
        hideFlow: "Hide Flow",
        openLink: "Open Link",
        addTag: 'Add Tag',
        tag: 'Tag',
        syncFields: 'Sync Properties',
        cutTable: 'Cut Table',
        deleteTable: 'Delete Table',
        blink: 'Blink',
        addFile: 'Add File',
        merge: "Merge",
        saveView: 'Save View',
        saveTable: 'Save Table',
        renameView: 'Rename View',
        renameTable: 'Rename Table',
        currentFolder: 'Current Folder',
        sync: 'Sync'
      },
      filterTypes: {
        contains: 'contains',
        notContains: 'does not contain',
        is: 'is',
        isNot: 'is not',
        before: 'before',
        after: 'after',
        anyOf: 'is any of',
        noneOf: 'is none of',
        checked: 'is checked',
        unchecked: 'is unchecked'
      },
      sortTypes: {
        alphaAsc: "A to Z",
        alphaDesc: "Z to A",
        checkAsc: "Checked → Unchecked",
        checkDesc: "Unchecked → Checked",
        itemsAsc: "Least Items",
        itemsDesc: "Most Items"
      },
      properties: {
        defaultField: 'Name',
        text: {
          label: 'Text'
        },
        number: {
          label: 'Number'
        },
        preview: {
          label: 'Preview'
        },
        boolean: {
          label: 'Yes/No'
        },
        date: {
          label: 'Date',
        },
        option: {
          label: 'Option',
        },
        file: {
          label: 'File',
        },
        link: {
          label: 'Link',
        },
        tag: {
          label: 'Tag'
        },
        context: {
          label: 'Context'
        },
        image: {
          label: 'Image'
        },
        fileProperty: {
          label: 'File Property',
          createdTime: 'Created',
          modifiedTime: 'Last Edited',
          extension: 'Extension',
          size: 'Size',
          preview: 'Note Preview',
          parentFolder: 'Folder'
        }
      },
      labels: {
        createFolder: "New Folder Name",
        rename: "Rename Note",
        renameSection: "Rename Space",
        createSection: "New Space",
        createNote: "New Note Name",
        select: 'Select',
        collapse: "Collapse",
        expand: "Expand",
        findStickers: "Find Sticker",
        mergeProperties: "Merge Properties",
        placeholder: "Type '/' for commands",
        noFile: "is not created yet. Click to create.",
        blinkPlaceholder: "Quickly Search a File, Folder, Tag... Press Tab to Edit",
        searchPlaceholder: "Type to search...",
        contextItemSelectPlaceholder: 'Find Item',
        linkItemSelectPlaceholder: "Find Note",
        optionItemSelectPlaceholder: "Select Option",
        viewItemSelectPlaceholder: "Select View",
        tagItemSelectPlaceholder: "Find Tag",
        propertyItemSelectPlaceholder: "Select Property",
        sortItemSelectPlaceholder: "Select Sort",
        filterItemSelectPlaceholder: "Select Filter",
        syncFrontmatterProperty: 'Sync Frontmatter Property',
        newProperty: 'New Property',
        propertyType: 'Type',
        propertyContext: 'Context',
        propertyFileProp: 'Property',
        filesCount: '{$1} Files',
        hiddenFiles: 'Hidden Files',
        addExtension: 'Add Extension',
        saveView: 'Save View',
        saveTable: 'Save Table',
        renameView: 'Rename View',
        renameTable: 'Rename Table',
        syncMetadata: 'Sync Metadata',
        syncProperties: 'Sync Properties',
        selectContext: 'Select Context'
      },
      descriptions: {
        syncMetadata: 'Select which fields from your notes to start syncing with the context.',
        syncProperties: 'Contexts defines and syncs the same fields across your notes depending on their folder or tag.',
        selectContext: 'Select which folder or tag context you want to sync the fields.'
      },
      flowView: {
        emptyDoc: "Empty Document",
        itemsCount: " Items",
        emptyFolder: "This Folder is Empty",
      },
      notice: {
        duplicateFile: "Folder already contains note with same name",
        addedToSection: "Added to Space",
        fileExists: "File Already Exists",
        folderExists: "Folder Already Exists",
        noPropertyName: 'Property Name is Required',
        duplicatePropertyName: 'Duplicate Property Name',
        newSpaceName: "Enter a name for your space",
        duplicateSpaceName: "Space name already exists"

      },
      settings: {
        sectionSidebar: "Spaces",
        sectionEditor: "Maker Mode",
        sectionFlow: "Flow Editor",
        sectionAdvanced: "Advanced",
        sectionAppearance: 'Appearance',
        sectionContext: 'Context',
        folderNoteLocation: {
          name: "Folder Note Location Inside Folder",
          desc: "Turn on to have folder notes inside the folder, turn off to have it outside"
        },
        internalLinkFlowEditor: {
          name: "Open Flow Editor on Internal Link Click",
          desc: "Turn on to toggle Flow Editor directly by clicking on internal links, otherwise a tooltip will be shown",
        },
        syncContextToFrontmatter: {
          name: "Sync Context Fields to Frontmatter",
          desc: "Turn on to automatically save all context fields to frontmatter fields, not just existing frontmatter fields."
        },
        openFileContext: {
          name: "Auto Open File Context",
          desc: "Automatically open file context panel in the right panel"
        },
        folderNote: {
          name:"Enable Folder Note",
          desc:"Access the folder note in the folder page and hide the folder note from spaces"
        },
        folderNoteOpenDefault: {
          name: 'Open Folder Note by Default',
          desc: 'When accessing a folder, open the folder note by default.',
        },
        activeFile: {
          name: "Reveal Active File",
          desc: "Automatically reveal the active file in Spaces"
        },
        compactMode: {
          name: "Compact Mode",
          desc: "Display the Spaces menu in a more compact format",
        },
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
        hideRibbon: {
          name: "App Ribbon",
          desc: `Show/hide the left menu aka. ribbon`,
        },
        sidebarTabs: {
          name: "Sidebar Tabs",
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
          minimal: "Minimal",
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
