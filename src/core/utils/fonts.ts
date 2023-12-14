export function listFonts(): string[] {
    const { fonts } = document;
    //@ts-ignore
    const it = fonts.entries();

    const arr: string[] = [];
    let done = false;

    while (!done) {
        const font = it.next();
        if (!font.done) {
            arr.push(font.value[0].family);
        } else {
            done = font.done;
        }
    }

    // converted to set then array to filter repetitive values
    return Array.from(new Set(arr));
}