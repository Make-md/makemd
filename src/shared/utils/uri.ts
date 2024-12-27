import { PathRefTypes, URI } from "shared/types/path";
import { removeTrailingSlashFromFolder } from "shared/utils/paths";


export const parseURI = (uri: string): URI => {
  const fullPath= uri;
    //   const nt = uriByStr(uri, source);
    //   return nt;
    // }
    // export const uriByStr = (uri: string, source?: string) => {
      
      let refTypeChar = '';
      const parseQuery = (queryString: string) => {
        const query: { [key: string]: string } = {};
        queryString.split('&').forEach(param => {
          const [key, value] = param.split('=');
          query[decodeURIComponent(key)] = decodeURIComponent(value);
        });
        return query;
      };
    
      const mapRefType = (refTypeChar: string, isSpace: boolean) => {
        if (isSpace) {
          if (refTypeChar === '^') return 'context';
          if (refTypeChar === '*') return 'frame';
          if (refTypeChar === ';') return 'action';
          return null
        }
        if (refTypeChar === '^') return 'block';
        return 'heading';
      };
    
      let space: string | null = null;
      let path: string | null = null;
      let alias: string | null = null;
      let reference: string | null = null;
      let refType: PathRefTypes= null;
      let query: { [key: string]: string } | null = null;
      let scheme: string | null = 'vault';
    
      if (fullPath.indexOf('://') != -1) {
      scheme = uri.slice(0, uri.indexOf('://'))
      const spaceStr = uri.slice(uri.indexOf('://')+3);
        
        if (spaceStr.charAt(0) == "#" || spaceStr.charAt(0) == "$") {
          const endIndex = spaceStr.split('/')[0].lastIndexOf('#');
          if (endIndex > 0) {
            space = removeTrailingSlashFromFolder(spaceStr.slice(0, endIndex))
            uri = spaceStr.slice(endIndex)
          } else {
            space = spaceStr.split('/')[0];
            uri = spaceStr.replace(space, '')
            if (uri.length > 0) {
              uri = uri.slice(1)
            }
            if (uri == '') {
              uri = '/'
            }
          }
        } else {
          const spaceParts = spaceStr.split('/');  
          space = spaceParts[0];
          uri =  (spaceParts.slice(1).join('/') || ''); // Convert the rest back to a relative URI
        }
        
      }
      
    
      const lastSlashIndex = uri.lastIndexOf('/');
      const lastHashIndex = uri.lastIndexOf('#');
      const lastPipeIndex = uri.lastIndexOf('|');
      const queryIndex = uri.lastIndexOf('?');
    let trailSlash = false;
      if (queryIndex !== -1) {
        query = parseQuery(uri.slice(queryIndex + 1));
        uri = uri.slice(0, queryIndex);
      }
    
      if (lastHashIndex !== -1 && lastHashIndex > lastSlashIndex) {
        if (lastHashIndex == lastSlashIndex+1) {
          trailSlash = true
        }
        const refPart = uri.slice(lastHashIndex + 1);
        refType = mapRefType(refPart[0], trailSlash);
        if (refType || lastHashIndex != lastSlashIndex+1) {
        refTypeChar = refPart[0];
        reference = refType ? refPart.slice(1) : refPart;
        uri = uri.slice(0, lastHashIndex);
        }
      }
    
      if (lastPipeIndex !== -1 && lastPipeIndex > lastSlashIndex) {
        alias = uri.slice(lastPipeIndex + 1);
        uri = uri.slice(0, lastPipeIndex);
      }
      if (uri.charAt(uri.length - 1) == '/') {
        trailSlash = true
      }
    path = uri
      return {
    basePath: removeTrailingSlashFromFolder(`${space ? `${scheme}://${space}/${path != '/' ? path : ''}` : path}`),

        authority: space,
        fullPath,
        scheme,
        path: removeTrailingSlashFromFolder(uri),
        alias: alias,
        ref: reference,
        refType: refType,
        refStr: refType ? refTypeChar+reference : reference,
        query: query,
        trailSlash 
      };
    }

export const movePath = (path: string, newParent: string) : string => {
  const parts = path.split("/")
  const newPath = newParent + "/" + parts[parts.length - 1]

  return newPath
}
export const renamePathWithoutExtension = (path: string, newName: string): string => {
  const dir = path.substring(0, path.lastIndexOf("/"));
  return dir.length > 0 ? `${dir}/${newName}` : `${newName}`;
}

export const renamePathWithExtension = (path: string, newName: string): string => {
  const dir = path.substring(0, path.lastIndexOf("/"));
  const ext = path.lastIndexOf(".") != -1 ? path.substring(path.lastIndexOf(".")) : "";
  return dir.length > 0 ? `${dir}/${newName}${ext}` : `${newName}${ext}`;
}


export const uriForFolder = (path: string) : URI => {
  return {
    basePath: path,
    fullPath: path,
    authority: null,
    path,
    scheme: 'vault',
    alias: null,
    ref: null,
    refStr: null,
    refType: null,
    query: null,
    trailSlash: true
  };
}


