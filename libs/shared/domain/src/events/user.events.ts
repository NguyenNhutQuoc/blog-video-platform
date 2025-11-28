import { DomainEvent } from './domain-event.base.js';

/**
 * User Domain Events
 */

// =====================================================
// USER REGISTERED
// =====================================================

export class UserRegisteredEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly email: string,
    public readonly username: string
  ) {
    super(aggregateId, 'User');
  }

  get eventName(): string {
    return 'user.registered';
  }

  protected getPayload(): Record<string, unknown> {
    return {
      email: this.email,
      username: this.username,
    };
  }
}

// =====================================================
// USER EMAIL VERIFIED
// =====================================================

export class UserEmailVerifiedEvent extends DomainEvent {
  constructor(aggregateId: string, public readonly email: string) {
    super(aggregateId, 'User');
  }

  get eventName(): string {
    return 'user.email_verified';
  }

  protected getPayload(): Record<string, unknown> {
    return {
      email: this.email,
    };
  }
}

// =====================================================
// USER PROFILE UPDATED
// =====================================================

export class UserProfileUpdatedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly changes: Record<string, unknown>
  ) {
    super(aggregateId, 'User');
  }

  get eventName(): string {
    return 'user.profile_updated';
  }

  protected getPayload(): Record<string, unknown> {
    return {
      changes: this.changes,
    };
  }
}

// =====================================================
// USER BLOCKED (SPAM)
// =====================================================

export class UserBlockedEvent extends DomainEvent {
  constructor(aggregateId: string, public readonly reason: string) {
    super(aggregateId, 'User');
  }

  get eventName(): string {
    return 'user.blocked';
  }

  protected getPayload(): Record<string, unknown> {
    return {
      reason: this.reason,
    };
  }
}

// =====================================================
// USER DELETED
// =====================================================

export class UserDeletedEvent extends DomainEvent {
  constructor(aggregateId: string) {
    super(aggregateId, 'User');
  }

  get eventName(): string {
    return 'user.deleted';
  }

  protected getPayload(): Record<string, unknown> {
    return {};
  }
}
