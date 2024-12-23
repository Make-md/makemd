import { i18n } from "makemd-core";


type LayoutType = {
  name: string;
  icon: string;
  view: string;
  listView: string;
  listGroup: string;
  listItem: string;
};

export const defaultViewTypes: Record<string, LayoutType> = {
  table: {
    name: i18n.menu.tableView,
    icon: 'ui//table',
    view: 'table',
    listView: '',
    listGroup: '',
    listItem: '',
  },
  day: {
    name: 'Day View',
    icon: 'ui//calendar',
    view: 'day',
    listView: '',
    listGroup: '',
    listItem: '',
  },
  week: {
    name: 'Week View',
    icon: 'ui//calendar',
    view: 'week',
    listView: '',
    listGroup: '',
    listItem: '',
  },
  month: {
    name: 'Month View',
    icon: 'ui//calendar',
    view: 'month',
    listView: '',
    listGroup: '',
    listItem: '',
  },
  list: {
    name: i18n.menu.listView,
    icon: 'ui//list',
    view: 'list',
    listView: 'spaces://$kit/#*listView',
    listGroup: 'spaces://$kit/#*listGroup',
    listItem: 'spaces://$kit/#*rowItem',
  },
  details: {
    name: i18n.menu.detailsView,
    icon: 'ui//layout-grid',
    view: 'list',
    listView: 'spaces://$kit/#*listView',
    listGroup: 'spaces://$kit/#*listGroup',
    listItem: 'spaces://$kit/#*detailItem',
  },
  board: {
    name: i18n.menu.boardView,
    icon: 'ui//square-kanban',
    view: 'list',
    listView: 'spaces://$kit/#*columnView',
    listGroup: 'spaces://$kit/#*columnGroup',
    listItem: 'spaces://$kit/#*cardListItem',
  },
  tasks: {
    name: 'Checklist',
    icon: 'ui//square-kanban',
    view: 'list',
    listView: 'spaces://$kit/#*listView',
    listGroup: 'spaces://$kit/#*taskGroup',
    listItem: 'spaces://$kit/#*taskListItem',
  },
  cards: {
    name: i18n.menu.cardView,
    icon: 'ui//layout-dashboard',
    view: 'list',
    listView: 'spaces://$kit/#*listView',
    listGroup: 'spaces://$kit/#*gridGroup',
    listItem: 'spaces://$kit/#*cardsListItem',
  },
  catalog: {
    name: i18n.menu.catalogView,
    icon: 'ui//gallery-horizontal-end',
    view: 'list',
    listView: 'spaces://$kit/#*listView',
    listGroup: 'spaces://$kit/#*rowGroup',
    listItem: 'spaces://$kit/#*coverListItem',
  },
  gallery: {
    name: i18n.menu.galleryView,
    icon: 'ui//layout-dashboard',
    view: 'list',
    listView: 'spaces://$kit/#*listView',
    listGroup: 'spaces://$kit/#*masonryGroup',
    listItem: 'spaces://$kit/#*imageListItem',
  },
  flow: {
    name: i18n.menu.flowView,
    icon: 'ui//edit',
    view: 'list',
    listView: 'spaces://$kit/#*listView',
    listGroup: 'spaces://$kit/#*listGroup',
    listItem: 'spaces://$kit/#*flowListItem',
  },
  // calendar: {
  //   name: i18n.menu.calendarView,
  //   icon: "ui//calendar",
  //   view: "list",
  //   listView: "spaces://$kit/#*calendarView",
  //   listGroup: "spaces://$kit/#*dateGroup",
  //   listItem: "spaces://$kit/#*eventItem",
  // },
  // calendarDay: {
  //   name: i18n.menu.dayView,
  //   icon: "ui//calendar",
  //   view: "list",
  //   listView: "spaces://$kit/#*calendarView",
  //   listGroup: "spaces://$kit/#*dateGroup",
  //   listItem: "spaces://$kit/#*eventItem",
  // },
};
