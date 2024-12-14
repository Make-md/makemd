import { useDraggable } from '@dnd-kit/core';
import { PathCrumb } from 'core/react/components/UI/Crumbs/PathCrumb';
import { PathPropertyName } from 'core/types/context';
import { Superstate } from 'makemd-core';
import React from 'react';
import { DBRow } from 'types/mdb';

export const AllDayItem = (props: {
  superstate: Superstate;
  data: DBRow;
  index: number;
  startDay: number;
  endDay: number;
  topOffset: number;
  style?: React.CSSProperties;
}) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: 'event-' + props.index,
    data: {
      type: 'event',
      index: props.index,
    },
  });
  return (
    <div
      className="mk-week-event"
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        ...props.style,
        left: '2px',
        width: `calc(${(props.endDay - props.startDay + 1) * 100}% - 4px)`,
        top: `${props.topOffset * 22 + 2}px`,
      }}
    >
      <PathCrumb
        superstate={props.superstate}
        path={props.data[PathPropertyName]}
      />
    </div>
  );
};
