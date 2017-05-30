#!/usr/bin/env node
'use strict';

var pkg = require('../package.json');
var updateNotifier = require('update-notifier')({pkg: pkg});
updateNotifier.notify({defer: true});

var client = require('..');
var errorOut = require('../lib/errorOut');
var winston = require('winston');
var logger = require('../lib/logger');
var fs = require('fs');
var fsutils = require('../lib/fsutils');
var path = require('path');
var chalk = require('chalk');
var configstore = require('../lib/configstore');
var _ = require('lodash');
var args = process.argv.slice(2);
var cmd;

var logFilename = path.join(process.cwd(), '/spacetraders-debug.log');
logger.add(winston.transports.Console, {
  level: process.env.DEBUG ? 'debug' : 'info',
  showLevel: false,
  colorize: true
}).add(winston.transports.File, {
  level: 'debug',
  filename: logFilename,
  json: false,
  formatter: function(input) {
    input.message = chalk.stripColor(input.message);
    return [
      '[' + input.level + ']',
      input.message
    ].join(' ');
  }
});

var debugging = false;
if (_.includes(args, '--debug')) {
  logger.transports.console.level = 'debug';
  debugging = true;
}

logger.debug(_.repeat('-', 70));
logger.debug('Command:     ', process.argv.join(' '));
logger.debug('CLI Version: ', pkg.version);
logger.debug('Platform:    ', process.platform);
logger.debug('Node Version:', process.version);
logger.debug('Time:        ', new Date().toString());
logger.debug(_.repeat('-', 70));
logger.debug();

require('../lib/fetchMOTD')();

process.on('exit', function(code) {
  code = process.exitCode || code;
  if (!debugging && code < 2 && fsutils.fileExistsSync(logFilename)) {
    fs.unlinkSync(logFilename);
  }

  if (code > 0 && process.stdout.isTTY) {
    var lastError = configstore.get('lastError') || 0;
    var timestamp = Date.now();
    if (lastError > timestamp - 120000) {
      var help;
      if (code === 1 && cmd) {
        var commandName = _.get(_.last(cmd.args), '_name', '[command]');
        help = 'Having trouble? Try ' + chalk.bold('spacetraders ' + commandName + ' --help');
      } else {
        help = 'Having trouble? Try again or contact support with contents of spacetraders-debug.log';
      }

      if (cmd) {
        console.log();
        console.log(help);
      }
    }
    configstore.set('lastError', timestamp);
  } else {
    configstore.delete('lastError');
  }
});
require('exit-code');

process.on('uncaughtException', function(err) {
  console.log(err)
  errorOut(client, err);
});

cmd = client.cli.parse(process.argv);
// determine if there are any non-option arguments. if not, display help
args = args.filter(function(arg) {
  return arg.indexOf('-') < 0;
});
if (!args.length) {
  client.cli.help();
}
