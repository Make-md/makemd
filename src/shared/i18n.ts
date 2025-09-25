class I18nLoader {
  private strings: Record<string, any>;
  private overrides: Record<string, any> = {};

  constructor() {
    this.strings = this.loadDefaultStrings();
  }

  private loadDefaultStrings() {
    return {
    en: {
      hintText: {
        fileName: "Enter File Name",
        alias: "Enter Display Name",
        newItem: "+ New",
        selectNote: "Select Note...",
        newFrame: "New",
        createListItem: "Create List Item",
        dragDropProperties: "Drag and drop to reorder properties",
        dragDropModifierKeys: "Hold Shift to select multiple items",
        hiddenExtensionsPlaceholder: "e.g., .mdb, _assets, _blocks",
        workspaceName: "Your workspace name",
      },
      defaults: {
        spaceNote: "Current Note",
        spaceContext: "Current Space",
      },
      commands: {
        h1: "Heading 1",
        h2: "Heading 2",
        h3: "Heading 3",
        h4: "Heading 4",
        h5: "Heading 5",
        h6: "Heading 6",
        columns: "Columns",
        tabs: "Tabs",
        button: "Button",
        label: "Label",
        column: "Column",
        idea: "New",
        group: "Group",
        paragraph: "Text",
        card: "Card",
        cardDesc: "Card container with styled background",
        progress: "Progress",
        rating: "Rating",
        circularProgress: "Circular Progress",
        list: "Bullet List",
        "ordered-list": "Numbered List",
        todo: "To-do List",
        quote: "Quote",
        internal: "Link to Note",
        context: "Embed Existing Context",
        flowEmbed: "Embed Note or Space",
        board: "New Board",
        divider: "Divider",
        note: "Note Block",
        link: "Web Link",
        internalLink: "Link",
        callout: "Callout",
        bookmark: "Bookmark",
        table: "New Table",
        codeblock: "Code Block",
        toggle: "Toggle",
        emoji: "Emoji",
        image: "Image",
        chart: "Chart",
        
        newNote: "Note",
        tag: "Tag",
        makeMenu: "Flow Menu",
        selectStyle: "Style",
        toggleKeyboard: "Toggle Keyboard",
        rows: "Rows",
        masonry: "Gallery",
        toggleEnhancedLogs: "Toggle Enhanced Logs",
        fixPathCharacters: "Fix Path Characters",
        moveSpaceDataFolder: "Move Space Data Folder",
        flow: "Flow",
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
        openFlow: "Open Flow Blocks in Selection",
        closeFlow: "Close Flow Blocks in Selection",
        toggleBold: "Toggle Bold",
        toggleItalics: "Toggle Italics",
        openSpaces: "Open Navigator",
        blink: "Blink",
        revealFile: "Reveal File in Navigator",
        releaseNotes: "Release Notes",
        getStarted: "Get Started",
        toggleBacklinks: "Toggle Backlinks",
        pinActiveFileToSpace: "Pin Active File to Space",
        closeExtraFileTabs: "Close Extra File Tabs",
        convertPathToSpace: "Convert Path to Space",
        openFileContext: "Open File Context",
      },
      frames: {
        sections: {
          kit: "Kit",
          paths: "Paths",
        },
        label: {
          label: "Label",
          description: "Label",
        },
        note: {
          label: "Note",
          description: "Link to a Note",
        },
        table: {
          label: "Table",
          description: "Table",
        },
        context: {
          label: "Context",
          description: "Display a context view from another space",
        },
        calendar: {
          label: "Calendar View",
        },
        field: {
          label: "Field",
          description: 'Dynamic node that displays a value based on property type',
        },
        event: {
          label: "Event",
        },
        divider: {
          label: "Divider",
          description: "Divider to separate your content",
        },
        button: {
          label: "Button",
          description: 'Buttons can perform actions and open links',
        },
        callout: {
          label: "Callout",
          description: "Callout to highlight important information",
        },
        toggle: {
          label: "Toggle",
          description: "Toggle to show/hide content",
        }
      },
      menu: {
        // Chart types
        barChart: "Bar Chart",
        lineChart: "Line Chart",
        scatterPlot: "Scatter Plot",
        pieChart: "Pie Chart",
        areaChart: "Area Chart",
        radarChart: "Radar Chart",
        
        // Data configuration
        space: "Space",
        list: "List",
        category: "Category",
        values: "Values",
        xAxisField: "X-Axis Field",
        yAxisFields: "Y-Axis Fields",
        selectDataSource: "Select a data source",
        selectSpace: "Select a space",
        selectCategoryField: "Select category field",
        selectXAxisField: "Select X-axis field",
        selectValueFields: "Select value fields",
        selectYAxisFields: "Select Y-axis fields",
        
        // Legend
        legend: "Legend",
        hidden: "Hidden",
        hideLegend: "Hide Legend",
        showLegend: "Show Legend",
        legendPosition: "Position",
        orientation: "Orientation",
        horizontal: "Horizontal",
        vertical: "Vertical",
        legendTop: "Top",
        legendBottom: "Bottom",
        legendLeft: "Left",
        legendRight: "Right",
        
        // Color
        colorPalette: "Color Palette",
        defaultPalette: "Default",
        
        // Labels
        axisLabels: "Labels",
        
        // Aggregation
        groupBy: "Group By",
        aggregate: "Aggregate",
        count: "Count",
        sum: "Sum",
        average: "Average",
        min: "Min",
        max: "Max",
        distinct: "Distinct",
        
        layout: "Layout",
        newView: "New",
        calendarView: "Calendar View",
        dayView: "Day View",
        closeSpace: "Remove from Focus",
        customView: "Custom View",
        detailsView: "Details View",
        catalogView: "Catalog View",
        galleryView: "Gallery View",
        deleteContext: "Delete Context",
        openSpace: 'Open',
        setNone: 'None',
        applyItems: "Apply to Items in Folder",
        rename: "Rename",
        changeToFolderNote: "Convert to Folder Note",
        moveFile: "Move File to...",
        moveFolder: "Move Folder to...",
        duplicate: "Make a copy",
        edit: "Edit",
        delete: "Delete",
        getHelp: "Make.md Community",
        vault: "Vault",
        openVault: "Open Another Vault",
        openVaultInFolder: "Open Vault Folder",
        obSettings: "Obsidian Settings",
        commandPalette: "Command Palette",
        backToSpace: "Back to Navigator",
        collapseAllSections: "Collapse All Spaces",
        expandAllSections: "Expand All Spaces",
        collapseAllFolders: "Collapse All Folders",
        settings: "Settings",
        expandAllFolders: "Expand All Folders",
        spaceTitle: "Add/Remove in Space",
        home: "Home",
        none: "None",
        tableView: "Table View",
        cardView: "Card View",
        boardView: "Board View",
        listView: "List View",
        flowView: "Flow View",
        group: "Group",
        sortBy: "Sort",
        filters: "Filters",
        newFilter: "New Filter",
        clearFilters: "Clear Filters",
        hide: "Hide",
        unhideProperties: "Unhide All Properties",
        unhideFields: "Unhide All Fields",
        importDataview: "Import All Dataview Properties",
        saveAllProperties: "Save All Properties to Files",
        mergeProperties: "Merge Properties",

        removeFromSpace: "Unpin from ${1}",
        editCode: "Edit Code",
        editProperties: "Edit Properties",
        properties: "Properties",
        deleteProperty: "Delete Property",
        hideProperty: "Hide Property",
        unhideProperty: "Unhide Property",
        saveProperty: "Save Property",
        sortAscending: "Sort Ascending",
        sortDescending: "Sort Descending",
        deleteRow: "Delete Item",
        collapseAll: "Collapse All",
        customSort: "Custom Sort",
        groupSpaces: "Group Spaces",
        recursiveSort: "Apply to Subfolders",
        fileNameSortAlphaAsc: "File Name (A to Z)",
        fileNameSortAlphaDesc: "File Name (Z to A)",
        fileNameSortNumericalAsc: "File Name (1 to 9)",
        fileNameSortNumericalDesc: "File Name (9 to 1)",
        createdTimeSortAsc: "Created Time (new to old)",
        createdTimeSortDesc: "Created Time (old to new)",
        modifiedTimeSortAsc: "Modified Time (new to old)",
        modifiedTimeSortDesc: "Modified Time (old to new)",
        sizeSortAsc: "Size (smallest to largest)",
        sizeSortDesc: "Size (largest to smallest)",
        spaces: "Spaces",
        tags: "Tags",
        manageHiddenFiles: "Manage Hidden Files",
        manageActions: "Manage Actions",
        deleteSpace: "Delete",
        changeColor: "Color",
        labels: "Labels",
        changePropertyType: "Change Type",
        deleteFiles: "Delete Files",
        createFolderSpace: "Create Space from Folder",
        folder: "Folder",
        syncToContext: "Add Property to Context",
        setIcon: "Set Sticker",
        copyEmbedLink: "Copy Embed Link",
        moveUp: "Move Up",
        moveDown: "Move Down",
        moveTo: "Move To",
        groupNodes: "Group Nodes",
        moveFrame: "Move Frame",
        renameFrame: 'Rename Frame',
        deleteFrame: "Delete Frame",
        insertAbove: "Insert Above",
        insertBelow: "Insert Below",
        toggleReadMode: "Toggle Read Mode",
        toggleFullWidth: "Toggle Full Width",
        showWarnings: "Show Warnings",
        renameSystem: "Rename System",
        openFilePane: "Open File Pane",
        openNativeMenu: "More Options",
        revealInDefault: "Reveal in Finder",
        revealInExplorer: "Reveal in Explorer",
      },
      editor: {
        rows: "Rows",
        columns: "Columns",
        scaleToFit: "Scale to Fit",
        scaleToFill: "Scale to Fill",
        catalog: "Catalog",
        gallery: "Gallery",
        grid: "Grid",
        fit: "Fit",
        fill: "Fill",
        stroke: "Stroke",
        strokeNone: "None",
        strokeSolid: "Solid",
        strokeDotted: "Dotted",
        strokeDashed: "Dashed",
        size: "Size",
        gap: "Gap",
        marginLeft: "Left",
        marginTop: "Top",
        marginRight: "Right",
        marginBottom: "Bottom",
        minimize: "Minimize",
        paddingLeft: "Left",
        paddingTop: "Top",
        paddingRight: "Right",
        paddingBottom: "Bottom",
        unlinkProperty: "Unlink Property",
        linkedProperty: "Linked Property",
        linkProperty: "Link Property",
        currentSpace: "Current Space",
        linkName: "${1} Link",
        linkThumbnail: "${1} Thumbnail",
        linkSticker: "${1} Sticker",
        opacity: "Opacity",
        shadowSpread: "Spread",
        shadowBlur: "Blur",
        width: "Width",
        height: "Height",
        margin: "Margin",
        padding: "Padding",
        bold: "Bold",
        italic: "Italic",
        underline: "Underline",
        alignLeft: "Align Left",
        alignCenter: "Align Center",
        alignRight: "Align Right",
        alignJustify: "Align Justify",
        numberOfLines: "Lines",
        createVerticalSection: "Create Vertical Section",
        createHorizontalSection: "Create Horizontal Section",
        themeColors: "Theme Colors",
        uiColors: "UI Colors",
        hex: "Hex",
      },
      buttons: {
        add: "Add",
        calculate: "Calculate",
        createNew: "Create New",
        import: "Import",
        cancel: "Cancel",
        create: "Create",
        select: "Select",
        togglePin: "Toggle Pin",
        refresh: "Refresh",
        showHidden: "Show Hidden",
        alias: "Alias",
        addFilter: "Add Filter",
        loadMore: "Load More",
        addCondition: "Add Condition",
        customize: "Customize",
        moreOptions: "More Options",
        saveProperty: "Save Property",
        newNote: "New Note",
        changeIcon: "Sticker",
        removeIcon: "Remove Sticker",
        addIcon: "Add Sticker",
        addCover: "Add Cover",
        addDisplay: "Display Name",
        changeBanner: "Change Cover",
        changeBannerShort: "Cover",
        saveChanges: "Save Changes",
        removeBanner: "Remove Cover",
        rename: "Change Name",
        editFrame: "Edit Frame",
        saveSpace: "Save Space",
        createSpace: "New Space",
        createFolder: "New Folder",
        createNote: "New Note",
        createCanvas: "New Canvas",
        addIntoSpace: "Pin Item",
        addSmartSearch: "Add Join",
        subFolders: "Sub Folders",
        addItem: "Add Item",
        addProperty: "Add Property",
        editProperty: "Edit Property",
        addContext: "Add Tag",
        search: "Search",
        delete: "Delete",
        toggleFlow: "Toggle Flow",
        openFlow: "Open Flow",
        hideFlow: "Hide Flow",
        openLink: "Open Link",
        addToSpace: "Pin File to...",
        addToSpaceShort: 'Pin',
        addTag: "Add Tag",
        saveTemplate: "Make into template",
        tag: "Tag",
        syncFields: "Sync Properties",
        convertTable: "Convert to Markdown",
        cutTable: "Cut Table",
        deleteTable: "Delete From Note",
        blink: "Blink",
        addFile: "Add File",
        merge: "Merge",
        saveView: "Save View",
        saveTable: "Save Table",
        renameView: "Rename View",
        deleteView: "Delete View",
        renameTable: "Rename Table",
        renameTag: "Rename Tag",
        createTag: "Create Tag",
        currentFolder: "Current Folder",
        sync: "Sync",
        pasteCSS: "Paste CSS",
        save: "Save",
        run: "Run",
        export: "Export",
        move: "Move",
        addView: "Add View",
        editPins: "Edit Pins",
        editJoins: "Edit Joins",
        editTables: "Edit Tables",
        editTemplates: "Edit Templates",
        runAction: "Run Action",
        openOverview: "Open Overview",
        editFormula: "Edit Formula",
        making: "Making...",
        addTime: "Add Time",
      },
      metadataTypes: {
        fileName: "File Name",
        contexts: "Contexts",
        isFolder: "Is Folder",
        path: "Path",
        folder: "Folder",
        sticker: "Sticker",
        color: "Color",
        created: "Created",
        lastModified: "Last Modified",
        extension: "Extension",
        size: "Size",
        tags: "Tags",
        inlinks: "Linked Mentions",
        outlinks: "Links",
        label: "Label",
        fileMetadata: "File Metadata",
        frontmatter: "Frontmatter",
      },
      filterTypes: {
        contains: "contains",
        notContains: "does not contain",
        is: "is",
        isNot: "is not",
        before: "before",
        after: "on or after",
        anyOf: "is any of",
        noneOf: "is none of",
        checked: "is checked",
        unchecked: "is unchecked",
        isNotEmpty: "is not empty",
        isEmpty: "is empty",
        dateBefore: 'is before',
        dateAfter: 'is after',
        isSameDate: 'is same day as',
        isSameDateAsToday: 'is today',
      },
      aggregateTypes: {
      },
      sortTypes: {
        alphaAsc: "A to Z",
        alphaDesc: "Z to A",
        earliest: "Earliest",
        latest: "Latest",
        checkAsc: "Checked → Unchecked",
        checkDesc: "Unchecked → Checked",
        itemsAsc: "Least Items",
        itemsDesc: "Most Items",
      },
      properties: {
        defaultField: "Name",
        aggregate: {
          label: "Aggregate",
          description: "Aggregate functions to calculate values",
        },
        propertyType: "Property Type",
        selectProperty: "Select Property",
        selectOrAddProperty: "Select or Add Property",
        flex: {
          label: "Flex",
          description: "Flexible field to display any type of data",
        },
        audio: {
          label: 'Audio',
          description: 'Audio'
        },
        text: {
          label: "Text",
          description: "Text field",
        },
        number: {
          label: "Number",
          description: "Number field with optional unit",
        },
        boolean: {
          label: "Yes/No",
          description: "Yes or No toggle to indicate the status",
        },
        date: {
          label: "Date",
          description: "Select a date from a calendar",
        },
        option: {
          label: "Option",
          description: "Select one or multiple option from a list",
        },
        file: {
          label: "File",
        },
        link: {
          label: "Link",
          description: "Link to another note or a website",
        },
        tags: {
          label: "Tags",
          description: "Use tags to quickly organize your items"
        },
        object: {
          label: "Object",
          description: "Store any complex objects"
        },
        context: {
          label: "Context",
          description: "Context property type"
        },
        image: {
          label: "Image",
          description: "Select any image from your system or from the internet",
        },
        color: {
          label: "Color",
          description: "Use colors to label your items or status"
        },
        space: {
          label: "Context",
          description: "Link to a context",
        },
        icon: {
          label: "Sticker",
          description: "Use stickers to uniquely label your items or status",
        },
        super: {
          label: "Super Property",
          links: "Open Link",
          properties: "Update Property",
          api: "API",
          obsidianCommands: "Run Command",
          runCommand: "Run Command",
          performAction: "Perform Action",
          whenClicked: "When Clicked",
        },
        fileProperty: {
          name: "Name",
          label: "Formula",
          createdTime: "Created",
          modifiedTime: "Last Edited",
          sticker: "Sticker",
          links: "Links",
          tags: "Tags",
          spaces: "Spaces",
          extension: "Extension",
          size: "Size",
          preview: "Note Preview",
          parentFolder: "Folder",
          description: "Use a formula to dynamically display a property"
        },
      },
      views: {
        navigator: "Navigator",
        explorer: "Explorer",
        space: "Space",
      },
      
      labels: {
        all: "All",
        duplicateTable: "Duplicate Table",
        aggregateBy: "Aggregate By",
        pinned: "Pinned",
        joined: "Joined",
        moveTable: "Move Table",
        editFormula: "Edit Formula",
        editObject: "Edit Object",
        properties: "Properties",
        newAction: "Action",
        newTable: "New Table",
        template: "New Template",
        createFolder: "New Folder Name",
        rename: "Rename",
        createNew: "New",
        default: "Default",
        style: "Style",
        done: "Done",
        reposition: "Reposition",
        tables: "Tables",
        selectDateFormat: "Select/Type Date Format",
        renameSection: "Edit Space",
        createSection: "New Folder",
        createNote: "New Note",
        contextMaker: "Context Maker",
        select: "Select",
        pinnedItems: "Pinned Items",
        makeAStaticWebVersion: "Make a static web version of",
        withNavigator: "With Navigator",
        withoutNavigator: "Without Navigator",
        thisSpace: "This Space",
        creating: "Creating...",
        making: "Making...",
        collapse: "Collapse",
        expand: "Expand",
        view: "View",
        findStickers: "Find Sticker",
        mergeProperties: "Merge Properties",
        placeholder: "Type '${1}' for commands",
        tagSpaces: "Tag Spaces",
        vault: "Vault",
        files: "Files",
        tags: "Tags",
        joinItemsFrom: "Join items from",
        notIncludingSubfolders: "Not including subfolders",
        includingSubfolders: "Including subfolders",
        createNewItemsUsing: "Create new items using",
        withName: "with name",
        createTemplate: "Create Template",
        editTemplate: "Edit Template",
        templateName: "Template Name",
        noTemplatesFound: "No templates found",
        createFirstTemplate: "Create your first global template",
        syncWarnings: "The following issues may affect the synchronization of your files. Please review and resolve them.",
        noWarnings: "No warnings",
        resolve: "Resolve",
        ignore: "Ignore",
        editParameters: "Edit Parameters",
        loadingTemplates: "Loading templates...",
        notePlaceholder: 'New Note for ${1}',
        itemsSelected: "${1} Selected",
        selectNote: "Select Note",
        selectIcon: "Select Sticker",
        selectImage: "Select Image",
        selectSpace: "Select Space",
        styleSmall: "Small",
        styleMedium: "Medium",
        styleLarge: "Large",
        hiddenFilePattern: 'Name, Suffixes and Extension',
        hiddenFileSpecific: 'Exclude specific files and folders',
        textPlaceholder: "Enter Text",
        noFile: "File does not exist yet. Click to create.",
        navigatorSearchPlaceholder: 'Search by Text or Filters',
        blinkPlaceholder:
          "Search for notes, spaces...",
        searchPlaceholder: "Type to search...",
        contextItemSelectPlaceholder: "Find Item",
        linkItemSelectPlaceholder: "Find or Create Note",
        pinNotePlaceholder: "Select a Note or Space to Pin",
        optionItemSelectPlaceholder: "Select Option",
        viewItemSelectPlaceholder: "Select View",
        tagItemSelectPlaceholder: "Find Tag",
        spaceSelectPlaceholder: "Select any Folder or Tag",
        propertyItemSelectPlaceholder: "Select Property",
        sortItemSelectPlaceholder: "Select Sort",
        filterItemSelectPlaceholder: "Select Filter",
        imageSelectPlaceholder: "Select an image or paste a URL",
        imageNotFoundPlaceholder: "No Images Found",
        pastePaletteJSON: "Paste your palette JSON here...",
        newPaletteName: "New palette name...",
        syncFrontmatterProperty: "Sync Frontmatter Property",
        newProperty: "New Property",
        newPropertyShort: "New Property",
        propertyType: "Type",
        propertyDynamic: "Dynamic",
        propertyValueSpace: "Space",
        propertyValueReference: "Related Property",
        propertyValueAggregate: "Aggregate Property",
        propertyValueLinked: "Linked Property",
        propertyValueLinkedPlaceholder: "Add/Select Property",
        propertyValueProperty: "Property",
        propertyLookup: "Edit Formula",
        existingFrontmatter: "Existing Property",
        dateFormat: "Date Format",
        numberFormat: "Number Format",
        editOptions: "Edit Options",
        checkedSticker: "Checked",
        uncheckedSticker: "Unchecked",
        indeterminateSticker: "Unset",
        propertyFileProp: "Property",
        multiple: "Multiple",
        filesCount: "{$1} Files",
        hiddenFiles: "Hidden Files",
        colors: "Colors",
        stickers: "Stickers",
        globalTemplates: "Global Templates",
        onboarding: "Onboarding",
        loadingPalettes: "Loading palettes...",
        loadingStickerSets: "Loading sticker sets...",
        manageHiddenFiles: "Manage Hidden Files",
        stickerSets: "Sticker Sets",
        addStickerSet: "Add Sticker Set",
        iconLibrary: "Icon library",
        emojiLibrary: "Emoji library",
        iconCount: "${1} icons",
        builtin: "Built-in",
        custom: "Custom",
        manageStickerSets: "Manage sticker sets available in your vault. Add custom sticker sets from folders containing SVG or image files.",
        showingFirst: "Showing first ${1} of ${2} icons",
        iconsIn: "Icons in ${1}",
        dropIconsHere: "Drop icons here to create a new icon set",
        dropPalettesHere: "Drop JSON palette files here to import",
        dropLanguagePackHere: "Drop JSON language pack here to import",
        dragDropCommunityPacks: "Drag and drop packs from the community here to import",
        dropIconPackHere: "Drop icon pack here to import",
        importIconPacksFromCommunity: "Import icon packs downloaded from the community",
        dropColorPaletteHere: "Drop color palette here to import",
        importPalettesFromCommunity: "Import palettes downloaded from the community",
        dropLanguagePackHereTitle: "Drop language pack here to import",
        importLanguagePacksFromCommunity: "Import language packs downloaded from the community",
        findDownloadIconPacks: "Find and download icon packs from the community at",
        findDownloadColorPalettes: "Find and download color palettes from the community at",
        findDownloadLanguagePacks: "Find and download language packs from the community at",
        systemName: "System Name",
        manageGlobalTemplates: "Manage Global Templates",
        addExtension: "Add Rule",
        saveView: "Save View",
        saveTable: "Save Table",
        renameView: "Rename View",
        renameTable: "Rename Table",
        syncMetadata: "Sync Metadata",
        syncProperties: "Sync Properties",
        selectContext: "Select Context",
        metadata: "Metadata",
        backlinks: "Backlinks",
        spaces: "Spaces",
        contexts: "Contexts",
        content: "Content",
        deleteSpace: "Delete Space",
        deleteFiles: "Delete Files",
        outgoingLinks: "Outgoing Links",
        moveTo: 'Move to',
        addTo: 'Pin to',
        copyTo: 'Copy to',
        reorderIn: 'Reorder in',
        border: "Border",
        corners: "Corners",
        color: "Color",
        backgroundColor: "Background",
        cornerRadius: "Radius",
        onClick: "On Click",
        layout: "Layout",
        element: "Element",
        name: "Name",
        display: "Display",
        alignment: "Alignment",
        margin: "Margin",
        padding: "Padding",
        gap: "Gap",
        width: "Width",
        height: "Height",
        opacity: "Opacity",
        shadow: "Shadow",
        shadowBlur: "Blur",
        shadowSpread: "Spread",
        typography: "Typography",
        layers: "Layers",
        fontSize: "Size",
        props: "Props",
        styles: "Styles",
        events: "Events",
        code: "Code",
        selectedLayers: "${1} Layers",
        actions: "Actions",
        script: "Script",
        formula: "Formula",
        namePlaceholder: "Name",
        replace: "Replace",
        insert: "Insert",
        saveFormula: "Save Formula",
        selectSticker: "Select Sticker",
        customize: "Customize",
        items: "Items",
        pins: "Pins",
        joins: "Joins",
        textStyle: "Text Style",
        ungroup: "Ungroup",
        duplicate: "Duplicate",
        delete: "Delete",
        templates: "Templates",
        noNotesInside: "No Notes Inside",
        list: "List",
        none: "None",
        language: "Language",
        allDay: "All Day",
        auto: "auto",
        addKit: "Add Kit",
        kitLocation: "Kit Location",
        addKitToSpace: "Add Kit to Space",
        addingKit: "Adding Kit",
        editPins: "Edit Pins",
        editJoins: "Edit Joins",
        editTables: "Edit Tables",
        editTemplates: "Edit Templates",
        exportToHTML: "Export to HTML",
        applyToItems: "Apply to Items",
        resetView: "Reset View",
        resetViewDesc: "Reset the view to the default settings",
        openASpace: "Open a Space",
        openASpaceDesc: "Open existing folders and tags as a Space or create a new one",
        addStep: "Add Step",
        addView: "Add View",
        applyTags: "Apply Tags",
        setDefaultSticker: "Set Default Sticker",
        editFocus: "Edit Focus",
        close: "Close",
        runAction: "Run Action",
        deleteAction: "Delete Action",
        createVisualization: "Create Visualization",
        newVisualization: "New Visualization",
        deleteSpaceFiles: "Delete Space Files",
        noOptionsFound: "No options found",
        openTable: "Open Table",
        selectProperty: "Select Property",
        selectOrAddProperty: "Select or Add Property",
        newEvent: "New Event",
        toggle: "Toggle",
        newNote: "New Note",
        newSpace: "New Space",
        newTag: "New Tag",
        new: "New",
        setAsDefault: "Set as Default",
        thisSpaceAndAllSubfolders: "This Space and All Subfolders",
        yes: "Yes",
        manageTemplates: "Manage Templates",
        changeCoverShort: "Change Cover",
        visualization: {
          editText: "Edit Text",
          alignment: "Alignment",
          left: "Left",
          center: "Center",
          right: "Right",
          tickColor: "Tick Color",
          editLabel: "Edit Label",
          position: "Position",
          top: "Top",
          bottom: "Bottom",
          gridColor: "Grid Color",
          none: "None",
          barChart: "Bar Chart",
          lineChart: "Line Chart",
          scatterPlot: "Scatter Plot",
          pieChart: "Pie Chart",
          areaChart: "Area Chart",
          radarChart: "Radar Chart",
          selectDataSourceFirst: "Select a data source first",
          default: "Default",
          loadingVisualization: "Loading visualization...",
          loadingData: "Loading data...",
          failedToLoad: "Failed to load visualization configuration",
          frameId: "Frame ID",
          path: "Path",
          configurationNotLoaded: "Configuration not loaded",
          configureYourVisualization: "Setup Chart",
          selectData: "Select Data",
          selectChart: "Select Chart",
        },
        blink: {
          items: "Items",
          recent: "Recent",
          createNew: "Create New",
          newNote: "New Note",
          newSpace: "New Space",
          results: "Results",
        },
        menu: {
          applyTags: "Apply Tags",
          setDefaultSticker: "Set Default Sticker",
        },
      },
      descriptions: {
        spaceActions: "Create actions that run when you press a button",
        spaceLists: "Create lists to track data and organize them in your space",
        spaceItems: "Add new items to the space or pin items to the space",
        spaceTemplates: "Create templates to quickly add items to your space",
        smartSearch: "Automatically pin notes to this space based on a set of searches",
        deleteSpace: "Deleting the space will also delete the folder and its contents.",
        deleteFiles: "Delete ${1} files/folders and their contents?",
        addContext: "Contexts lets you connect properties from your tags",
        spaceProperties: 'Define Properties for your Space Items',
        syncMetadata:
          "Select which fields from your notes to start syncing with the context.",
        syncProperties:
          "Contexts defines and syncs the same fields across your notes depending on their folder or tag.",
        selectContext:
          "Select which folder or tag context you want to sync the fields.",
        templateNameFormula: "Template Name Formula",
        hiddenFileOptions: "Hidden File Options",
        toggleReadMode: "Toggle Read Mode",
        toggleFullWidth: "Toggle Full Width",
      },
      flowView: {
        emptyDoc: "Empty Document",
        itemsCount: " Items",
        emptyFolder: "This Folder is Empty",
      },
      notice: {
        duplicateFile: "Folder already contains note with same name",
        fileExists: "File Already Exists",
        folderExists: "Folder Already Exists",
        templateSaved: "Template saved to space: ",
        tableDeleted: "Table removed from Note. You can find the table in the folder Space",
        copyError: "Copy Error",
        reload: "Reload",
        kitDoesntExist: "Kit doesn't exist",
        kitAdded: "Kit added",
        exportedToHTML: "Successfully exported to HTML",
        noOptionsFound: "No options found",
        alreadyInKit: "Already in Kit",
        error: "Error: ",
        invalidKitURL: "Invalid Kit URL",
        cantConvertNoteToSpace: "Can't Convert Note to Space",
        newSpaceName: "New Space Name",
        duplicateSpaceName: "Duplicate Space Name",
        noPropertyName: "No Property Name",
        duplicatePropertyName: "Duplicate Property Name",
        noPropertiesFound: "No Properties Found",
        somethingWentWrong: "Something Went Wrong"
      },
      settings: {
        title: "Settings",
        tooltips: {
          deletePalette: "Delete palette",
          resetToDefault: "Reset to default",
          removeColor: "Remove color",
          addColor: "Add color",
          deleteStickerSet: "Delete sticker set",
          addGradientStop: "Add gradient stop",
          stopPosition: "Stop position (%)",
          removeGradientStop: "Remove selected gradient stop",
          importPalette: "Import palette from JSON",
          exportPalette: "Export palette to JSON",
          invalidPaletteFormat: "Invalid palette file format. Must have 'name' and 'colors' array.",
          invalidJSON: "Invalid JSON format",
        },
        ariaLabels: {
          noColorApplied: "This element will have no color applied.",
          closeOnboarding: "Close onboarding",
          dataSource: "Data Source",
          chartType: "Chart Type",
          legendConfiguration: "Legend Configuration",
          colorConfiguration: "Color Configuration",
          close: "Close",
          toggleXAxis: "Toggle X Axis",
          toggleXAxisLabel: "Toggle X Axis Label",
          toggleXGridlines: "Toggle X Gridlines",
          toggleXAxisLine: "Toggle X Axis Line",
          toggleStackedMode: "Toggle Stacked Mode",
          toggleYAxis: "Toggle Y Axis",
          toggleYAxisLabel: "Toggle Y Axis Label",
          toggleDataLabels: "Toggle Data Labels",
          toggleYGridlines: "Toggle Y Gridlines",
          toggleYAxisLine: "Toggle Y Axis Line",
          toggleLegend: "Toggle Legend",
          legendPosition: "Legend Position",
          legendAlignment: "Legend Alignment",
          toggleLineSmoothing: "Toggle Line Smoothing",
          toggleStroke: "Toggle Stroke",
          toggleDataPoints: "Toggle Data Points",
          toggleDonutChart: "Toggle Donut Chart",
        },
        onboarding: {
          welcome: "Welcome to Make.md",
          welcomeDesc: "Welcome to Make.md! Let's configure your essential settings to get you started.",
          walkthrough: "We'll walk through the most important options to customize your experience.",
          coreFeatures: "Core Features",
          enableNavigator: "Enable Navigator (sidebar file browser)",
          enableNavigatorDesc: "Show the enhanced file navigator in the sidebar",
          enableSpaceViews: "Enable Space Views",
          enableSpaceViewsDesc: "Create custom views and organize content in spaces",
          enableContexts: "Enable Contexts & Properties",
          enableContextsDesc: "Add structured data and metadata to your notes",
          interfacePreferences: "Interface Preferences",
          showBanners: "Show Note Banners",
          showBannersDesc: "Display banner images at the top of notes",
          showFileIcons: "Show File Icons",
          showFileIconsDesc: "Display custom icons next to files and folders",
          systemName: "System Name",
          systemNameDesc: "Customize the name of your workspace",
          previous: "Previous",
          next: "Next",
          skipTour: "Skip Tour",
          getStarted: "Get Started",
        },
        categories: {
          core: "Core",
          appearance: "Appearance",
          system: "System",
        },
        sections: {
          general: "General",
          navigator: "Navigator",
          appearance: "Appearance",
          coverImage: "Cover Image",
          interaction: 'Preferences',
          context: "Context",
          label: "Labels",
          tags: "Tags",
          space: "Spaces",
          performance: "Performance",
          advanced: "Advanced",
          folderNote: "Folder Note",
          notes: "Notes",
          assets: "Assets",
          language: "Language",
        },
        
        cacheIndex: {
          name: "Cache Search Index",
          desc: "Cache the index for faster search results",
        },
        layoutVertical: "Vertical",
        layoutHorizontal: "Horizontal",
        sectionGeneral: "General",
        sectionSidebar: "Spaces",
        sectionEditor: "Maker Mode",
        sectionFlow: "Flow",
        sectionAdvanced: "Advanced",
        sectionDataview: "Dataview",
        sectionContext: "Context",
        sectionStickers: "Labels",
        sectionNavigator: "Navigator",
        sectionDefault: "Default Spaces",
        sectionSpaceView: "Space View",
        sectionBlink: "Blink",
        sectionInlineContext: "Inline Context",
        sectionFlowBlock: "Flow Block",
        sectionFlowMenu: "Flow Menu",
        sectionFlowStyler: "Flow Styler",
        experimental: {
          name: "Experimental",
          desc:"Experimental features that are subject to change and may not be optimized for performance",
        },
        noteThumbnails: {
          name: "Note Thumbnails",
          desc: "Create thumbnails for notes"
        },
        imageThumbnails: {
          name: "Image Thumbnails",
          desc: "Create thumbnails for images to speed up performance"
        },
        hiddenExtensions: {
          name: "Hidden Extensions",
          desc: "File extensions and names to hide from the navigator"
        },
        minimalThemeFix: {
          name: "Minimal Theme Fix",
          description: "Apply fixes for the popular theme Minimal"
        },
        inlineStickerMenu: {
          name: "Inline Stickers",
          desc: "Add inline stickers by typing :",
        },
        openSpacesOnLaunch: {
          name: "Open Navigator as Default Tab",
          desc: "Open the Navigator tab when Obsidian launches",
        },
        overrideNativeMenu: {
          name: "Use Obsidian Context Menu",
          desc: "Show the Obsidian context menu instead of Make.md",
        },
        editStickerInSidebar: {
          name: "Edit Stickers in Sidebar",
          desc: "Edit stickers directly in the sidebar",
        },
        notesPreview: {
          name: "Notes Preview",
          desc: "Show a preview of notes, may cause performance issues",
        },
        spacesRightSplit: {
          name: "Navigator on Right Side",
          desc: "Open the Navigator in the right panel",
        },
        defaultSpaceTemplate: {
          name: "Default Space Template",
          desc: "Select the default template for new spaces",
        },
        datePickerTime: {
          name: "Date Picker Time",
          desc: "Select time by default in the date picker",
        },
        defaultDateFormat: {
          name: "Default Date Format",
          desc: "Set the default date format, example: yyyy-MM-dd (see https://date-fns.org/v2.30.0/docs/format)",
        },
        defaultTimeFormat: {
          name: "Default Time Format",
          desc: "Set the default time format, example: h:mm a (see https://date-fns.org/v2.30.0/docs/format)",
        },
        autoAddContextsToSubtags: {
          name: "Apply Properties to Subtags",
          desc: "Automatically apply context properties to subtags",
        },
        newNotePlaceholder: {
          name: "New Note Placeholder",
          desc: "Default name for new notes, applies to the Navigator buttons and the New Note command",
        },
        folderIndentationLines: {
          name: "Show Folder Indentation Lines",
          desc: "Turn on to show a line on the left of folders to indicate indentation",
        },
        folderNoteLocation: {
          name: "Folder Note Location Inside Folder",
          desc: "Turn on to have folder notes inside the folder, turn off to have it outside",
        },
        folderViewDefault: {
          name: "Show Folder Note by Default",
          desc: "Show the folder note by default when opening a folder",
        },
        internalLinkFlowEditor: {
          name: "Show Toggles to Open Flow Editor on Links",
          desc: "Turn on to toggle Flow Blocks directly in inline links",
        },
        internalLinkSticker: {
          name: "Show Stickers on Links",
          desc: "Turn on to toggle stickers shown directly by beside internal links",
        },
        saveAllContextToFrontmatter: {
          name: "Sync Context Fields to Frontmatter",
          desc: "Turn on to automatically save all context fields to Frontmatter fields, not just existing Frontmatter fields.",
        },
        syncFormulaToFrontmatter: {
          name: "Sync Formula Fields to Frontmatter",
          desc: "Turn on to save calculated formula values to Frontmatter fields.",
        },
        spaceSubFolder: {
          name: "Space Folder Name",
          desc: "Name of the folder for spaces",
        },
        basics: {
          name: "Make.md Basics",
          desc: "Enable features from Make.md Basics including styler and flow blocks",
        },
        spacesFolder: {
          name: "Tag Space Folder",
          desc: "Name of the folder for tag spaces",
        },
        
        
        inlineContext: {
          name: "Notes Header",
          desc: "Show a header to display labels and properties",
        },
        banners: {
          name: "Cover Image",
          desc: "Show a cover image for notes and spaces",
        },
        inlineContextProperties: {
          name: "Show Context Properties in Header",
          desc: "Show the properties in the header for notes and spaces",
        },
        inlineContextExpanded: {
          name: "Auto Expand Context Properties",
          desc: "Expand the inline context sections when opening a note",
        },
        inlineContextNameLayout: {
          name: "Title and Sticker Layout",
          desc: "Layout for inline title and sticker in Inline Context",
        },
        hideFrontmatter: {
          name: "Hide Context Properties",
          desc: "Hide properties you have added in context from the Obsidian properties panel",
        },
        autoOpenFileContext: {
          name: "Auto Open Explorer",
          desc: "Automatically open explorer panel in the right panel",
        },
        enableFolderNote: {
          name: "Enable Folder Note",
          desc: "Access the folder note in the folder page and hide the folder note from spaces",
        },
        folderNoteName: {
          name: "Folder Note Name",
          desc: "Name of the folder note, keep blank to use the same name as the folder",
        },
        expandFolderOnClick: {
          name: "Auto Expand Folder",
          desc: "Auto expand folders on click",
        },
        filePreviewOnHover: {
          name: "Preview on Hover",
          desc: "Preview on Hover while holding Control/Command key",
        },
        revealActiveFile: {
          name: "Reveal Active File",
          desc: "Automatically reveal the active file in Navigator",
        },
        
        
        contextEnabled: {
          name: "Contexts",
          desc: `Contexts allows you to have full control over the metadata of your files`,
        },
        navigatorEnabled: {
          name: "Navigator",
          desc: `The navigator lets you create and organize your spaces`,
        },
        spacesStickers: {
          name: "Stickers",
          desc: `Use Emojis to make it easier to find your notes`,
        },
        spacesUseAlias: {
          name: "Alias",
          desc: `Use the alias metadata to show in Navigator`,
        },
        spacesDisablePatch: {
          name: "Compatibility Mode",
          desc: "This will improve the compatibility of plugins while using the Navigator, however will turn off linking to spaces from breadcrumbs",
        },
        deleteFileOption: {
          name: "Delete File Option",
          desc: "Select how you want files to be deleted",
        },
        spacesDeleteOptions: {
          permanent: "Delete Permanently",
          trash: "Move to Obsidian Trash",
          "system-trash": "Move to System Trash",
        },
        flowState: {
          name: "Flow State",
          desc: "Toggle the flow state",
        },
        showRibbon: {
          name: "App Ribbon",
          desc: `Show/hide the left menu aka. ribbon`,
        },
        vaultSelector: {
          name: "Vault Selector",
          desc: `Show/hide the vault selector at the bottom`,
        },
        spaceViewEnabled: {
          name: "Spaces",
          desc: `Customize your folders and tags with properties and views`,
        },
        defaultSpaces: {
          name: "Default Spaces",
          desc: `Recommended Spaces for quickly organizing your vault`,
        },
        homeSpace: {
          name: "Home Space",
          desc: `An easy-to-access space where you can add/organize your other spaces`,
        },
        enableDefaultSpaces: {
          name: "Tag Spaces",
          desc: `Automatically create spaces for each of your tags`,
        },
        readableLineWidth: {
          name: "Readable Line Width",
          desc: `Use Readable Line Width`,
        },
        sidebarTabs: {
          name: "Sidebar Tabs",
          desc: `Show/hide other sidebar tabs`,
        },
        spacesPerformance: {
          name: "Navigator Scroll Performance",
          desc: `Turn on performance mode for Navigator, may affect scrolling appearance. Requires Restart`,
        },
        indexSVG: {
          name: "Use SVGs as Stickers",
          desc: `Use any svg file in your vault as a sticker`,
        },
        language: {
          name: "Customize Interface Language",
          desc: "Modify any text in the interface. Changes require a reload to take effect.",
          loadingSettings: "Loading language settings...",
          exportJSON: "Export JSON",
          importJSON: "Import JSON",
          importJSONDesc: "Paste your language JSON here. Only modified values will be imported.",
          pasteJSONPlaceholder: "Paste your JSON here...",
          import: "Import",
          cancel: "Cancel",
          copied: "Copied!",
          resetAll: "Reset All",
          search: "Search",
          searchDesc: "Search by key or text value",
          showingCount: "Showing {{filtered}} of {{total}} strings",
          original: "Original",
          invalidJSON: "Invalid JSON format. Please check your input.",
        },
        inlineStyler: {
          name: "Flow Styler",
          desc: `Select text to add styling`,
        },
        inlineStylerColor: {
          name: "Text and Highlight Colors 🧪",
          desc: `Select text color and highlight color, (this may change in the future because of the limitations with HTML and Obsidian)`,
        },
        
        spaceRowHeight: {
          name: "Row Height",
          desc: "The height for each row in navigator (in pixels), default is 29",
        },

        mobileSpaceRowHeight: {
          name: "Row Height - Mobile",
          desc: "The height for each row in navigator for mobile (in pixels), default is 40",
        },

        contextPagination: {
          name: "Table View Pagination",
          desc: "Number of items per page in table view",
        },
        bannerHeight: {
          name: "Cover Height",
          desc: "The height for the cover of the note or space, default is 200",
        },
        
        makeChar: {
          name: "Flow Menu Trigger",
          desc: "Character to open the Flow Menu",
        },
        mobileMakeBar: {
          name: "Flow Styler (Mobile)",
          desc: "Replaces the mobile toolbar",
        },
        editorMarkSans: {
          name: "Mark Sans 🧪",
          desc: `Use the editor without Markdown.`,
        },
        
        editorMakePlaceholder: {
          name: "Flow Menu Hint Text",
          desc: `Show a hint text on how to open the Flow Menu Shortcut`,
        },
        blinkEnabled: {
          name: "Blink",
          desc: `A faster way to search and edit your notes`,
        },
        editorMakeMenu: {
          name: "Flow Menu",
          desc: `Open the Flow menu to quickly add content`,
        },
        editorMakeMenuTrigger: {
          name: "Flow Menu Shortcut",
          desc: `Trigger key to use flow menu`,
        },
        editorFlowReplace: {
          name: "Flow Block",
          desc: `Open your internal links or toggle your embeds in the flow block.`,
        },
        editorFlowStyle: {
          name: "Flow Block Style",
          desc: "Select a theme for your flow block",
          seamless: "Seamless",
          minimal: "Minimal",
        },
      },
      calendar: {
        frequency: {
          yearly: "Yearly",
          monthly: "Monthly",
          weekly: "Weekly",
          daily: "Daily"
        }
      },
      formulas: {
        prop: {
          description: "Get the value of a property",
          paramLabel: "Property"
        },
        substring: {
          description: "Get a part of a text"
        },
        if: {
          description: "If condition is true return the first argument else return the second"
        },
        types: {
          string: "String"
        }
      }
    }
    };
  }

  public getStrings() {
    // Apply overrides on top of default strings
    const applyOverrides = (base: any, overrides: Record<string, any>): any => {
      const result = { ...base };
      
      for (const [key, value] of Object.entries(overrides)) {
        const keys = key.split('.');
        let current = result;
        
        for (let i = 0; i < keys.length - 1; i++) {
          if (!current[keys[i]]) {
            current[keys[i]] = {};
          }
          current = current[keys[i]];
        }
        
        current[keys[keys.length - 1]] = value;
      }
      
      return result;
    };
    
    return applyOverrides(this.strings.en, this.overrides);
  }

  public loadCustomStrings(customStrings: Record<string, any>): void {
    this.overrides = customStrings;
  }

  public setOverridesFromFile(overrides: Record<string, any>): void {
    this.overrides = overrides || {};
  }
}

