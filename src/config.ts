import os from 'os';
import path from 'path';
import fs from 'fs';

/**
 * Utility to manage disk persisted json configuration. 
 * Provide the default configuration and a filename / path and a configuration file will
 * be saved or updated with the defaults provided, if values are already present, those values are
 * loaded into this instance.
 */
export default class Config<ConfigData> {
  private initialized = false;
  private readonly configPath: string;
  private config: ConfigData

  /**
   * 
   * @param defaultConfig The default configuration object, these values will be used unless the on disk config file has overwritten them 
   * Note: As the default configs are persisted on every run, old defaults will present as user overrides if this config blob is changed, 
   * if you need ot update configs, consider incrementing the configFileName or using a more complex tool. 
   * @param configFileName The name of the file on disk to store the configuration.
   * @param configFilePath The path of the configuration file on disk, this defaults the the users home directory if not provided.
   */
  constructor(defaultConfig: ConfigData, configFileName: string, configFilePath: string = os.homedir()) {
    this.config = Object.assign(Object.create(null), defaultConfig);
    this.configPath = path.join(configFilePath, configFileName);
  }

  /**
   * Synchronies the default values with the on disk configuration file,
   * If the on disk configuration file is missing default members they will be inserted and persisted.
   */
  public init(): void {
    if (this.initialized) return;
    // Ensure config file exists
    if (!fs.existsSync(this.configPath)) {
      fs.writeFileSync(this.configPath, '');
    }

    // Read properties
    const confFileData = fs.readFileSync(this.configPath);
    let props = JSON.parse(confFileData.toString() || '{}');
    props = Object.assign(Object.create(null), props);
    // Load values into this.configData or save defaults into
    // the properties file if they are missing.
    this.loadConfig(props);

    // Only persist if we've change the underlying file
    fs.writeFileSync(this.configPath, JSON.stringify(props, null, 2));
    this.initialized = true;
  }

  /**
   * gets the config object.
   * @returns 
   */
  public getConfig(): ConfigData {
    this.init();
    return JSON.parse(JSON.stringify(this.config));
  }

  /**
   * Recursively iterate through all the keys in the defaultConfig object, and compare them to the onDisk config file.
   * if the onDisk config is missing a value form the defaultConfig, it will be added to the onDisk config.
   * if the onDisk config has a value for one of the keys in the defaultConfig, it will overate the default value in this.config.
   * @param propsValues the onDisk json object
   */
  private loadConfig(propsValues: ConfigData, path: string[] = []): void {
    const thing = this.getValueFromPath(this.config, [...path]);
    if (Array.isArray(thing)) throw new Error('Arrays not supported in configuration');
    if (typeof thing === 'object') {
      for (let key in thing) {
        path.push(key);
        this.loadConfig(propsValues, [...path]);
        path.pop();
      }
    } else {
      let propValueThing = this.getValueFromPath(propsValues, [...path]);
      if (propValueThing === undefined) {
        this.setValueFromPath(propsValues, [...path], thing);
      } else {
        this.setValueFromPath(this.config, [...path], propValueThing);
      }
    }
  }

  /**
   * for a given path string like `one.two.three` return the value at that address:
   * ```
   * getValueFromPath({ one : { two : { three : "ABC"}}}, ['one','two'])
   * // would return {three : "ABC"}
   * getValueFromPath({ one : { two : { three : "ABC"}}}, ['one','two','three'])
   * // would return "ABC"
   * getValueFromPath({ one : { two : { three : "ABC"}}}, ['one','two','three','whatever'])
   * // would return undefined
   * ```
   * @param thing the object to retrieve the value form
   * @param path the path of the value to retrieve
   * @returns 
   */
  private getValueFromPath(thing: any, path: string[]): any {
    if (!path.length) return thing;
    if (!thing) return undefined;
    const next = path.shift();
    return this.getValueFromPath(thing[next!], path);
  }

  /**
   * for a given path, as in {@link getValueFromPath}, set the value in the provided object.
   * @param thing the object to set the value on
   * @param path the path of the value to set
   * @param setThing the value of the value to set.
   * @returns 
   */
  private setValueFromPath(thing: any, path: string[], setThing: any): void {
    if (!path.length) return;
    const next = path.shift();
    if (!path.length) {
      thing[next!] = setThing;
      return;
    }
    if (!thing[next!]) thing[next!] = {};
    return this.setValueFromPath(thing[next!], path, setThing);
  }
}

console.log(new Config({eh:123}, '.test').getConfig());
