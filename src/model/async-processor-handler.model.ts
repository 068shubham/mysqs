export interface AsyncHandler<M, R> {
    execute: (message: M) => Promise<R>
    error: (response: unknown) => void
    messages: (count: number) => Promise<M[]>
}
