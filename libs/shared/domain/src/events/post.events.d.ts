import { DomainEvent } from './domain-event.base.js';
/**
 * Post Domain Events
 */
export declare class PostCreatedEvent extends DomainEvent {
    readonly authorId: string;
    readonly title: string;
    readonly slug: string;
    constructor(aggregateId: string, authorId: string, title: string, slug: string);
    get eventName(): string;
    protected getPayload(): Record<string, unknown>;
}
export declare class PostPublishedEvent extends DomainEvent {
    readonly authorId: string;
    readonly title: string;
    readonly slug: string;
    constructor(aggregateId: string, authorId: string, title: string, slug: string);
    get eventName(): string;
    protected getPayload(): Record<string, unknown>;
}
export declare class PostUnpublishedEvent extends DomainEvent {
    readonly reason?: string | undefined;
    constructor(aggregateId: string, reason?: string | undefined);
    get eventName(): string;
    protected getPayload(): Record<string, unknown>;
}
export declare class PostUpdatedEvent extends DomainEvent {
    readonly changes: Record<string, unknown>;
    constructor(aggregateId: string, changes: Record<string, unknown>);
    get eventName(): string;
    protected getPayload(): Record<string, unknown>;
}
export declare class PostDeletedEvent extends DomainEvent {
    readonly authorId: string;
    constructor(aggregateId: string, authorId: string);
    get eventName(): string;
    protected getPayload(): Record<string, unknown>;
}
export declare class PostViewedEvent extends DomainEvent {
    readonly viewerId?: string | undefined;
    readonly ipAddress?: string | undefined;
    constructor(aggregateId: string, viewerId?: string | undefined, ipAddress?: string | undefined);
    get eventName(): string;
    protected getPayload(): Record<string, unknown>;
}
export declare class PostLikedEvent extends DomainEvent {
    readonly userId: string;
    constructor(aggregateId: string, userId: string);
    get eventName(): string;
    protected getPayload(): Record<string, unknown>;
}
export declare class PostUnlikedEvent extends DomainEvent {
    readonly userId: string;
    constructor(aggregateId: string, userId: string);
    get eventName(): string;
    protected getPayload(): Record<string, unknown>;
}
export declare class PostEmbeddingGeneratedEvent extends DomainEvent {
    constructor(aggregateId: string);
    get eventName(): string;
    protected getPayload(): Record<string, unknown>;
}
//# sourceMappingURL=post.events.d.ts.map