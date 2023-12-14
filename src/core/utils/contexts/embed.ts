
import { SpaceState } from "core/types/superstate";


export const contextViewEmbedStringFromContext = (space: SpaceState, schema: string) => {
  if (space.type == 'folder') {
    return `![![${space.path}/#*${schema}]]`
  }
  if (space.type == 'vault') {
    return `![![/#*${schema}]]`
  }
  return `![![${space.path}/#*${schema}]]`
}


export const contextEmbedStringFromContext = (space: SpaceState, schema: string) => {
  if (space.type == 'folder') {
    return `![![${space.path}/#^${schema}]]`
  }
  if (space.type == 'vault') {
    return `![![/#^${schema}]]`
  }
  return `![![${space.path}/#^${schema}]]`
}



