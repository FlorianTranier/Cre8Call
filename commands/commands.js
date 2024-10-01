import { execute as setupExecute } from './utility/setup.command.js'

const commandHandlers = (providers) => {
  return {
    setup: setupExecute(providers)
  }
}

export { commandHandlers }
