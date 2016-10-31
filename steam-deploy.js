var fs = require('fs');
var path = require('path');
var wrench = require('wrench');
var exec = require('child_process').exec;
var config = require('./config.json');
var EventEmitter = require("events").EventEmitter;
var util = require('util');
var program = require("commander");

function Steampipe() {
    EventEmitter.call(this);
}

util.inherits(Steampipe, EventEmitter);

Steampipe.prototype.deploy = function(description, steam_branch) {
  console.log("Getting Ready...");
  this.emit("message", "Copying build files");
  copy_project_files(description, steam_branch, config.builds.slice(), this, post_file_copy);
};

function copy_project_files(description, steam_branch, builds, instance, callback) {
  console.log("Copying project files for " + builds.length + " projects");
  var build = builds.pop();
  var build_path = path.join(config.project_root, build.relative_build_dir);
  var output_path = path.join(config.steamworks_sdk_path, config.relative_contentroot_dir, build.name);
  instance.emit("message", "Copying files for: `" + build.name + '`');

  var self = this;
  if(fs.existsSync(output_path)) {
    wrench.rmdirRecursive(output_path, false, function(err){
      if(err) {
        console.log(err);
        instance.emit('failure', err.toString());
        return;
      }

      wrench.mkdirSyncRecursive(output_path);

      wrench.copyDirRecursive(build_path, output_path, {
        forceDelete: true,
        exclude: new RegExp(build.exclude_pattern)
      }, function(err) {
        if(err)
          console.log(err);

        if(!builds.length)
          callback(description, steam_branch, instance, err);
        else
          copy_project_files(description, steam_branch, builds, instance, callback);
      });
    });
  } else {
    wrench.mkdirSyncRecursive(output_path);

    wrench.copyDirRecursive(build_path, output_path, {
      forceDelete: true,
      exclude: new RegExp(build.exclude_pattern)
    }, function(err) {
      if(err) {
        console.log(err);
        instance.emit('failure', err.toString());
        return;
      }

      if(!builds.length)
        callback(description, steam_branch, instance, err);
      else
        copy_project_files(description, steam_branch, builds, instance, callback);
    });
  }
}

function post_file_copy(description, steam_branch, instance, error) {
  if (error) {
    // Something went wrong during the copy, or there was a bad filename
    console.error('Failure occurred trying to copy build files.');
    instance.emit('failure', stdout, stderr);
    return;
  }

  create_appbuild(description, steam_branch);
  var cmd = get_steamworks_command();
  console.log("Uploading to Steamworks");
  instance.emit('message', "Beginning Steamworks upload");
  exec(cmd, {maxBuffer: 1024 * 1024}, function (err, stdout, stderr) {
    if(err) {
      console.log("OUT:\n" + stdout + " ERR: " + err);
      instance.emit("failure", stdout, stderr);
    } else {
      console.log("DONE!");
      instance.emit("success");
    }
  });
}

function create_appbuild(description, steam_branch) {
  console.log("Creating app manifest");
  var manifest = {
    appid: config.steamworks_appid,
    desc: description,
    buildoutput: path.join(config.steamworks_sdk_path, config.relative_buildoutput_dir),
    contentroot: path.join(config.steamworks_sdk_path, config.relative_contentroot_dir),
    setlive: steam_branch,
    preview: 0,
    nobaseline: 0,
    local: "",
    despotsskipped: 0,
    depots: get_depots()
  };

  write_appbuild(manifest);
}

function get_depots() {
  var depots = {};
  for(var item in config.builds) {
    var build = config.builds[item];
    depots[build.depot_id] = build.vdf_filename;
  }
  return depots;
}

function write_appbuild(manifest) {
  console.log("Writing app manifest");
  var contents_to_write = "appbuild\n{\n";
  var key, val;
  for(key in manifest) {
    if(!manifest.hasOwnProperty(key))
      continue;

    val = manifest[key];
    if(typeof(val) == "object") {
      contents_to_write += "\t\"" + key + "\"\n\t{\t\n";
      for(var key1 in val)
      {
        if(!val.hasOwnProperty(key1))
          continue;

        val1 = val[key1];
        contents_to_write += "\t\t\""+ key1 +"\" \"" + val1 + "\"\n";
      }
      contents_to_write += "\t}\n";
    } else {
      contents_to_write += "\t\""+ key +"\" \"" + val + "\"\n";
    }
  }
  contents_to_write += "}\n";

  var vdf_path = path.join(config.steamworks_sdk_path, config.autobuild_vdf_file);
  var handle = fs.openSync(vdf_path, "w+");
  fs.writeSync(handle, contents_to_write);
  fs.closeSync(handle);
}

function get_steamworks_command() {
  var executable_path = path.join(config.steamworks_sdk_path, config.steamcmd_executable);
  var vdf_filepath = path.join(config.steamworks_sdk_path, config.autobuild_vdf_file);

  var args = [
      "+login", config.steamworks_username, config.steamworks_password,
      "+run_app_build", vdf_filepath,
      "+quit"
    ];
  return executable_path + ' ' + args.join(' ');
}

module.exports = Steampipe;
