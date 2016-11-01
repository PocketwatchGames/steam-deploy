# Steam-Deploy

Steam-Deploy is a Node module and CLI for easily deploying content to Steam using the Steamworks SDK. Define any number of build output directories and Steam-Deploy will copy files to your Steamworks SDK content directory and initiate a deployment.

Steam-Deploy can be used with other Node modules allowing you to easily create a build pipeline. Used internally by Pocketwatch Games in conjunction with our friendly [Hubot](https://hubot.github.com).

## Installation and Configuration
In addition to your own copy of the Steamworks SDK (not provided), Steam-Deploy requires [Node](http://nodejs.org) and npm. Grab the latest version with
```
git clone https://github.com/pocketwatchgames/steam-deploy.git
```

Or via NPM
```
npm install --save steam-deploy
```

### Configuration
Steam-Deploy requires you to edit [config.json](https://github.com/PocketwatchGames/steam-deploy/blob/master/config.json) to tell it where to find your build directories and Steamworks SDK. Steam-Deploy can operate on more than one build target by adding more entries to the `builds` array.

```json
"builds": [
    {
      "name": "Windows",
      "depot_id": "0001",
      "vdf_filename": "Windows.vdf",
      "relative_build_dir": "/bin/Windows/Release",
      "exclude_pattern": ".*.pdb"
    },
    {
      "name": "OSX",
      "depot_id": "0002",
      "vdf_filename": "OSX.vdf",
      "relative_build_dir": "/bin/OSX/Release",
      "exclude_pattern": "(.DS_Store|.*.pdb)"
    }
  ]
```

`exclude_pattern` is a Javascript regular expression that can be used to filter out files you don't want included in your Steam deployment.

## Usage
Steam-Deploy can be used via the command line for easy deployment from your development machine
```
node steamupload.js [options]
```

### Command Line options
* `-d --desc` - Provide a description for the build that will be uploaded with the build and visible on your build management page on the Steamworks backend.
* `-b --branch` - Provide a specific branch for Steam-Deploy to set the build live under. Note that deployment will fail if the branch does not exist on your Steamworks backend, or if the branch is `default`.
* `-h --help` - Display command line help.

ex.
```
node steamupload.js -b "alpha" -d "my description"
```

If not specified, Steam-Deploy will upload with no branch and the description "Uploaded with steam-deploy.js".

### Scripting
Require Steam-Deploy and instantiate a new instance to get started
```javascript
var SteamDeploy = require('steam-deploy');
var steam = new SteamDeploy();

branch = "alpha";
desc = "Uploaded with Steam-Deploy!";

steam.on('success', function () {
  console.log("Done!");
  });
steam.on('failure', function(err) {
  console.log("Error! " + err);
  });
steam.on('message', function(msg) {
  console.log(msg);
  });

steam.deploy(desc, branch);
```

Steam-Deploy emits three events for scripting purposes:
* `success` - Indicates the deployment was successfully recieved by the Steam backend.
* `failure` - Indicates something went wrong, calls back with an error message from steamcmd.exe.
* `message` - Provides progress messages.

## Contributing
Feel free to send us an e-mail at `support@pocketwatchgames.com` or report issues via GitHub.  Original work on steam-deploy was done by Alex Ferbrache: twitter.com/AlexFerbrache
