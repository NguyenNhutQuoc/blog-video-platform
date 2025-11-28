/**
 * Test Fixtures Index
 *
 * Re-exports all test fixtures for easy importing.
 */

// User fixtures
export * from './user.fixture.js';

// Post fixtures
export * from './post.fixture.js';

// Video fixtures
export * from './video.fixture.js';

// Session fixtures
export * from './session.fixture.js';

// Category fixtures
export * from './category.fixture.js';

// Tag fixtures
export * from './tag.fixture.js';

/**
 * Reset all counters (call in beforeEach for predictable test data)
 */
export function resetAllCounters(): void {
  // Import and call reset functions
  const { resetUserCounter } = require('./user.fixture.js');
  const { resetPostCounter } = require('./post.fixture.js');
  const { resetVideoCounter } = require('./video.fixture.js');
  const { resetSessionCounter } = require('./session.fixture.js');
  const { resetCategoryCounter } = require('./category.fixture.js');
  const { resetTagCounter } = require('./tag.fixture.js');

  resetUserCounter();
  resetPostCounter();
  resetVideoCounter();
  resetSessionCounter();
  resetCategoryCounter();
  resetTagCounter();
}
