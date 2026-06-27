const VersionCheck = {
  getCurrentVersion: () => {
    return "3.0.0";
  },
  needUpdate: async () => {
    return { isNeeded: false };
  },
};

export default VersionCheck;
