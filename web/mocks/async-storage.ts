const AsyncStorage = {
  getItem: async (key: string): Promise<string | null> => {
    return localStorage.getItem(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    localStorage.setItem(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    localStorage.removeItem(key);
  },
  multiRemove: async (keys: string[]): Promise<void> => {
    keys.forEach((key) => localStorage.removeItem(key));
  },
  clear: async (): Promise<void> => {
    localStorage.clear();
  },
};

export default AsyncStorage;
