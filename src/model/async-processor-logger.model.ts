export interface Logger {
    info(...args: any[]): void
    error(...args: any[]): void
    debug(...args: any[]): void
}
