import { DomainEvent } from './domain-event.base.js';
/**
 * Comment Domain Events
 */
export declare class CommentCreatedEvent extends DomainEvent {
    readonly postId: string;
    readonly userId: string;
    readonly parentId?: string | undefined;
    constructor(aggregateId: string, postId: string, userId: string, parentId?: string | undefined);
    get eventName(): string;
    protected getPayload(): Record<string, unknown>;
}
export declare class CommentApprovedEvent extends DomainEvent {
    readonly postId: string;
    readonly moderatorId?: string | undefined;
    constructor(aggregateId: string, postId: string, moderatorId?: string | undefined);
    get eventName(): string;
    protected getPayload(): Record<string, unknown>;
}
export declare class CommentFlaggedEvent extends DomainEvent {
    readonly reason: string;
    readonly flaggedBy?: string | undefined;
    constructor(aggregateId: string, reason: string, flaggedBy?: string | undefined);
    get eventName(): string;
    protected getPayload(): Record<string, unknown>;
}
export declare class CommentHiddenEvent extends DomainEvent {
    readonly reason: string;
    readonly moderatorId?: string | undefined;
    constructor(aggregateId: string, reason: string, moderatorId?: string | undefined);
    get eventName(): string;
    protected getPayload(): Record<string, unknown>;
}
export declare class CommentDeletedEvent extends DomainEvent {
    readonly postId: string;
    readonly deletedBy: string;
    constructor(aggregateId: string, postId: string, deletedBy: string);
    get eventName(): string;
    protected getPayload(): Record<string, unknown>;
}
//# sourceMappingURL=comment.events.d.ts.map