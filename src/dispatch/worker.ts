import { CachedMetadata, FileStats } from "obsidian";

function failableImport(path: string, contents: string, stat: FileStats, metadata?: CachedMetadata) {

    // return parseMetadata(path, contents, stat, metadata);
}

onmessage = async evt => {
    try {
        const { path, contents, stat, metadata } = evt.data;
        const result = failableImport(path, contents, stat, metadata);
        (postMessage as any)({ path: evt.data.path, result:result });
    } catch (error) {
        console.log(error);
        (postMessage as any)({
            path: evt.data.path,
            result: {
                $error: `Failed to index file: ${evt.data.path}: ${error}`,
            },
        });
    }
};