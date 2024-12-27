
export function selectElementContents(el: Element) {
  if (!el) return;
  const range = document.createRange();
  range.selectNodeContents(el);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

export const windowFromDocument = (doc: Document): Window => {
  return doc.defaultView || window;
}