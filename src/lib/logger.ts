import serialize from 'serialize-javascript'
import w from 'winston'
import { ENV } from './env.js'

type LogLevel =
  | 'error'
  | 'warn'
  | 'info'
  | 'verbose'
  | 'debug'
  | 'silly'
  | 'silent'

function getLogLevel(environment: string | undefined): LogLevel {
  switch (environment) {
    case 'production':
      return 'info'
    case 'staging':
      return 'verbose'
    case 'testing':
      return 'silent' // disable logs during testing
    case 'development':
    default:
      return 'debug'
  }
}

const logger = w.createLogger({
  level: getLogLevel(ENV.ENVIRONMENT),
  format: w.format.printf(({ level, message, ...metadata }) => {
    const metadataString =
      metadata && Object.keys(metadata).length ? serialize(metadata) : ''
    return `[${level.toUpperCase()}] ${message} ${metadataString}`
  }),
  transports: [new w.transports.Console()],
})

export { logger }
