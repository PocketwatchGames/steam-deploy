var program = require("commander");
var steampipe = require('./steampipe');

program
  .version('1.0.0')
  .usage('[options]')
  .option('-d, --desc [desc]', 'Specify build description')
  .option('-b, --branch [branch]', 'Specify remote branch. Default is steampipejs')
  .parse(process.argv);

var description = program.desc ? program.desc : "Uploaded with steam-deploy.js";
var branch = program.branch ? program.branch : "";

var steam = new steampipe();
steam.deploy(description, branch);