const i18nLoader = new I18nLoader();

export { i18nLoader };

// Create a proxy that always returns the current strings
const i18nProxy = new Proxy({}, {
  get(_target, prop, receiver) {
    return Reflect.get(i18nLoader.getStrings(), prop, receiver);
  },
  ownKeys(_target) {
    return Reflect.ownKeys(i18nLoader.getStrings());
  },
  getOwnPropertyDescriptor(_target, prop) {
    return Reflect.getOwnPropertyDescriptor(i18nLoader.getStrings(), prop);
  }
});

// Type definition for i18n strings
type I18nStrings = {
  hintText: Record<string, string>;
  defaults: Record<string, string>;
  commands: Record<string, string>;
  styles: Record<string, string>;
  commandsSuggest: Record<string, string>;
  commandPalette: Record<string, string>;
  frames: {
    sections: Record<string, string>;
    label: Record<string, string>;
    note: Record<string, string>;
    table: Record<string, string>;
    context: Record<string, string>;
    calendar: Record<string, string>;
    field: Record<string, string>;
    event: Record<string, string>;
    divider: Record<string, string>;
    button: Record<string, string>;
    callout: Record<string, string>;
    toggle: Record<string, string>;
  };
  menu: {
    // Chart types
    barChart: string;
    lineChart: string;
    scatterPlot: string;
    pieChart: string;
    areaChart: string;
    radarChart: string;
    
    // Data configuration
    space: string;
    list: string;
    category: string;
    values: string;
    xAxisField: string;
    yAxisFields: string;
    selectDataSource: string;
    selectSpace: string;
    selectCategoryField: string;
    selectXAxisField: string;
    selectValueFields: string;
    selectYAxisFields: string;
    
    // Legend
    legend: string;
    hidden: string;
    hideLegend: string;
    showLegend: string;
    legendPosition: string;
    orientation: string;
    horizontal: string;
    vertical: string;
    legendTop: string;
    legendBottom: string;
    legendLeft: string;
    legendRight: string;
    
    // Color
    colorPalette: string;
    defaultPalette: string;
    
    // Labels
    axisLabels: string;
    
    // Aggregation
    groupBy: string;
    aggregate: string;
    count: string;
    sum: string;
    average: string;
    min: string;
    max: string;
    distinct: string;
    
    // Other existing properties
    [key: string]: string;
  };
  editor: Record<string, string>;
  buttons: Record<string, string>;
  metadataTypes: Record<string, string>;
  filterTypes: Record<string, string>;
  aggregateTypes: Record<string, string>;
  sortTypes: Record<string, string>;
  properties: Record<string, any>;
  views: Record<string, string>;
  labels: {
    visualization?: {
      loadingVisualization: string;
      failedToLoad: string;
      frameId: string;
      none: string;
      path: string;
      loadingData: string;
      configurationNotLoaded: string;
      configureYourVisualization: string;
      selectDataSource: string;
    };
    [key: string]: any;
  };
  descriptions: Record<string, string>;
  flowView: Record<string, string>;
  notice: Record<string, string>;
  settings: Record<string, any>;
  calendar?: {
    frequency?: Record<string, string>;
  };
  formulas?: {
    prop?: {
      description: string;
      paramLabel: string;
    };
    substring?: {
      description: string;
    };
    if?: {
      description: string;
    };
    types?: Record<string, string>;
  };
};

export default i18nProxy as I18nStrings;
