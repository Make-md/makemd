export function focusNextElement(scope, currentTarget) {
  const interactiveEls = scope.querySelectorAll("a,button,input");

  const currentEl = Array.prototype.findIndex.call(
    interactiveEls,
    (element) => element === currentTarget
  );

  const nextEl = interactiveEls[currentEl - 1] || interactiveEls[currentEl + 1];

  if (nextEl) {
    nextEl.focus();
  }
}
