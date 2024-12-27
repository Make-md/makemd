export interface EventTypeToPayload {
    [eventType: string]: any;
}

type EventListener<T> = (event: T) => void | Promise<void>;

interface Listener<T> {
    callback: EventListener<T>;
    priority: number;
    once: boolean;
    context?: any;
}


export class EventDispatcher<T extends EventTypeToPayload> {
    private listeners: Map<keyof T, Listener<T[keyof T]>[]>;

    constructor() {
        this.listeners = new Map();
    }

    addListener<K extends keyof T>(eventType: K, listener: EventListener<T[K]>, priority = 0, context?: any): void {
        const newListener: Listener<T[K]> = { callback: listener, priority, once: false, context };
        const listeners = this.listeners.get(eventType) || [];
        listeners.push(newListener);
        listeners.sort((a, b) => b.priority - a.priority);
        this.listeners.set(eventType, listeners);
    }

    addOnceListener<K extends keyof T>(eventType: K, listener: EventListener<T[K]>, priority = 0, context?: any): void {
        const newListener: Listener<T[K]> = { callback: listener, priority, once: true, context };
        const listeners = this.listeners.get(eventType) || [];
        listeners.push(newListener);
        listeners.sort((a, b) => b.priority - a.priority);
        this.listeners.set(eventType, listeners);
    }

    removeListener<K extends keyof T>(eventType: K, listener: EventListener<T[K]>): void {
        const listeners = this.listeners.get(eventType);
        if (listeners) {
            this.listeners.set(eventType, listeners.filter(l => l.callback !== listener));
        }
    }

    async dispatchEvent<K extends keyof T>(eventType: K, event: T[K]): Promise<void> {
        const listeners = this.listeners.get(eventType);
        if (listeners) {
            for (const listener of listeners) {
                try {
                    await listener.callback.call(listener.context, event);
                } catch (error) {
                    console.error(`Error in listener for event '${String(eventType)}':`, error);
                }

                if (listener.once) {
                    this.removeListener(eventType, listener.callback);
                }
            }
        }
    }
}
