export const replaceMarkdownForReadingMode = (
  el: HTMLElement,
  callback: (dom: HTMLElement) => void
) => {
  let dom: HTMLElement = el;
  setTimeout(async () => {
    //wait for el to be attached to the displayed document
    let counter = 0;
    while (!el.parentElement && counter++ <= 50) await sleep(50);
    if (!el.parentElement) return;

    while (
      !dom.hasClass("markdown-reading-view") &&
      !dom.hasClass("internal-embed") &&
      dom.parentElement
    ) {
      dom = dom.parentElement;
    }
    if (dom && dom.hasClass("markdown-reading-view")) {
      callback(dom);
    }
  });
};
