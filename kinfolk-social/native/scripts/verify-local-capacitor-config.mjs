// Prevent a packaged mobile alpha from silently loading remote web content.
// Only bundled assets may be used for the Capacitor entry point.
export function verifyLocalCapacitorConfig(config) {
  if (!config || typeof config !== 'object' || Array.isArray(config)) throw new Error('Capacitor config must be an object');
  // Reject non-JSON-like objects before reading any fields. Inherited overrides
  // and accessor properties can otherwise evade Object.keys or execute code.
  for (const [name, value] of [['config', config], ['server', Object.getOwnPropertyDescriptor(config, 'server')?.value]]) {
    if (value === undefined) continue;
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Capacitor '+name+' settings are invalid');
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) throw new Error('Capacitor '+name+' must be a plain object');
    for (const key of Reflect.ownKeys(value)) {
      if (typeof key !== 'string') throw new Error('Capacitor '+name+' symbol keys are forbidden');
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || !Object.hasOwn(descriptor, 'value')) throw new Error('Capacitor '+name+' accessors are forbidden');
    }
  }
  if (config.webDir !== 'www') throw new Error('Capacitor must use the locally verified www assets');
  if (typeof config.appId !== 'string' || !/^[A-Za-z][A-Za-z0-9_]*(?:\.[A-Za-z][A-Za-z0-9_]*)+$/.test(config.appId)) throw new Error('Capacitor appId is invalid');
  if (config.server && (typeof config.server !== 'object' || Array.isArray(config.server))) throw new Error('Capacitor server settings are invalid');
  if (config.server && Object.hasOwn(config.server,'url')) throw new Error('Remote server.url is forbidden for the offline-bundled alpha');
  if (config.server && Object.hasOwn(config.server,'cleartext')) throw new Error('Cleartext server override is forbidden for the alpha');
  if (config.server?.androidScheme && config.server.androidScheme !== 'https') throw new Error('Android must use the HTTPS local scheme');
  // Only the reviewed local Android scheme is supported. Other server fields can
  // widen WebView navigation or change the origin without setting server.url.
  if (config.server) {
    for (const key of Object.keys(config.server)) {
      if (key !== 'androidScheme') throw new Error('Unreviewed Capacitor server setting is forbidden: '+key);
    }
  }
  return true;
}
