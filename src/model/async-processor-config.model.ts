import { AsyncHandler } from './async-processor-handler.model'
import { Logger } from './async-processor-logger.model'

export interface AsyncProcessorConfig<M, R> {
    handler: AsyncHandler<M, R>
    logger: Logger
    concurrency?: number
    processingDelay?: number
    startDelay?: number
}
