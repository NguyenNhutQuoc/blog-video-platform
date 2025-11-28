/**
 * Base Domain Event
 *
 * Domain events represent something that happened in the domain.
 * They are immutable and carry all the information needed to
 * describe the event.
 */
export declare abstract class DomainEvent {
    readonly aggregateId: string;
    readonly aggregateType: string;
    readonly occurredAt: Date;
    readonly eventId: string;
    constructor(aggregateId: string, aggregateType: string);
    /**
     * Get the event name (for routing/handling)
     */
    abstract get eventName(): string;
    /**
     * Serialize event to JSON
     */
    toJSON(): Record<string, unknown>;
    /**
     * Get event-specific payload
     */
    protected abstract getPayload(): Record<string, unknown>;
}
/**
 * Interface for entities that emit domain events
 */
export interface IEventEmitter {
    readonly domainEvents: ReadonlyArray<DomainEvent>;
    clearEvents(): void;
}
/**
 * Mixin to add event emitting capability to entities
 */
export declare abstract class AggregateRoot implements IEventEmitter {
    private _domainEvents;
    get domainEvents(): ReadonlyArray<DomainEvent>;
    protected addDomainEvent(event: DomainEvent): void;
    clearEvents(): void;
}
//# sourceMappingURL=domain-event.base.d.ts.map