type AutoObject = { [key: string]: any, isAutoObject?: boolean };
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

export function applyFunctionToObject(object: {[key: string]: string}, func: (s: string) => string) {
    const newObject: {[key: string]: string} = {};

    for (const key in object) {
        if (Object.prototype.hasOwnProperty.call(object, key)) {
            newObject[key] = func(object[key]);
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