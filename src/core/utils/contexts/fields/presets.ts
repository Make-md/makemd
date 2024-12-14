import { ObjectType } from 'core/react/components/SpaceView/Contexts/DataTypeView/ObjectCell';
import { SpaceProperty } from 'types/mdb';

const repeatType: ObjectType = {
  freq: {
    label: 'Frequency',
    type: 'option',
    value: {
      options: [
        { name: 'Yearly', value: 'YEARLY' },
        { name: 'Monthly', value: 'MONTHLY' },
        { name: 'Weekly', value: 'WEEKLY' },
        { name: 'Daily', value: 'DAILY' },
        { name: 'Hourly', value: 'HOURLY' },
        { name: 'Minutely', value: 'MINUTELY' },
        { name: 'Secondly', value: 'SECONDLY' },
      ],
    },
  },
  until: {
    label: 'Until',
    type: 'date',
  },
  interval: {
    label: 'Interval',
    type: 'number',
  },
  count: {
    label: 'Count',
    type: 'number',
  },
  wkst: {
    label: 'Week Start',
    type: 'option',
    value: {
      options: [
        { name: 'Monday', value: 'MO' },
        { name: 'Tuesday', value: 'TU' },
        { name: 'Wednesday', value: 'WE' },
        { name: 'Thursday', value: 'TH' },
        { name: 'Friday', value: 'FR' },
        { name: 'Saturday', value: 'SA' },
        { name: 'Sunday', value: 'SU' },
      ],
    },
  },
  byweekday: {
    label: 'By Weekday',
    type: 'option-multi',
    value: {
        alias: 'Repeat Event',
      options: [
        { name: 'Monday', value: 'MO' },
        { name: 'Tuesday', value: 'TU' },
        { name: 'Wednesday', value: 'WE' },
        { name: 'Thursday', value: 'TH' },
        { name: 'Friday', value: 'FR' },
        { name: 'Saturday', value: 'SA' },
        { name: 'Sunday', value: 'SU' },
      ],
    },
  },
};

export const RepeatTemplate: SpaceProperty = {
  name: 'repeat',
  type: 'object',
  value: JSON.stringify({
    typeName: 'Repeat',
    type: repeatType,
  }),
};
