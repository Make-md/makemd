import { FileMetadataCache } from "types/cache";
import { SpaceDef, SpaceDefFilter } from "types/space";
import { filterFnTypes } from "utils/contexts/predicate/filterFns/filterFnTypes";
import { parseFrontMatter } from "utils/metadata/frontmatter/parseFrontMatter";
import { serializeMultiString } from "utils/serializer";

const filterFilesForAny = (files: FileMetadataCache[], filters: SpaceDefFilter[]) : FileMetadataCache[] => {
  const newArray = filters.reduce((p, c) => {
    const [result, remaining] = p;
    const filteredFiles = (c.type == 'fileprop') ? filterFileprop(remaining, c) :
    c.type == 'filemeta' ? filterFilemeta(remaining, c) : c.type == 'frontmatter' ? filterFM(remaining, c) : [];
    const diffArray = remaining.filter(x => !filteredFiles.includes(x));
    return [[...result, ...filteredFiles], diffArray]
  }, [[], files])
  return newArray[0];
}

const filterFilesForAll = ( files: FileMetadataCache[], filters: SpaceDefFilter[]) : FileMetadataCache[] => {
  return filters.reduce((p, c) => {
    return (c.type == 'fileprop') ? filterFileprop(p, c) :
    c.type == 'filemeta' ? filterFilemeta(p, c) : c.type == 'frontmatter' ? filterFM(p, c) : [];
  }, files)
}

const filterFM = ( files: FileMetadataCache[], def: SpaceDefFilter) => {

  return files.filter(f => {
    const fm = f.frontmatter
    if (!fm || !fm[def.field]) {
      return false;
    } 
    const filterFn = filterFnTypes[def.fn];
    let result = true;
  
    if (filterFn) {
      result = filterFn.fn(parseFrontMatter(def.field, fm[def.field]), def.value);
    }
    return result;
  })
}
const filterFilemeta = (files: FileMetadataCache[], def: SpaceDefFilter) => {
  return files.filter(f => {
  let value = '';
  if (def.field == 'outlinks') {
    value = serializeMultiString(f.outlinks)
  } else if (def.field == 'inlinks') {
    value = serializeMultiString(f.inlinks)
  } else if (def.field == 'tags') {
    value = serializeMultiString(f.tags);
  }
  const filterFn = filterFnTypes[def.fn];
    let result = true;
  
    if (filterFn) {
      result = filterFn.fn(value, def.value);
    }
    return result;
  });
}

const filterFileprop = (files: FileMetadataCache[], def: SpaceDefFilter) => {
  return files.filter(f => {
    const vaultItemFields = ['path', 'sticker', 'color', 'isFolder', 'extension', 'ctime', 'mtime', 'size', 'parent']
    if (vaultItemFields.includes(def.field)) {
      const filterFn = filterFnTypes[def.fn];
      
      let result = true;
      if (filterFn) {
        result = filterFn.fn(f[def.field as keyof FileMetadataCache], def.value);
      }
      return result;
    }
    return true;
  })
}



export const fileByDef = ( defs: SpaceDef, file: FileMetadataCache) => {
  const filters = defs.filters;

  const fileInFilter = filters.reduce((p, c) => {
    if (!p) return p;
    const result = (c.type == 'any') ? filterFilesForAny([file], c.filters).length > 0 : filterFilesForAll([file], c.filters).length > 0
    return result
  }, true);
return fileInFilter; 
}