export const selectNextIndex = (currIndex: string, array: string[]) => {
  if (!currIndex && array.length > 0) return array[0];
  const pos = array.indexOf(currIndex);
  if (pos < array.length - 1) return array[pos + 1];
  return currIndex;
};
export const selectPrevIndex = (currIndex: string, array: string[]) => {
  const pos = array.indexOf(currIndex);
  if (pos > 0) return array[pos - 1];
  return array[0];
};

export const selectRange = (
  currSel: string,
  newSel: string,
  array: string[]
) => {
  const lastIndex = array.findIndex((f) => f == currSel);
  const newIndex = array.findIndex((f) => f == newSel);
  if (lastIndex < newIndex) {
    return array.filter((f, i) => i > lastIndex && i <= newIndex);
  }
  return array.filter((f, i) => i < lastIndex && i >= newIndex);
};
