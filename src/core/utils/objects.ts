import _ from "lodash";

type AutoObject = { [key: string]: any, isAutoObject?: boolean };

export function deepOmit(obj: {[key: string]: any}, keysToOmit: string | string[]): {[key: string]: any} {
    const keysToOmitIndex = _.keyBy(Array.isArray(keysToOmit) ? keysToOmit : [keysToOmit]);
  
    function omitFromObject(obj: {[key: string]: any}): {[key: string]: any} {
      return _.transform(obj, function(result: {[key: string]: any}, value: any, key: string) {
        if (key in keysToOmitIndex) {
          return;
        }
  
        result[key] = _.isObject(value) ? omitFromObject(value) : value;
      });
    }
    
    return omitFromObject(obj);
  }

export function createAutoObject(obj: object | null = null): AutoObject {
    const handler: ProxyHandler<AutoObject> = {
        get(target, prop: string | symbol) {
            if (typeof prop === 'string' && prop in target) {
                return target[prop];
            }
            
            const autoObject = createAutoObject();
            target[<string>prop] = autoObject;
            return autoObject;
        },

        set(target, prop: string | symbol, value: any): boolean {
            if (value && typeof value === 'object' && !value.isAutoObject) {
                value = createAutoObject(value);
            }
            target[<string>prop] = value;
            return true;
        }
    };

    const proxy = new Proxy({ ...obj, isAutoObject: true }, handler);
    return proxy;
}

export const arrayToObject = (array: {[key: string]: any}[], key: string) => array.reduce((p,c) => ({...p, [c[key]]: c}) , {})

export const renameKey = (object: {[key: string]: any}, oldKey: string, newKey: string) => {
    if (!object) return;
    if (oldKey !== newKey && Object.prototype.hasOwnProperty.call(object, oldKey)) {
        Object.defineProperty(object, newKey,
            Object.getOwnPropertyDescriptor(object, oldKey));
        delete object[oldKey];
    }
}

export const removeKey = (object: {[key: string]: any}, key: string) =>{
    delete object[key]
return object;
}
export const replaceKeys = (object1: {[key: string]: any}, object2: {[key: string]: string}) => {
    // Create a new empty object to hold the result
    const newObject : {[key: string]: any} = {};
    
    // Iterate over all keys in object1
    for (const key in object1) {
        // If the key exists in object2, use its corresponding value as the new key
        // Otherwise, just use the original key
        const newKey = Object.prototype.hasOwnProperty.call(object2, key) ? object2[key] : key;

        // Assign the value from object1 to the new key in the new object
        newObject[newKey] = object1[key];
    }
    
    // Return the newly created object
    return newObject;
}

export function applyFunctionToObject(object: {[key: string]: any}, func: (s: any, key: string) => any) {
    const newObject: {[key: string]: any} = {};

    for (const key in object) {
        if (Object.prototype.hasOwnProperty.call(object, key)) {
            newObject[key] = func(object[key], key);
        }
    }

    return newObject;
}


export const replaceKeysByValue = (object1: {[key: string]: any}, object2: {[key: string]: string}) => {
    // Create a new empty object to hold the result
    const reversedObject2 :{ [key: string]: string }= {};
    for (const key in object2) {
        reversedObject2[object2[key]] = key;
    }
    return replaceKeys(object1, reversedObject2);
}