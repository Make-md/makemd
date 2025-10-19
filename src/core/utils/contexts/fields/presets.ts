import i18n from "shared/i18n";

import { ObjectType } from 'core/react/components/SpaceView/Contexts/DataTypeView/ObjectCell';
import { SpaceProperty } from 'shared/types/mdb';

const repeatType: ObjectType = {
  freq: {
    label: i18n.labels.frequency,
    type: 'option',
    value: {
      required: true,
      options: [
        { name: i18n.labels.yearly, value: 'YEARLY' },
        { name: i18n.labels.monthly, value: 'MONTHLY' },
        { name: i18n.labels.weekly, value: 'WEEKLY' },
        { name: i18n.labels.daily, value: 'DAILY' },
        { name: i18n.labels.hourly, value: 'HOURLY' },
        { name: i18n.labels.minutely, value: 'MINUTELY' },
        { name: i18n.labels.secondly, value: 'SECONDLY' },
      ],
    },
  },
  until: {
    label: i18n.labels.until,
    type: 'date',
    value: {
      required: true,
    }
  },
  interval: {
    label: i18n.labels.interval,
    type: 'number',
  },
  count: {
    label: i18n.aggregates.count,
    type: 'number',
  },
  wkst: {
    label: 'Week Start',
    type: 'option',
    value: {
      options: [
        { name: i18n.labels.monday, value: 'MO' },
        { name: i18n.labels.tuesday, value: 'TU' },
        { name: i18n.labels.wednesday, value: 'WE' },
        { name: i18n.labels.thursday, value: 'TH' },
        { name: i18n.labels.friday, value: 'FR' },
        { name: i18n.labels.saturday, value: 'SA' },
        { name: i18n.labels.sunday, value: 'SU' },
      ],
    },
  },
  byweekday: {
    label: 'By Weekday',
    type: 'option-multi',
    value: {
        alias: 'Repeat Event',
      options: [
        { name: i18n.labels.monday, value: 'MO' },
        { name: i18n.labels.tuesday, value: 'TU' },
        { name: i18n.labels.wednesday, value: 'WE' },
        { name: i18n.labels.thursday, value: 'TH' },
        { name: i18n.labels.friday, value: 'FR' },
        { name: i18n.labels.saturday, value: 'SA' },
        { name: i18n.labels.sunday, value: 'SU' },
      ],
    },
  },
};

export const RepeatTemplate: SpaceProperty = {
  name: i18n.labels.repeat,
  type: 'object',
  value: JSON.stringify({
    typeName: i18n.labels.repeat,
    type: repeatType,
  }),
};
