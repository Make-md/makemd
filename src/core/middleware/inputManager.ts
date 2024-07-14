

export class InputManager {
  private events: { [key: string]: Function[] } = {};
  constructor() {
    this.addListeners();
  }

  on(eventName: string, listener: Function) {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }

    this.events[eventName].push(listener);
  }

  off(eventName: string, listener: Function) {
    const listeners = this.events[eventName];
    if (listeners) {
      this.events[eventName] = listeners.filter(l => l !== listener);
    }
  }
  
  emit(eventName: string, data: any) {
    const listeners = this.events[eventName];
    if (listeners) {
      let propagate = false;
      listeners.slice().reverse().forEach(listener => {
        if (propagate) return;
        propagate = listener(data)
      });
    }
  }

  addListeners() {
    window.addEventListener('mousedown', this.handleMouseEvent, true);
    window.addEventListener('click', this.handleMouseEvent, true);
    window.addEventListener('contextmenu', this.handleMouseEvent, true);
    window.addEventListener('keydown', this.handleKeyEvent);
    window.addEventListener('keyup', this.handleKeyEvent);
  }

  removeListeners() {
    window.removeEventListener('mousedown', this.handleMouseEvent);
    window.removeEventListener('click', this.handleMouseEvent);
    window.removeEventListener('contextmenu', this.handleMouseEvent);
    window.removeEventListener('keydown', this.handleKeyEvent);
    window.removeEventListener('keyup', this.handleKeyEvent);
  }
  handleMouseEvent = (event: MouseEvent) => {
    this.emit(event.type, event);
  }

  handleKeyEvent = (event: KeyboardEvent) => {
    this.emit(event.type, event);
  }

}