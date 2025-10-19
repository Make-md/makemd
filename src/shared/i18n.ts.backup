import { en } from "./en";

class I18nLoader {
  private strings: Record<string, any>;
  private overrides: Record<string, any> = {};

  constructor() {
    this.strings = this.loadDefaultStrings();
  }

  private loadDefaultStrings() {
    return {
    en: en
    };
  }

  public getStrings() {
    // Apply overrides on top of default strings
    const applyOverrides = (base: any, overrides: Record<string, any>): any => {
      const result = { ...base };
      
      for (const [key, value] of Object.entries(overrides)) {
        const keys = key.split('.');
        let current = result;
        
        for (let i = 0; i < keys.length - 1; i++) {
          if (!current[keys[i]]) {
            current[keys[i]] = {};
          }
          current = current[keys[i]];
        }
        
        current[keys[keys.length - 1]] = value;
      }
      
      return result;
    };
    
    return applyOverrides(this.strings.en, this.overrides);
  }

  public loadCustomStrings(customStrings: Record<string, any>): void {
    this.overrides = customStrings;
  }

  public setOverridesFromFile(overrides: Record<string, any>): void {
    this.overrides = overrides || {};
  }
}

const i18nLoader = new I18nLoader();

export { i18nLoader };

// Create a proxy that always returns the current strings
const i18nProxy = new Proxy({}, {
  get(_target, prop, receiver) {
    return Reflect.get(i18nLoader.getStrings(), prop, receiver);
  },
  ownKeys(_target) {
    return Reflect.ownKeys(i18nLoader.getStrings());
  },
  getOwnPropertyDescriptor(_target, prop) {
    return Reflect.getOwnPropertyDescriptor(i18nLoader.getStrings(), prop);
  }
});

// Type definition for i18n strings
type I18nStrings = {
  hintText: Record<string, string>;
  defaults: Record<string, string>;
  commands: Record<string, string>;
  styles: Record<string, string>;
  commandsSuggest: Record<string, string>;
  commandPalette: Record<string, string>;
  frames: {
    sections: Record<string, string>;
    label: Record<string, string>;
    note: Record<string, string>;
    table: Record<string, string>;
    context: Record<string, string>;
    calendar: Record<string, string>;
    field: Record<string, string>;
    event: Record<string, string>;
    divider: Record<string, string>;
    button: Record<string, string>;
    callout: Record<string, string>;
    toggle: Record<string, string>;
  };
  menu: {
    barChart: string;
    lineChart: string;
    scatterPlot: string;
    pieChart: string;
    areaChart: string;
    radarChart: string;
    space: string;
    list: string;
    category: string;
    values: string;
    xAxisField: string;
    yAxisFields: string;
    selectDataSource: string;
    selectSpace: string;
    selectCategoryField: string;
    selectXAxisField: string;
    selectValueFields: string;
    selectYAxisFields: string;
    legend: string;
    hidden: string;
    hideLegend: string;
    showLegend: string;
    legendPosition: string;
    orientation: string;
    horizontal: string;
    vertical: string;
    legendTop: string;
    legendBottom: string;
    legendLeft: string;
    legendRight: string;
    colorPalette: string;
    defaultPalette: string;
    axisLabels: string;
    groupBy: string;
    aggregate: string;
    count: string;
    sum: string;
    average: string;
    min: string;
    max: string;
    distinct: string;
    [key: string]: string;
  };
  editor: Record<string, string>;
  buttons: Record<string, string>;
  metadataTypes: Record<string, string>;
  filterTypes: Record<string, string>;
  aggregateTypes: Record<string, string>;
  sortTypes: Record<string, string>;
  properties: Record<string, any>;
  views: Record<string, string>;
  labels: {
    visualization?: {
      loadingVisualization: string;
      failedToLoad: string;
      frameId: string;
      none: string;
      path: string;
      loadingData: string;
      configurationNotLoaded: string;
      configureYourVisualization: string;
      selectDataSource: string;
    };
    [key: string]: any;
  };
  descriptions: Record<string, string>;
  flowView: Record<string, string>;
  notice: Record<string, string>;
  colors: Record<string, string>;
  timeUnits: Record<string, string>;
  aggregates: Record<string, string>;
  fieldTypes: Record<string, string>;
  settings: Record<string, any>;
  calendar?: {
    frequency?: Record<string, string>;
  };
  formulas: Record<string, string>;
  units?: Record<string, string>;
  time?: Record<string, string>;
};

export default i18nProxy as I18nStrings;
