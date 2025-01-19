import { Rect } from "./Pos";
import { IUIManager } from "./uiManager";

export type SelectMenuProps = {
  ui: IUIManager;
  multi?: boolean;
  value: string[];
  editable: boolean;
  options: SelectOption[];
  addKeyword?: string;
  defaultOptions?: SelectOption[];
  saveOptions?: (options: string[], value: string[], isNew?: boolean) => void;
  removeOption?: (option: string) => void;
  placeholder?: string;
  detail?: boolean;
  searchable?: boolean;
  sections?: SelectSection[];
  showAll?: boolean;
  showSections?: boolean;
  previewComponent?: React.ReactNode;
  onMoreOption?: (e: React.MouseEvent, option: string) => void;
  onHover?: (option: any) => void;
  onHide?: () => void;
  isDisclosure?: boolean;
  wrapperClass?: string;
  onSelectSection?: (section: string) => void;
};

export enum SelectOptionType {
    Section = -2,
    Separator = -1,
    Option = 0,
    Disclosure = 1,
    Input = 2,
    Radio = 3,
    Toggle = 4,
    Custom = 5,
    Submenu = 6,
  }
  
  export type SelectSection = {
    name: string;
    value: string;
  };
  //Overloaded component that handles menu selection
  export type SelectOption = {
    id?: number;
    name: string;
    fragment?: React.FC<{
      hide: () => void;
      onSubmenu?: (
        openSubmenu: (offset: Rect, onHide: () => void) => MenuObject
      ) => void;
    }>;
    value?: any;
    color?: string;
    section?: string;
    description?: string;
    icon?: string;
    sortable?: boolean;
    removeable?: boolean;
    disabled?: boolean;
    type?: SelectOptionType;
    onToggle?: () => void;
    onReorder?: (value: string, newValue: string) => void;
    onClick?: (ev: React.MouseEvent) => void;
    onSubmenu?: (offset: Rect, onHide: () => void) => MenuObject;
    onValueChange?: (value: string) => void;
    onMoreOptions?: (e: React.MouseEvent) => void;
    onRemove?: () => void;
  };
export type MenuObject = {
  hide: (suppress?: boolean) => void;
  update: (props: any) => void;
};
