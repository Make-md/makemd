import MakeMDPlugin from "main";
import { DBRow, MDBField } from "types/mdb";
import { parseLinkString, parseMultiString } from "utils/parser";
import { serializeMultiString } from "utils/serializer";
import { saveFrontmatterValue } from "../metadata/frontmatter/fm";
//helpers for link types (context and link)

export const valueContainsLink = (link: string, value: string) => {
    return parseMultiString(value).some(f => link == parseLinkString(f))
  }
  export const replaceLinkInValue = (link: string, newLink: string, value: string) => {
    return serializeMultiString(parseMultiString(value).map(f => parseLinkString(f) == link ? newLink : link))
  }

  export const removeLinkInValue = (link: string, value: string) => {
    return serializeMultiString(parseMultiString(value).filter(f => f != link))
  }

  export const linkColumns = (cols: MDBField[]) => {
    return cols.filter(f => f.type.startsWith('link') || f.type.startsWith('context'))
  }


  export const removeLinksInRow = (plugin: MakeMDPlugin, row: DBRow, link: string, cols: MDBField[]) : DBRow => {
    if (cols.length == 0) {
      return row;
    }
    const deltaRow = cols.reduce((p, c) => {
      if (valueContainsLink(link, row[c.name])) {
        const newValue = removeLinkInValue(link, row[c.name]);
      saveFrontmatterValue(
        plugin,
        row.File,
        c.name,
        newValue,
        c.type,
        plugin.settings.saveAllContextToFrontmatter
      );
      return {...p, [c.name]: newValue}
     } 
     return p
    }, {})
    return {...row, ...deltaRow}
  }
  
  export const renameLinksInRow = (plugin: MakeMDPlugin, row: DBRow, link: string, newLink: string, cols: MDBField[]) : DBRow => {
    if (cols.length == 0) {
      return row;
    }
    const deltaRow = cols.reduce((p, c) => {
      if (valueContainsLink(link, row[c.name])) {
        const newValue = replaceLinkInValue(link,newLink, row[c.name]);
      saveFrontmatterValue(
        plugin,
        row.File,
        c.name,
        newValue,
        c.type,
        plugin.settings.saveAllContextToFrontmatter
      );
      return {...p, [c.name]: newValue}
     } 
     return p
    }, {})
    return {...row, ...deltaRow}
  }
  