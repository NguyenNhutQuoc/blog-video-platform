/**
 * Base Domain Event
 *
 * Domain events represent something that happened in the domain.
 * They are immutable and carry all the information needed to
 * describe the event.
 */
export abstract class DomainEvent {
  public readonly occurredAt: Date;
  public readonly eventId: string;

  constructor(
    public readonly aggregateId: string,
    public readonly aggregateType: string
  ) {
    this.occurredAt = new Date();
    this.eventId = crypto.randomUUID();
    Object.freeze(this);
  }

  /**
   * Get the event name (for routing/handling)
   */
  abstract get eventName(): string;

  /**
   * Serialize event to JSON
   */
  toJSON(): Record<string, unknown> {
    return {
      eventId: this.eventId,
      eventName: this.eventName,
      aggregateId: this.aggregateId,
      aggregateType: this.aggregateType,
      occurredAt: this.occurredAt.toISOString(),
      payload: this.getPayload(),
    };
  }

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
export abstract class AggregateRoot implements IEventEmitter {
  private _domainEvents: DomainEvent[] = [];

  get domainEvents(): ReadonlyArray<DomainEvent> {
    return [...this._domainEvents];
  }

  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  clearEvents(): void {
    this._domainEvents = [];
  }
}
