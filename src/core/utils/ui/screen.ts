import { UIManager } from "core/middleware/ui";
import { InteractionType, ScreenType } from "shared/types/ui";

export const isTouchScreen = (ui: UIManager) =>  (ui.primaryInteractionType() == InteractionType.Touch)
export const isPhone = (ui: UIManager) => (ui.getScreenType() == ScreenType.Phone)