
import { SpaceState } from "core/types/superstate";

export const framePathForSpace = (space: SpaceState, schema: string) => {
  if (space.type == 'folder') {
    return `${space.path}/#*${schema}`
  }
  if (space.type == 'vault') {
    return `/#*${schema}`
  }
  return `${space.path}/#*${schema}`
}

export const actionPathForSpace = (space: SpaceState, schema: string) => {
  if (space.type == 'folder') {
    return `${space.path}/#;${schema}`
  }
  if (space.type == 'vault') {
    return `/#;${schema}`
  }
  return `${space.path}/#;${schema}`
}

export const contextPathForSpace = (space: SpaceState, schema: string) => {
  if (space.type == 'folder') {
    return `${space.path}/#^${schema}`
  }
  if (space.type == 'vault') {
    return `/#^${schema}`
  }
  return `${space.path}/#^${schema}`
}

export const contextViewEmbedStringFromContext = (space: SpaceState, schema: string) => `![![${framePathForSpace(space, schema)}]]`

export const contextEmbedStringFromContext = (space: SpaceState, schema: string) => `![![${contextPathForSpace(space, schema)}]]`

