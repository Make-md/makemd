function escapeForRegExp(string) {
  return string.replace(/[-\\^$*+?.()|[\]{}]/g, "\\$&");
}

export function matchAny(string) {
  return new RegExp(escapeForRegExp(string), "gi");
}

export function matchPartial(string) {
  return new RegExp(`(?:^|\\s)${escapeForRegExp(string)}`, "i");
}

export function matchExact(string) {
  return new RegExp(`^${escapeForRegExp(string)}$`, "i");
}
