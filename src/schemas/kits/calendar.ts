import { frameRootWithProps, kitWithProps } from "core/utils/frames/frames";
import { i18n } from "makemd-core";
import { FrameRoot } from "shared/types/mframe";
import { contentNode, flowNode, groupNode, textNode } from "./base";
import { buttonNode } from "./ui";

export const eventItem: FrameRoot = {
    def: {
      id: 'eventItem',
        type: 'listItem'
    },
    node: {
      type: "group",
      id: "$root",
      schemaId: "$root",
      name: i18n.frames.event.label,
      rank: 0,
    },
    id: "$root",
    children: [
      frameRootWithProps(flowNode, {
        value: `$contexts.$context['_keyValue']`,
      }, 
      {
        padding: `'0'`,
        "--font-text-weight": `'bold'`,
      }),
    ],
  };

export const dateGroup: FrameRoot = {
    def: {
      id: 'dateGroup',
        type: 'listGroup'
    },
    node: {
      type: "group",
      props: {_groupValue: ""},
      styles: {
        layout: `'column'`,
        background: `'var(--mk-ui-background-variant)'`,
        padding:`'6px'`,
        height: `'150px'`,
        overflow: `'hidden'`,
        width: `'100%'`
      },
      id: "$root",
      schemaId: "$root",
      name: "Date",
      rank: 0,
        
    },
    id: "$root",
    children: [
      frameRootWithProps(textNode, {
        value: `$api.date.component($api.date.parse($root.props['_groupValue']), 'day')`,
      }, 
      {
        padding: `'4px'`,
        "--font-text-weight": `'bold'`,
        
      }),
      frameRootWithProps(
      contentNode,
      {
      },
      {
        gap: `'2px'`,
        layout: `'column'`,

      }
      )
    ],
  };

export const calendarView: FrameRoot = {
    def: {
      id: 'calendarView',
        type: 'listView'
    },
    node: {
      type: "group",
      props: {
        year: `$api.date.component($api.date.offset($api.date.now(), $root.props.offset, 'month'), 'year')`,
        month: `$api.date.component($api.date.offset($api.date.now(), $root.props.offset, 'month'), 'month')`,
        offset: `0`,
        startOfMonth: `$root.props.year+'-'+$root.props.month+'-01'`,
        endOfMonth: `$root.props.year+'-'+$root.props.month+'-'+$api.date.daysInMonth($api.date.parse($root.props.startOfMonth))`,
        dayOfWeek: `$api.date.component($api.date.parse($root.props.startOfMonth), 'dayOfWeek')`,
        groupFilter: `'isSameDate'`,
        groupOptions: `$api.date.range($api.date.parse($root.props.startOfMonth), $api.date.parse($root.props.endOfMonth))`,

      },
      id: "$root",
      schemaId: "$root",
      name: i18n.frames.calendar.label,
      rank: 0,
    },
    id: "$root",
    children: [
        frameRootWithProps({...groupNode, children: [
            frameRootWithProps({...groupNode, children: 
                [frameRootWithProps(textNode, {
                    value: `$api.date.format($api.date.parse($root.props.startOfMonth), 'MMMM')`,
                    }, {
                        padding: `'8px'`,
                        "--font-text-weight": `'bold'`,
                        "sem": `'h1'`
                    }),
                    frameRootWithProps({...groupNode, children: [
                    kitWithProps(buttonNode, {
                        icon: `'ui//chevron-left'`,
                    }, {}, {
                        onClick: `$saveState({$root: {props: {offset: $root.props.offset - 1}}})`,
                    }),
                    kitWithProps(buttonNode, {
                        label: `'Today'`,
                    }, {}, {
                        onClick: `$saveState({$root: {props: {offset: 0}}})`,
                    }),
                    kitWithProps(buttonNode, {
                        icon: `'ui//chevron-right'`,
                    }, {}, {
                        onClick: `$saveState({$root: {props: {offset: $root.props.offset + 1}}})`,
                    })]}, {}, { layout: `'row'`})
                ]}, 
                {},
                {
                  width: `'100%'`,
                }),
        ]},
            {})
        , 
        frameRootWithProps({...groupNode, 
        children: [
            frameRootWithProps(textNode, {
                value: `'Sunday'`
            }, {
                padding: `'8px'`,
                "--font-text-weight": `'bold'`,
            }),
            frameRootWithProps(textNode, {
                value: `'Monday'`
            }, {
                padding: `'8px'`,
                "--font-text-weight": `'bold'`,
            }),
            frameRootWithProps(textNode, {
                value: `'Tuesday'`
            }, {
                padding: `'8px'`,
                "--font-text-weight": `'bold'`,
            }),
            frameRootWithProps(textNode, {
                value: `'Wednesday'`
            }, {
                padding: `'8px'`,
                "--font-text-weight": `'bold'`,
            }),
            frameRootWithProps(textNode, {
                value: `'Thursday'`
            }, {
                padding: `'8px'`,
                "--font-text-weight": `'bold'`,
            }),
            frameRootWithProps(textNode, {
                value: `'Friday'`
            }, {
                padding: `'8px'`,
                "--font-text-weight": `'bold'`,
            }),
            frameRootWithProps(textNode, {
                value: `'Saturday'`
            }, {
                padding: `'8px'`,
                "--font-text-weight": `'bold'`,
            }),
            
            
        ]}, 
            {},
            {
                width: `'100%'`,
                height: `'auto'`,
                layout: `'grid'`,
                
                "--mk-grid-columns": `'7'`,
                "--mk-grid-width": `'0'`,
            }),
      
      frameRootWithProps({...contentNode, children: [
        frameRootWithProps(groupNode, 
            {},
            {
              gridColumn: `'span '+$root.props.dayOfWeek`,
            }),
      ]},{},
      {
        padding: `'8px'`,
        layout: `'grid'`,
        "--mk-grid-columns": `'7'`,
        "--mk-grid-width": `'0'`,
        gap: `'1px'`,
      }),
    ],
  }