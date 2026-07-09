# 1.3.5

## Bug Fixes
- Fixed sticker picker modal failing to render on Obsidian 1.13.1+ due to Lucide brand icons being removed (#548)
- Fixed new notes inheriting an unintended icon color from the space's default color
- Fixed editor tooltips (link previews, autocomplete) appearing behind modals
- Fixed notes disappearing from the navigator when created quickly in a new folder (reappeared only after a reload) (#524)


# 1.3.4

## Improvements
- Improved drag and drop performance and experience
- Updated drag hint to show correct modifier key instructions

## Bug Fixes
- Fixed table crash when adding rows with null values (#523)
- Fixed table row context menu pointing to wrong items
- Fixed table not refreshing after row delete
- Fixed calendar week view crash when dragging events to boundaries (#522)
- Fixed stale database entries after file rename (#536/#524)
- Fixed file rename changing rank order in database
- Fixed drag and drop reordering being off by one position
- Fixed folders auto-collapsing when clicking on them (#526)
- Fixed folder click behavior to only collapse when already selected
- Fixed fold/unfold not working for folders with folder notes (#521)
- Fixed double headers appearing on plugin reload (#527)
