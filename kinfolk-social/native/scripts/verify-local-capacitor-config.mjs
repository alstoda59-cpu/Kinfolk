// Prevent a packaged mobile alpha from silently loading remote web content.
// Only bundled assets may be used for the Capacitor entry point.
export function verifyLocalCapacitorConfig(config) {
  if (!config || typeof config !== 'object' || Array.isArray(config)) throw new Error('Capacitor config must be an object');
  if (config.webDir !== 'www') throw new Error('Capacitor must use the locally verified www assets');
  if (typeof config.appId !== 'string' || !/^[A-Za-z][A-Za-z0-9_]*(?:\.[A-Za-z][A-Za-z0-9_]*)+$/.test(config.appId)) throw new Error('Capacitor appId is invalid');
  if (config.server && (typeof config.server !== 'object' || Array.isArray(config.server))) throw new Error('Capacitor server settings are invalid');
  if (config.server && Object.hasOwn(config.server,'url')) throw new Error('Remote server.url is forbidden for the offline-bundled alpha');
  if (config.server && Object.hasOwn(config.server,'cleartext')) throw new Error('Cleartext server override is forbidden for the alpha');
  if (config.server?.androidScheme && config.server.androidScheme !== 'https') throw new Error('Android must use the HTTPS local scheme');
  return true;
}
