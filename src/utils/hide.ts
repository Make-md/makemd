import { MakeMDSettings } from "shared/types/settings";

/**
 * Determines if a path should be excluded from the file tree
 * Handles space subfolders, hidden extensions, and hidden files
 */
export const excludePathPredicate = (settings: MakeMDSettings, path: string): boolean => {
  // Normalize path - remove trailing slash for consistent comparison
  const normalizedPath = path.endsWith('/') ? path.slice(0, -1) : path;
  const pathSegments = normalizedPath.split('/');
  const lastSegment = pathSegments[pathSegments.length - 1];
  
  return (
    // Check hidden extensions
    settings.hiddenExtensions.some((e) => normalizedPath.endsWith(e)) ||
    
    // Check if path IS the spaceSubFolder (root level)
    normalizedPath === settings.spaceSubFolder ||
    
    // Check if path ENDS with /spaceSubFolder
    normalizedPath.endsWith('/' + settings.spaceSubFolder) ||
    
    // Check if last segment IS spaceSubFolder
    lastSegment === settings.spaceSubFolder ||
    
    // Check if ANY segment in path is spaceSubFolder (for files inside space folders)
    pathSegments.some((segment) => segment === settings.spaceSubFolder) ||
    
    // Check special spaces folder paths
    normalizedPath.startsWith(settings.spacesFolder + '/#') ||
    
    // Check hiddenFiles list (with normalized comparison)
    settings.hiddenFiles.some((e) => {
      const normalizedHidden = e.endsWith('/') ? e.slice(0, -1) : e;
      return normalizedPath.startsWith(normalizedHidden);
    })
  );
};

/**
 * Determines if a path should be excluded from spaces list
 * More strict filtering for space-specific operations
 */
export const excludeSpacesPredicate = (settings: MakeMDSettings, path: string): boolean => {
  // Normalize path - remove trailing slash for consistent comparison
  const normalizedPath = path.endsWith('/') ? path.slice(0, -1) : path;
  const pathSegments = normalizedPath.split('/');
  const lastSegment = pathSegments[pathSegments.length - 1];
  
  return (
    // Check skipFolderNames
    settings.skipFolderNames.some((e) => lastSegment === e) ||
    
    // Check if path IS the spaceSubFolder (root level)
    normalizedPath === settings.spaceSubFolder ||
    
    // Check if path ENDS with /spaceSubFolder
    normalizedPath.endsWith('/' + settings.spaceSubFolder) ||
    
    // Check if last segment IS spaceSubFolder
    lastSegment === settings.spaceSubFolder ||
    
    // Check if ANY segment in path is spaceSubFolder (for files inside space folders)
    pathSegments.some((segment) => segment === settings.spaceSubFolder) ||
    
    // Check special spaces folder paths
    normalizedPath.startsWith(settings.spacesFolder + '/#') ||
    normalizedPath.startsWith(settings.spacesFolder + '/$') ||
    
    // Check hiddenFiles list (with normalized comparison)
    settings.hiddenFiles.some((e) => {
      const normalizedHidden = e.endsWith('/') ? e.slice(0, -1) : e;
      return normalizedPath.startsWith(normalizedHidden);
    })
  );
};
