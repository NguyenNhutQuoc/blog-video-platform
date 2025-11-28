import { DomainEvent } from './domain-event.base.js';
/**
 * User Domain Events
 */
export declare class UserRegisteredEvent extends DomainEvent {
    readonly email: string;
    readonly username: string;
    constructor(aggregateId: string, email: string, username: string);
    get eventName(): string;
    protected getPayload(): Record<string, unknown>;
}
export declare class UserEmailVerifiedEvent extends DomainEvent {
    readonly email: string;
    constructor(aggregateId: string, email: string);
    get eventName(): string;
    protected getPayload(): Record<string, unknown>;
}
export declare class UserProfileUpdatedEvent extends DomainEvent {
    readonly changes: Record<string, unknown>;
    constructor(aggregateId: string, changes: Record<string, unknown>);
    get eventName(): string;
    protected getPayload(): Record<string, unknown>;
}
export declare class UserBlockedEvent extends DomainEvent {
    readonly reason: string;
    constructor(aggregateId: string, reason: string);
    get eventName(): string;
    protected getPayload(): Record<string, unknown>;
}
export declare class UserDeletedEvent extends DomainEvent {
    constructor(aggregateId: string);
    get eventName(): string;
    protected getPayload(): Record<string, unknown>;
}
//# sourceMappingURL=user.events.d.ts.map