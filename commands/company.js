const CLI = require('clui')
const clear = CLI.Clear
const Game = require('../lib/game')
const client = require('../')
const {game, vorpal, firebase} = client

module.exports = function() {
  vorpal
    .command('company [command]')
    .description('list available commands')
    .action(function(args, cb) {

      game.listCommands('company').then(choices => {
        choices.push({ name: 'Cancel', value: 'cancel' })

        this.prompt([
          {
            type: 'list',
            name: 'company',
            message: 'Choose a company option',
            choices
          },
          {
            type: 'input',
            name: 'name',
            when(answers) {
              return answers.company === 'create'
            },
            message: 'Company Name: ',
            validate(input) { return input.length > 5 || 'Name is too short!'}
          },
          {
            type: 'input',
            name: 'slogan',
            when(answers) {
              return answers.company === 'create'
            },
            message: 'Company Slogan: ',
            validate(input) { return input.length > 5 || 'Slogan is too short!'}
          },
          {
            type: 'list',
            name: 'faction',
            when(answers) {
              return answers.company === 'create'
            },
            message: 'Choose a faction',
            default: 'UN',
            choices: [
              { name: 'United Nations', value: 'UN' },
              { name: 'Martian Federation', value: 'Mars' },
              { name: 'Outer Planets Alliance', value: 'OPA' }
            ]
          }
        ]).then(({company, name, slogan, faction}) => {
          if (company === 'cancel') {
            clear()
            return cb()
          }
          switch (company) {
            case 'create':
              game.sendCommand({
                type: 'company.create',
                payload: {
                  name,
                  slogan,
                  faction
                }
              }).then(data => {
                this.log(vorpal.chalk.green(data))
                cb()
              })
              break
            case 'view':
              game.sendCommand({
                type: 'company.view'
              }).then(data => {
                new CLI.Line()
                  .padding(2)
                  .column('Company Details:', 16, [vorpal.chalk.bold])
                  .fill()
                  .output()
                new CLI.Line().fill().output()
                new CLI.Line()
                  .padding(2)
                  .column('Faction:', 10, [vorpal.chalk.cyan])
                  .column(data.faction, 20, [vorpal.chalk.green.bold])
                  .fill()
                  .output()
                new CLI.Line()
                  .padding(2)
                  .column('DBA:', 10, [vorpal.chalk.cyan])
                  .column(data.name, 20, [vorpal.chalk.green.bold])
                  .fill()
                  .output()
                new CLI.Line()
                  .padding(2)
                  .column('Slogan:', 10, [vorpal.chalk.cyan])
                  .column(data.slogan, 20, [vorpal.chalk.green.bold])
                  .fill()
                  .output()
                new CLI.Line().fill().output()
                cb()
              })
              break
          }
        })
      }).catch(error => {
        vorpal.log(vorpal.chalk.red(error))
        cb()
      })
    })
}
