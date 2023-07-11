//Forked from metadata menu
import MakeMDPlugin from "main";
import { MarkdownView, TFile } from "obsidian";
import { serializeMultiDisplayString } from "utils/serializer";

const enum Location {
  "fullLine" = "fullLine",
  "brackets" = "brackets",
  "parenthesis" = "parenthesis",
}

const LocationWrapper: Record<
  keyof typeof Location,
  { start: "" | "[" | "("; end: "" | "]" | ")" }
> = {
  fullLine: { start: "", end: "" },
  brackets: { start: "[", end: "]" },
  parenthesis: { start: "(", end: ")" },
};

type FieldReplace = {
  oldField: string;
  newField: string;
};
export const fieldComponents = [
  "inQuote",
  "inList",
  "startStyle",
  "attribute",
  "endStyle",
  "beforeSeparatorSpacer",
  "afterSeparatorSpacer",
  "values",
];

export const genericFieldRegex =
  "(?<inQuote>>(\\s+)?)?(?<inList>- )?(?<startStyle>[_\\*~`]*)(?<attribute>[0-9\\w\\p{Letter}\\p{Emoji_Presentation}][-0-9\\w\\p{Letter}\\p{Emoji_Presentation}\\s]*)(?<endStyle>[_\\*~`]*)(?<beforeSeparatorSpacer>\\s*)";

export const inlineFieldRegex = (attribute: string) =>
  `(?<inQuote>\>(\\s+)?)?(?<inList>- )?(?<startStyle>[_\\*~\`]*)(?<attribute>${attribute})(?<endStyle>[_\\*~\`]*)(?<beforeSeparatorSpacer>\\s*)::(?<afterSeparatorSpacer>\\s*)`;

export const fullLineRegex = new RegExp(
  `^${genericFieldRegex}::\\s*(?<values>.*)?`,
  "u"
);

export const inSentenceRegexBrackets = new RegExp(
  `\\[${genericFieldRegex}::\\s*(?<values>[^\\]]+)?\\]`,
  "gu"
);

export const inSentenceRegexPar = new RegExp(
  `\\(${genericFieldRegex}::\\s*(?<values>[^\\)]+)?\\)`,
  "gu"
);

export const encodeLink = (value: string): string => {
  /* replace link brackets by "impossible" combination of characters so that they won't be mixed up with inSentence field brackets when seaching with regex*/
  return value
    ? value.replace(/\[\[/g, "🕌🔧").replace(/\]\]/g, "🐓🐀")
    : value;
};

export const decodeLink = (value: string): string => {
  /* replace link brackets by "impossible" combination of characters so that they won't be mixed up with inSentence field brackets when seaching with regex*/
  return value ? value.replace(/🕌🔧/gu, "[[").replace(/🐓🐀/gu, "]]") : value;
};

export const matchInlineFields = (
  regex: RegExp,
  line: string,
  attribute: string,
  input: string,
  location: keyof typeof Location = "fullLine"
): FieldReplace[] => {
  const sR = line.matchAll(regex);
  let next = sR.next();
  const newFields: FieldReplace[] = [];
  while (!next.done) {
    const match = next.value;
    if (
      match.groups &&
      Object.keys(match.groups).every((j) => fieldComponents.includes(j))
    ) {
      const {
        inList,
        inQuote,
        startStyle,
        endStyle,
        beforeSeparatorSpacer,
        afterSeparatorSpacer,
        values,
      } = match.groups;
      const inputArray = input
        ? input.replace(/(\,\s+)/g, ",").split(",")
        : [""];
      const newValue =
        inputArray.length == 1 ? inputArray[0] : `${serializeMultiDisplayString(inputArray)}`;
      const start = LocationWrapper[location].start;
      const end = LocationWrapper[location].end;
      newFields.push({
        oldField: match[0],
        newField: `${inQuote || ""}${start}${
          inList || ""
        }${startStyle}${attribute}${endStyle}${beforeSeparatorSpacer}::${afterSeparatorSpacer}${newValue}${end}`,
      });
    }
    next = sR.next();
  }
  return newFields;
};

export async function replaceValues(
  plugin: MakeMDPlugin,
  fileOrFilePath: TFile | string,
  attribute: string,
  input: string,
  previousItemsCount: number = 0
): Promise<void> {
  let file: TFile;
  if (fileOrFilePath instanceof TFile) {
    file = fileOrFilePath;
  } else {
    const _file = plugin.app.vault.getAbstractFileByPath(fileOrFilePath);
    if (_file instanceof TFile && _file.extension == "md") {
      file = _file;
    } else {
      throw Error("path doesn't correspond to a proper file");
    }
  }
  const content = (await plugin.app.vault.read(file)).split("\n");
  const frontmatter = plugin.app.metadataCache.getFileCache(file)?.frontmatter;
  //first look for lookup lists

  const skippedLines: number[] = [];

  const {
    position: { start, end },
  } = frontmatter
    ? frontmatter
    : { position: { start: undefined, end: undefined } };
  const newContent = content.map((line, i) => {
    const encodedInput = encodeLink(input);
    let encodedLine = encodeLink(line);
    const fullLineRegex = new RegExp(
      `^${inlineFieldRegex(attribute)}(?<values>[^\\]]*)`,
      "u"
    );
    const fR = encodedLine.match(fullLineRegex);
    if (
      fR?.groups &&
      Object.keys(fR.groups).every((j) => fieldComponents.includes(j))
    ) {
      //check if this field is a lookup and get list boundaries

      const {
        inList,
        inQuote,
        startStyle,
        endStyle,
        beforeSeparatorSpacer,
        afterSeparatorSpacer,
        values,
      } = fR.groups;
      const inputArray = input
        ? input
            .replace(/(\,\s+)/g, ",")
            .split(",")
            .sort()
        : [];
      let newValue: string;
      let hiddenValue = "";
      newValue =
        inputArray.length == 1 ? inputArray[0] : `${serializeMultiDisplayString(inputArray)}`;
      return `${inQuote || ""}${
        inList || ""
      }${startStyle}${attribute}${endStyle}${beforeSeparatorSpacer}::${afterSeparatorSpacer}${
        hiddenValue + newValue
      }`;
    } else {
      const newFields: FieldReplace[] = [];
      const inSentenceRegexBrackets = new RegExp(
        `\\[${inlineFieldRegex(attribute)}(?<values>[^\\]]+)?\\]`,
        "gu"
      );
      const inSentenceRegexPar = new RegExp(
        `\\(${inlineFieldRegex(attribute)}(?<values>[^\\)]+)?\\)`,
        "gu"
      );
      newFields.push(
        ...matchInlineFields(
          inSentenceRegexBrackets,
          encodedLine,
          attribute,
          encodedInput,
          Location.brackets
        )
      );
      newFields.push(
        ...matchInlineFields(
          inSentenceRegexPar,
          encodedLine,
          attribute,
          encodedInput,
          Location.parenthesis
        )
      );
      newFields.forEach((field) => {
        const fieldRegex = new RegExp(
          field.oldField.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
          "u"
        );
        encodedLine = encodedLine.replace(fieldRegex, field.newField);
      });
      return decodeLink(encodedLine);
    }
  });
  await plugin.app.vault.modify(
    file,
    newContent.filter((line, i) => !skippedLines.includes(i)).join("\n")
  );
  const editor = plugin.app.workspace.getActiveViewOfType(MarkdownView)?.editor;
  if (editor) {
    const lineNumber = editor.getCursor().line;
    editor.setCursor({
      line: editor.getCursor().line,
      ch: editor.getLine(lineNumber).length,
    });
  }
}
