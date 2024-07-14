import { InteractionType, ScreenType, UIManager } from "core/middleware/ui"

export const isTouchScreen = (ui: UIManager) => (ui.primaryInteractionType() == InteractionType.Touch)
export const isPhone = (ui: UIManager) => (ui.getScreenType() == ScreenType.Phone)