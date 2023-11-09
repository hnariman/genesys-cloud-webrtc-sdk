export const eventService = {
  eventListeners: new Map<string, ((event: CustomEvent) => void)[]>(),

  addEventListener(eventName: string, callback: (event: CustomEvent) => void) {
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, []);
    }
    this.eventListeners.get(eventName)?.push(callback);
  },

  dispatchEvent(eventName: string, eventData: any) {
    const event = new CustomEvent(eventName, { detail: eventData });
    if (this.eventListeners.has(eventName)) {
      this.eventListeners.get(eventName)?.forEach((callback) => {
        callback(event);
      });
    }
  },
};
