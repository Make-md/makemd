import MakeMDPlugin from "main";
import { AFile, FileTypeAdapter, FilesystemMiddleware } from "makemd-core";
import { TFile } from "obsidian";
import { getAPI } from "obsidian-dataview";

import { tFileToAFile } from "../obsidian/utils/file";
import { replaceValues } from "./metadata/dataviewEditor";

type DataviewContentTypes = {
    property: any;
}

export class DataViewMarkdownFiletypeAdapter implements FileTypeAdapter<DataviewContentTypes, DataviewContentTypes> {
    public api = () => getAPI();
    public id = "dataview.obsidian.md"
    dataViewReady: boolean;
  dataViewLastIndex: number;
  loadTime: number;
    public cache : Map<string, DataviewContentTypes>;
    public supportedFileTypes = ['md'];
    public middleware: FilesystemMiddleware;
    public constructor (public plugin: MakeMDPlugin) {
        this.plugin = plugin;
        this.loadTime = Date.now();
    }
    
    public initiate (middleware: FilesystemMiddleware) {
        this.middleware = middleware;
        this.cache = new Map();
        if (this.api()) {
            this.plugin.registerEvent(
              //@ts-ignore
              this.plugin.app.metadataCache.on("dataview:index-ready", () => {
                this.dataViewReady = true;
              })
            );
            this.plugin.registerEvent(
              this.plugin.app.metadataCache.on(
                "dataview:metadata-change",
                (type, file, oldPath?) => {
                  if (
                    //@ts-ignore
                    type === "update" &&
                    //dataview is triggering "update" on metadatacache.on("resolve") even if no change in the file. It occurs at app launch
                    //check if the file mtime is older that plugin load -> in this case no file has change, no need to update lookups
                    //@ts-ignore
                    this.app.metadataCache.fileCache[file.path].mtime >=
                      this.loadTime &&
                    this.api().index.revision !==
                      this.dataViewLastIndex &&
                    this.dataViewReady
                  ) {
                    if (file instanceof TFile) {
                      this.metadataChange(file);
                    }
                    this.dataViewLastIndex = this.api().index.revision;
                  }
      
                  //
                }
              )
            );
          }
    }
    private metadataChange (file: TFile) {
        // this.parseCache(tFileToAFile(file));
        this.middleware.fileFragmentChanged(tFileToAFile(file));
    }
    public parseCache: (file: AFile, refresh: boolean ) => Promise<void>;
    private metadataKeys = ['property'] as Array<keyof DataviewContentTypes>;
    public cacheTypes (file: AFile) : (keyof DataviewContentTypes)[] {
        return this.metadataKeys;
    }
    public contentTypes (file: AFile) {
        return this.metadataKeys;
    }
    public getCacheTypeByRefString: (file: AFile, refString: string) => any;
    public getCache: (file: AFile, fragmentType: keyof DataviewContentTypes, query?: any) => any;

    public readContent: (file: AFile, fragmentType: keyof DataviewContentTypes, fragmentId: any) => any

    public newFile: (name: string, type: string, parent: string) => Promise<AFile>;
    public newContent :(file: AFile, fragmentType: keyof DataviewContentTypes, fragmentId: string, content: DataviewContentTypes[keyof DataviewContentTypes], options: { [key: string]: any; }) => Promise<any>;
    
    public async saveContent (file: AFile, fragmentType: keyof DataviewContentTypes, fragmentId: string, content: (prev: any) => any) {
        if (fragmentType == 'property')
        if (this.api().page(file.path)[fragmentId] ) {
            replaceValues(this.plugin, file.path, fragmentId, content(this.readContent(file, fragmentType, fragmentId)));
          }
        return true;
    }
    public async deleteContent (file: AFile, fragmentType: keyof DataviewContentTypes, fragmentId: any) {
        if (fragmentType == 'property')
        if (this.api().page(file.path)[fragmentId] ) {
            replaceValues(this.plugin, file.path, fragmentId, "");
          }
        return;
    }
    
}