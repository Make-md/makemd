export const normalizedModifier = (e: React.DragEvent) => e.metaKey || e.ctrlKey
export const normalizedModifierName = () => window.navigator.platform.startsWith('Mac') ? '⌘' : 'Ctrl'
export const normalizedAltName = () => window.navigator.platform.startsWith('Mac') ? '⌥' : 'Alt'
