import { AsyncHandler } from './model/async-processor-handler.model'
import { AsyncProcessorState } from './enum/async-processor.enum'
import { AsyncProcessorConfig } from './model/async-processor-config.model'
import { Logger } from './model/async-processor-logger.model'

export class AsyncProcessor<M, R> {
    private handler: AsyncHandler<M, R>
    private concurrency: number
    private processingDelay: number
    private startDelay: number

    private logger: Logger
    private state: AsyncProcessorState = AsyncProcessorState.INITIALISED

    constructor(config: AsyncProcessorConfig<M, R>) {
        this.handler = config.handler
        this.concurrency = config.concurrency || 20
        this.processingDelay = config.processingDelay || 0
        this.startDelay = config.startDelay || 0
        this.logger = config.logger
    }

    private async getNextBatch(): Promise<M[]> {
        const nextMessages = await this.handler.messages(this.concurrency)
        return nextMessages
    }

    private handleError(err: unknown) {
        setTimeout(() => {
            try {
                this.handler.error(err)
            } catch (err: unknown) {
                this.logger.error('Unhandled error in handler.error', err)
                throw err
            }
        }, 0)
    }

    private async processSingleMessage(message: M): Promise<void> {
        const startMillis = Date.now()
        try {
            await this.handler.execute(message)
        } catch (err: unknown) {
            this.handleError(err)
        } finally {
            this.logger.debug(`Processing took ${Date.now() - startMillis}ms`)
        }
    }

    private async process() {
        const startMillis = Date.now()
        try {
            const messagesToProcess = await this.getNextBatch()
            const promises = messagesToProcess.map((m) => this.processSingleMessage(m))
            await Promise.all(promises)
        } catch (err: unknown) {
            this.logger.error('Error while processing', err)
        } finally {
            const currentDelay = Date.now() - startMillis
            this.logger.debug(`Processing took ${currentDelay}ms`)
            const timeout = Math.max(this.processingDelay - currentDelay, 0)
            this.run(timeout)
        }
    }

    private async run(timeout: number) {
        if (this.state == AsyncProcessorState.RUNNING) {
            setTimeout(() => this.process(), timeout)
        }
    }

    start() {
        if (this.state != AsyncProcessorState.RUNNING) {
            this.state = AsyncProcessorState.RUNNING
            this.run(this.startDelay)
        } else {
            throw new Error('Already started.')
        }
    }

    stop() {
        this.state = AsyncProcessorState.STOPPED
    }

}
