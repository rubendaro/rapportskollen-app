module.exports = function withCookiesConfig(config) {
  return {
    ...config,
    ios: {
      ...config.ios,
      infoPlist: {
        ...(config.ios?.infoPlist || {}),
        HTTPCookiesAcceptPolicy: "always",
        HTTPCookieStorageAcceptPolicy: "always"
      }
    }
  };
};
