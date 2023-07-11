import { MDBTable } from "types/mdb";

export const renameRowForFile = (
    folder: MDBTable,
    filePath: string,
    toFilePath: string
  ): MDBTable => {
    return {
      ...folder,
      rows: folder.rows.map((f) =>
        f.File == filePath
          ? { ...f, File: toFilePath }
          : f
      ),
    };
  };
  
 

  export const removeRowForFile = (folder: MDBTable, filePath: string): MDBTable => {
    return {
      ...folder,
      rows: folder.rows.filter(
        (f) => f.File != filePath
      ),
    };
  };

  export const removeRowsForFile = (folder: MDBTable, filePaths: string[]): MDBTable => {
    return {
      ...folder,
      rows: folder.rows.filter(
        (f) => !filePaths.includes(f.File)
      ),
    };
  };