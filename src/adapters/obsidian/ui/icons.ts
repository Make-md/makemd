import { getIcon } from "obsidian";

export const lucideIcon = (value: string) => getIcon(value)?.outerHTML;




export const mkLogo = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" fill="currentColor" viewBox="0 0 100 100">
<path d="m51.39 53.148 36.687-38.355v73.284H11.923V14.793L48.61 53.148 50 54.6l1.39-1.453Z"/>
</svg>
`;


/**
 * Some UI Icons based on
 * Hero Icons
 * https://github.com/tailwindlabs/heroicons
 * tailwindlabs
 **/

export const lucideIcons = [
  "accessibility",
  "activity",
  "air-vent",
  "airplay",
  "alarm-check",
  "alarm-clock-off",
  "alarm-clock",
  "alarm-minus",
  "alarm-plus",
  "album",
  "alert-circle",
  "alert-octagon",
  "alert-triangle",
  "align-center-horizontal",
  "align-center-vertical",
  "align-center",
  "align-end-horizontal",
  "align-end-vertical",
  "align-horizontal-distribute-center",
  "align-horizontal-distribute-end",
  "align-horizontal-distribute-start",
  "align-horizontal-justify-center",
  "align-horizontal-justify-end",
  "align-horizontal-justify-start",
  "align-horizontal-space-around",
  "align-horizontal-space-between",
  "align-justify",
  "align-left",
  "align-right",
  "align-start-horizontal",
  "align-start-vertical",
  "align-vertical-distribute-center",
  "align-vertical-distribute-end",
  "align-vertical-distribute-start",
  "align-vertical-justify-center",
  "align-vertical-justify-end",
  "align-vertical-justify-start",
  "align-vertical-space-around",
  "align-vertical-space-between",
  "anchor",
  "angry",
  "annoyed",
  "aperture",
  "apple",
  "archive-restore",
  "archive",
  "armchair",
  "arrow-big-down",
  "arrow-big-left",
  "arrow-big-right",
  "arrow-big-up",
  "arrow-down-circle",
  "arrow-down-left-from-circle",
  "arrow-down-left",
  "arrow-down-right-from-circle",
  "arrow-down-right",
  "arrow-down",
  "arrow-left-circle",
  "arrow-left-right",
  "arrow-left",
  "arrow-right-circle",
  "arrow-right",
  "arrow-up-circle",
  "arrow-up-down",
  "arrow-up-left-from-circle",
  "arrow-up-left",
  "arrow-up-right-from-circle",
  "arrow-up-right",
  "arrow-up",
  "asterisk",
  "at-sign",
  "atom",
  "award",
  "axe",
  "axis-3d",
  "baby",
  "backpack",
  "baggage-claim",
  "ban",
  "banana",
  "banknote",
  "bar-chart-2",
  "bar-chart-3",
  "bar-chart-4",
  "bar-chart-horizontal",
  "bar-chart",
  "baseline",
  "bath",
  "battery-charging",
  "battery-full",
  "battery-low",
  "battery-medium",
  "battery-warning",
  "battery",
  "beaker",
  "bean-off",
  "bean",
  "bed-double",
  "bed-single",
  "bed",
  "beef",
  "beer",
  "bell-minus",
  "bell-off",
  "bell-plus",
  "bell-ring",
  "bell",
  "bike",
  "binary",
  "bird",
  "bitcoin",
  "blinds",
  "bluetooth-connected",
  "bluetooth-off",
  "bluetooth-searching",
  "bluetooth",
  "bold",
  "bomb",
  "bone",
  "book-copy",
  "book-down",
  "book-key",
  "book-lock",
  "book-marked",
  "book-minus",
  "book-open-check",
  "book-open",
  "book-plus",
  "book-template",
  "book-up",
  "book-x",
  "book",
  "bookmark-minus",
  "bookmark-plus",
  "bookmark",
  "bot",
  "box-select",
  "box",
  "boxes",
  "brain-circuit",
  "brain-cog",
  "brain",
  "briefcase",
  "brush",
  "bug",
  "building-2",
  "building",
  "bus",
  "cake",
  "calculator",
  "calendar-check-2",
  "calendar-check",
  "calendar-clock",
  "calendar-days",
  "calendar-heart",
  "calendar-minus",
  "calendar-off",
  "calendar-plus",
  "calendar-range",
  "calendar-search",
  "calendar-x2",
  "calendar-x",
  "calendar",
  "camera-off",
  "camera",
  "candy-off",
  "candy",
  "car",
  "carrot",
  "case-lower",
  "case-sensitive",
  "case-upper",
  "cast",
  "castle",
  "cat",
  "check-check",
  "check-circle-2",
  "check-circle",
  "check-square",
  "check",
  "chef-hat",
  "cherry",
  "chevron-down-square",
  "chevron-down",
  "chevron-first",
  "chevron-last",
  "chevron-left-square",
  "chevron-left",
  "chevron-right-square",
  "chevron-right",
  "chevron-up-square",
  "chevron-up",
  "chevrons-down-up",
  "chevrons-down",
  "chevrons-left-right",
  "chevrons-left",
  "chevrons-right-left",
  "chevrons-right",
  "chevrons-up-down",
  "chevrons-up",
  "chrome",
  "church",
  "cigarette-off",
  "cigarette",
  "circle-dot",
  "circle-ellipsis",
  "circle-equal",
  "circle-off",
  "circle-slash-2",
  "circle-slash",
  "circle",
  "circuit-board",
  "citrus",
  "clapperboard",
  "clipboard-check",
  "clipboard-copy",
  "clipboard-edit",
  "clipboard-list",
  "clipboard-paste",
  "clipboard-signature",
  "clipboard-type",
  "clipboard-x",
  "clipboard",
  "clock-1",
  "clock-10",
  "clock-11",
  "clock-12",
  "clock-2",
  "clock-3",
  "clock-4",
  "clock-5",
  "clock-6",
  "clock-7",
  "clock-8",
  "clock-9",
  "clock",
  "cloud-cog",
  "cloud-drizzle",
  "cloud-fog",
  "cloud-hail",
  "cloud-lightning",
  "cloud-moon-rain",
  "cloud-moon",
  "cloud-off",
  "cloud-rain-wind",
  "cloud-rain",
  "cloud-snow",
  "cloud-sun-rain",
  "cloud-sun",
  "cloud",
  "cloudy",
  "clover",
  "code-2",
  "code",
  "codepen",
  "codesandbox",
  "coffee",
  "cog",
  "coins",
  "columns",
  "command",
  "compass",
  "component",
  "concierge-bell",
  "construction",
  "contact",
  "contrast",
  "cookie",
  "copy-check",
  "copy-minus",
  "copy-plus",
  "copy-slash",
  "copy-x",
  "copy",
  "copyleft",
  "copyright",
  "corner-down-left",
  "corner-down-right",
  "corner-left-down",
  "corner-left-up",
  "corner-right-down",
  "corner-right-up",
  "corner-up-left",
  "corner-up-right",
  "cpu",
  "creative-commons",
  "credit-card",
  "croissant",
  "crop",
  "cross",
  "crosshair",
  "crown",
  "cup-soda",
  "curly-braces",
  "currency",
  "database-backup",
  "database",
  "delete",
  "diamond",
  "dice-1",
  "dice-2",
  "dice-3",
  "dice-4",
  "dice-5",
  "dice-6",
  "dices",
  "diff",
  "disc-2",
  "disc",
  "divide-circle",
  "divide-square",
  "divide",
  "dna-off",
  "dna",
  "dog",
  "dollar-sign",
  "door-closed",
  "door-open",
  "download-cloud",
  "download",
  "dribbble",
  "droplet",
  "droplets",
  "drumstick",
  "dumbbell",
  "ear-off",
  "ear",
  "edit-2",
  "edit-3",
  "edit",
  "egg-fried",
  "egg-off",
  "egg",
  "equal-not",
  "equal",
  "eraser",
  "euro",
  "expand",
  "external-link",
  "eye-off",
  "eye",
  "facebook",
  "factory",
  "fan",
  "fast-forward",
  "feather",
  "figma",
  "file-archive",
  "file-audio-2",
  "file-audio",
  "file-axis-3d",
  "file-badge-2",
  "file-badge",
  "file-bar-chart-2",
  "file-bar-chart",
  "file-box",
  "file-check-2",
  "file-check",
  "file-clock",
  "file-code",
  "file-cog-2",
  "file-cog",
  "file-diff",
  "file-digit",
  "file-down",
  "file-edit",
  "file-heart",
  "file-image",
  "file-input",
  "file-json-2",
  "file-json",
  "file-key-2",
  "file-key",
  "file-line-chart",
  "file-lock-2",
  "file-lock",
  "file-minus-2",
  "file-minus",
  "file-output",
  "file-pie-chart",
  "file-plus-2",
  "file-plus",
  "file-question",
  "file-scan",
  "file-search-2",
  "file-search",
  "file-signature",
  "file-spreadsheet",
  "file-symlink",
  "file-terminal",
  "file-text",
  "file-type-2",
  "file-type",
  "file-up",
  "file-video-2",
  "file-video",
  "file-volume-2",
  "file-volume",
  "file-warning",
  "file-x2",
  "file-x",
  "file",
  "files",
  "film",
  "filter-x",
  "filter",
  "fingerprint",
  "fish-off",
  "fish",
  "flag-off",
  "flag-triangle-left",
  "flag-triangle-right",
  "flag",
  "flame",
  "flashlight-off",
  "flashlight",
  "flask-conical-off",
  "flask-conical",
  "flask-round",
  "flip-horizontal-2",
  "flip-horizontal",
  "flip-vertical-2",
  "flip-vertical",
  "flower-2",
  "flower",
  "focus",
  "folder-archive",
  "folder-check",
  "folder-clock",
  "folder-closed",
  "folder-cog-2",
  "folder-cog",
  "folder-down",
  "folder-edit",
  "folder-git-2",
  "folder-git",
  "folder-heart",
  "folder-input",
  "folder-key",
  "folder-lock",
  "folder-minus",
  "folder-open",
  "folder-output",
  "folder-plus",
  "folder-search-2",
  "folder-search",
  "folder-symlink",
  "folder-tree",
  "folder-up",
  "folder-x",
  "folder",
  "folders",
  "footprints",
  "forklift",
  "form-input",
  "forward",
  "frame",
  "framer",
  "frown",
  "fuel",
  "function-square",
  "gamepad-2",
  "gamepad",
  "gauge",
  "gavel",
  "gem",
  "ghost",
  "gift",
  "git-branch-plus",
  "git-branch",
  "git-commit",
  "git-compare",
  "git-fork",
  "git-merge",
  "git-pull-request-closed",
  "git-pull-request-draft",
  "git-pull-request",
  "github",
  "gitlab",
  "glass-water",
  "glasses",
  "globe-2",
  "globe",
  "grab",
  "graduation-cap",
  "grape",
  "grid",
  "grip-horizontal",
  "grip-vertical",
  "grip",
  "hammer",
  "hand-metal",
  "hand",
  "hard-drive",
  "hard-hat",
  "hash",
  "haze",
  "heading-1",
  "heading-2",
  "heading-3",
  "heading-4",
  "heading-5",
  "heading-6",
  "heading",
  "headphones",
  "heart-crack",
  "heart-handshake",
  "heart-off",
  "heart-pulse",
  "heart",
  "help-circle",
  "helping-hand",
  "hexagon",
  "highlighter",
  "history",
  "home",
  "hop-off",
  "hop",
  "hotel",
  "hourglass",
  "ice-cream-2",
  "ice-cream",
  "image-minus",
  "image-off",
  "image-plus",
  "image",
  "import",
  "inbox",
  "indent",
  "indian-rupee",
  "infinity",
  "info",
  "inspect",
  "instagram",
  "italic",
  "japanese-yen",
  "joystick",
  "key",
  "keyboard",
  "lamp-ceiling",
  "lamp-desk",
  "lamp-floor",
  "lamp-wall-down",
  "lamp-wall-up",
  "lamp",
  "landmark",
  "languages",
  "laptop-2",
  "laptop",
  "lasso-select",
  "lasso",
  "laugh",
  "layers",
  "layout-dashboard",
  "layout-grid",
  "layout-list",
  "layout-template",
  "layout",
  "leaf",
  "library",
  "life-buoy",
  "lightbulb-off",
  "lightbulb",
  "line-chart",
  "link-2off",
  "link-2",
  "link",
  "linkedin",
  "list-checks",
  "list-end",
  "list-minus",
  "list-music",
  "list-ordered",
  "list-plus",
  "list-start",
  "list-tree",
  "list-video",
  "list-x",
  "list",
  "loader-2",
  "loader",
  "locate-fixed",
  "locate-off",
  "locate",
  "lock",
  "log-in",
  "log-out",
  "luggage",
  "magnet",
  "mail-check",
  "mail-minus",
  "mail-open",
  "mail-plus",
  "mail-question",
  "mail-search",
  "mail-warning",
  "mail-x",
  "mail",
  "mailbox",
  "mails",
  "map-pin-off",
  "map-pin",
  "map",
  "martini",
  "maximize-2",
  "maximize",
  "medal",
  "megaphone-off",
  "megaphone",
  "meh",
  "menu",
  "message-circle",
  "message-square-dashed",
  "message-square-plus",
  "message-square",
  "messages-square",
  "mic-2",
  "mic-off",
  "mic",
  "microscope",
  "microwave",
  "milestone",
  "milk-off",
  "milk",
  "minimize-2",
  "minimize",
  "minus-circle",
  "minus-square",
  "minus",
  "monitor-off",
  "monitor-smartphone",
  "monitor-speaker",
  "monitor",
  "moon",
  "more-horizontal",
  "more-vertical",
  "mountain-snow",
  "mountain",
  "mouse-pointer-2",
  "mouse-pointer-click",
  "mouse-pointer",
  "mouse",
  "move-3d",
  "move-diagonal-2",
  "move-diagonal",
  "move-horizontal",
  "move-vertical",
  "move",
  "music-2",
  "music-3",
  "music-4",
  "music",
  "navigation-2off",
  "navigation-2",
  "navigation-off",
  "navigation",
  "network",
  "newspaper",
  "nfc",
  "nut-off",
  "nut",
  "octagon",
  "option",
  "orbit",
  "outdent",
  "package-2",
  "package-check",
  "package-minus",
  "package-open",
  "package-plus",
  "package-search",
  "package-x",
  "package",
  "paint-bucket",
  "paintbrush-2",
  "paintbrush",
  "palette",
  "palmtree",
  "paperclip",
  "parking-circle-off",
  "parking-circle",
  "parking-square-off",
  "parking-square",
  "party-popper",
  "pause-circle",
  "pause-octagon",
  "pause",
  "pen-tool",
  "pencil",
  "percent",
  "person-standing",
  "phone-call",
  "phone-forwarded",
  "phone-incoming",
  "phone-missed",
  "phone-off",
  "phone-outgoing",
  "phone",
  "picture-in-picture-2",
  "picture-in-picture",
  "pie-chart",
  "piggy-bank",
  "pilcrow",
  "pill",
  "pin-off",
  "pin",
  "pipette",
  "pizza",
  "plane-landing",
  "plane-takeoff",
  "plane",
  "play-circle",
  "play",
  "plug-2",
  "plug-zap",
  "plug",
  "plus-circle",
  "plus-square",
  "plus",
  "pocket",
  "podcast",
  "pointer",
  "pound-sterling",
  "power-off",
  "power",
  "printer",
  "puzzle",
  "qr-code",
  "quote",
  "radio-receiver",
  "radio-tower",
  "radio",
  "rat",
  "receipt",
  "rectangle-horizontal",
  "rectangle-vertical",
  "recycle",
  "redo-2",
  "redo",
  "refresh-ccw",
  "refresh-cw",
  "refrigerator",
  "regex",
  "remove-formatting",
  "repeat-1",
  "repeat",
  "replace-all",
  "replace",
  "reply-all",
  "reply",
  "rewind",
  "rocket",
  "rocking-chair",
  "rotate-3d",
  "rotate-ccw",
  "rotate-cw",
  "router",
  "rss",
  "ruler",
  "russian-ruble",
  "sailboat",
  "salad",
  "sandwich",
  "save",
  "scale-3d",
  "scale",
  "scaling",
  "scan-face",
  "scan-line",
  "scan",
  "school-2",
  "school",
  "scissors",
  "screen-share-off",
  "screen-share",
  "scroll",
  "search",
  "send",
  "separator-horizontal",
  "separator-vertical",
  "server-cog",
  "server-crash",
  "server-off",
  "server",
  "settings-2",
  "settings",
  "share-2",
  "share",
  "sheet",
  "shield-alert",
  "shield-check",
  "shield-close",
  "shield-off",
  "shield-question",
  "shield",
  "ship",
  "shirt",
  "shopping-bag",
  "shopping-cart",
  "shovel",
  "shower-head",
  "shrink",
  "shrub",
  "shuffle",
  "sidebar-close",
  "sidebar-open",
  "sidebar",
  "sigma",
  "signal-high",
  "signal-low",
  "signal-medium",
  "signal-zero",
  "signal",
  "siren",
  "skip-back",
  "skip-forward",
  "skull",
  "slack",
  "slice",
  "sliders-horizontal",
  "sliders",
  "smartphone-charging",
  "smartphone-nfc",
  "smartphone",
  "smile-plus",
  "smile",
  "snowflake",
  "sofa",
  "sort-asc",
  "sort-desc",
  "soup",
  "space",
  "speaker",
  "spline",
  "split-square-horizontal",
  "split-square-vertical",
  "sprout",
  "square",
  "stamp",
  "star-half",
  "star-off",
  "star",
  "step-back",
  "step-forward",
  "stethoscope",
  "sticker",
  "sticky-note",
  "stop-circle",
  "store",
  "stretch-horizontal",
  "stretch-vertical",
  "strikethrough",
  "subscript",
  "subtitles",
  "sun-dim",
  "sun-medium",
  "sun-moon",
  "sun-snow",
  "sun",
  "sunrise",
  "sunset",
  "superscript",
  "swiss-franc",
  "switch-camera",
  "sword",
  "swords",
  "syringe",
  "table-2",
  "table",
  "tablet",
  "tablets",
  "tag",
  "tags",
  "target",
  "tent",
  "terminal-square",
  "terminal",
  "test-tube-2",
  "test-tube",
  "test-tubes",
  "text-cursor-input",
  "text-cursor",
  "text-selection",
  "text",
  "thermometer-snowflake",
  "thermometer-sun",
  "thermometer",
  "thumbs-down",
  "thumbs-up",
  "ticket",
  "timer-off",
  "timer-reset",
  "timer",
  "toggle-left",
  "toggle-right",
  "tornado",
  "tower-control",
  "toy-brick",
  "train",
  "trash-2",
  "trash",
  "tree-deciduous",
  "tree-pine",
  "trees",
  "trello",
  "trending-down",
  "trending-up",
  "triangle",
  "trophy",
  "truck",
  "tv-2",
  "tv",
  "twitch",
  "twitter",
  "type",
  "umbrella",
  "underline",
  "undo-2",
  "undo",
  "unlink-2",
  "unlink",
  "unlock",
  "upload-cloud",
  "upload",
  "usb",
  "user-check",
  "user-cog",
  "user-minus",
  "user-plus",
  "user-x",
  "user",
  "users",
  "utensils-crossed",
  "utensils",
  "utility-pole",
  'vault',
  "vegan",
  "venetian-mask",
  "verified",
  "vibrate-off",
  "vibrate",
  "video-off",
  "video",
  "view",
  "voicemail",
  "volume-1",
  "volume-2",
  "volume-x",
  "volume",
  "vote",
  "wallet",
  "wand-2",
  "wand",
  "warehouse",
  "watch",
  "waves",
  "webcam",
  "webhook",
  "wheat-off",
  "wheat",
  "whole-word",
  "wifi-off",
  "wifi",
  "wind",
  "wine-off",
  "wine",
  "wrap-text",
  "wrench",
  "x-circle",
  "x-octagon",
  "x-square",
  "x",
  "youtube",
  "zap-off",
  "zap",
  "zoom-in",
  "zoom-out"
]