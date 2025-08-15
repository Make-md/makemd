import { SpaceProperty } from "../../shared/types/mdb";

export const visualizationConfigSchemaID = 'visualizationConfig';

export const visualizationConfigFields: SpaceProperty[] = [
  {
    name: 'chartType',
    schemaId: visualizationConfigSchemaID,
    type: 'option',
    value: 'bar,line,scatter,pie,area,heatmap,radar',
  },
  {
    name: 'dataSource',
    schemaId: visualizationConfigSchemaID,
    type: 'context',
  },
  {
    name: 'xField',
    schemaId: visualizationConfigSchemaID,
    type: 'option',
    value: '$properties',
  },
  {
    name: 'yField',
    schemaId: visualizationConfigSchemaID,
    type: 'option',
    value: '$properties',
  },
  {
    name: 'colorField',
    schemaId: visualizationConfigSchemaID,
    type: 'option',
    value: '$properties',
  },
  {
    name: 'sizeField',
    schemaId: visualizationConfigSchemaID,
    type: 'option',
    value: '$properties',
  },
  {
    name: 'title',
    schemaId: visualizationConfigSchemaID,
    type: 'text',
  },
  {
    name: 'showTitle',
    schemaId: visualizationConfigSchemaID,
    type: 'boolean',
  },
  {
    name: 'showAxes',
    schemaId: visualizationConfigSchemaID,
    type: 'boolean',
  },
  {
    name: 'showLegend',
    schemaId: visualizationConfigSchemaID,
    type: 'boolean',
  },
];