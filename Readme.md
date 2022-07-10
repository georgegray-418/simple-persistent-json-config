# Simple Persistent Json Config  

Simple Persistent Json Config is a utility to allow you to rapidly add persisted, user or system specific configurations to your project, simple config manages merging your provided default values with persisted and potentially modified values saved by a user on disk, simple config will also handle initializing on disk configuration files to the defaults provide if they are missing.

Simple config currently doesn't support arrays as there is no obvious strategy for merging them, while lots of potentially sensible approaches exist, all of them would add unnecessary configuration complexity to a very simple tool. 

```typescript

import Config from 'simple-persistent-json-config'


// ~/'.myconfig.json' doesn't exist.
// if no configFilePath is provided, we assume the users home directory. 
const myConfig = new Config({  myConfigValue: true, }, '.myconfig.json').getConfig();;

// myConfig == { myConfigValue: true }
// ~/'.myconfig.json' has been created and now contains { "myConfigValue": true }

```


in a less trivial example: 

the following file already exists `/opt/mysoftware/config.json`
```json
{
    "port" : 1234,
    "loggingConfiguration" : {
        "fileLogger" : {
            "level" : 10,
            "pattern" : "[${level}] ${date}: ${message}"
        }
    }
}
```

Running the following

```typescript

import Config from 'simple-persistent-json-config'

// ...
const defaultConfig = {
    port : 1234,
    globalLogLevel : 10,
    loggingConfiguration : {
        fileLogger : {
            level : 0,
            pattern : "${level}-${date}",
            type: "rotating"
        },
        newRemoteLogger : {
            level : 20,
            pattern : "${level}-${date}",
            type: "rotating"
        },
    }
}
const myConfig = new Config(defaultConfig, 'config.json', '/opt/mysoftware').getConfig();

```

would cause our  `/opt/mysoftware/config.json` to be updated with **only new** default values:

```json
{
    "port" : 1234,
    "globalLogLevel" : 10,
    "loggingConfiguration" : {
        "fileLogger" : {
            "level" : 10,
            "pattern" : "[${level}] ${date}: ${message}",
            "type": "rotating"
        },
        "newRemoteLogger" : {
            "level" : 20,
            "pattern" : "${level}-${date}",
            "type": "rotating"
        },
    }
}
```

Our in memory config will match the new state of the configuration file on disk.