import { DomainEvent } from './domain-event.base.js';
/**
 * Video Domain Events
 */
export declare class VideoUploadedEvent extends DomainEvent {
    readonly uploaderId: string;
    readonly filename: string;
    readonly fileSize: number;
    constructor(aggregateId: string, uploaderId: string, filename: string, fileSize: number);
    get eventName(): string;
    protected getPayload(): Record<string, unknown>;
}
export declare class VideoProcessingStartedEvent extends DomainEvent {
    constructor(aggregateId: string);
    get eventName(): string;
    protected getPayload(): Record<string, unknown>;
}
export declare class VideoProcessingCompletedEvent extends DomainEvent {
    readonly duration: number;
    readonly qualities: string[];
    constructor(aggregateId: string, duration: number, qualities: string[]);
    get eventName(): string;
    protected getPayload(): Record<string, unknown>;
}
export declare class VideoProcessingFailedEvent extends DomainEvent {
    readonly error: string;
    readonly retryCount: number;
    constructor(aggregateId: string, error: string, retryCount: number);
    get eventName(): string;
    protected getPayload(): Record<string, unknown>;
}
export declare class VideoDeletedEvent extends DomainEvent {
    readonly uploaderId: string;
    constructor(aggregateId: string, uploaderId: string);
    get eventName(): string;
    protected getPayload(): Record<string, unknown>;
}
export declare class VideoViewedEvent extends DomainEvent {
    readonly viewerId?: string | undefined;
    readonly watchDuration?: number | undefined;
    constructor(aggregateId: string, viewerId?: string | undefined, watchDuration?: number | undefined);
    get eventName(): string;
    protected getPayload(): Record<string, unknown>;
}
//# sourceMappingURL=video.events.d.ts.map