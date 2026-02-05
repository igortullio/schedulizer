# Logging

## Log Levels

Use DEBUG and ERROR levels appropriately to record logs that are useful for understanding what happened or errors that need analysis

**Example:**
```typescript
// DEBUG - development information
console.log('User authentication started', { userId })
console.log('Database query executed', { query, duration })

// ERROR - errors that need attention
console.error('Failed to authenticate user', { userId, error: error.message })
console.error('Database connection failed', { error })
```

## Storage

Never store logs in files. Always redirect through the process itself (stdout/stderr)

## Sensitive Data

Never log sensitive data such as names, addresses, and credit card information

**Example:**
```typescript
// ❌ Avoid
console.log('User created', {
  name: 'John Doe',
  email: 'john@example.com',
  creditCard: '4111-1111-1111-1111',
  ssn: '123-45-6789',
})

// ✅ Prefer
console.log('User created', {
  userId: 'user_123',
  timestamp: new Date().toISOString(),
})

console.log('User created', {
  userId: 'user_123',
  email: maskEmail('john@example.com'), // jo***@example.com
})
```

## Clear Messages

Always be clear in log messages without being verbose or using long texts

**Example:**
```typescript
// ❌ Avoid - too verbose
console.log('The user with the ID 123 has successfully completed the registration process and is now able to access the system with full privileges')

// ❌ Avoid - too vague
console.log('Done')
console.log('Error')

// ✅ Prefer - clear and concise
console.log('User registered successfully', { userId: '123' })
console.error('Payment processing failed', {
  orderId: 'order_456',
  reason: 'insufficient_funds',
})
```

## Console Methods

Use `console.log` or `console.error` to record logs

**Example:**
```typescript
// For information and debug
console.log('Application started', { port: 3000 })
console.log('User logged in', { userId })

// For errors
console.error('Database connection failed', { error: error.message })
console.error('Payment gateway timeout', { orderId, timeout: 5000 })
```

## Exception Handling

Never silence exceptions, always log them

**Example:**
```typescript
// ❌ Avoid
try {
  await processPayment(orderId)
} catch (error) {
  // silently ignored
}

// ❌ Avoid
try {
  await processPayment(orderId)
} catch (error) {
  console.error(error) // only logs but doesn't re-throw when it should
}

// ✅ Prefer
try {
  await processPayment(orderId)
} catch (error) {
  console.error('Payment processing failed', {
    orderId,
    error: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
  })
  throw error // re-throw if necessary
}

// Or handle appropriately
try {
  await processPayment(orderId)
} catch (error) {
  console.error('Payment processing failed', { orderId, error })
  return { success: false, error: 'payment_failed' }
}
```

## Context in Logs

Always include relevant context in logs to facilitate debugging

**Example:**
```typescript
// ❌ Avoid - no context
console.log('Operation completed')
console.error('Failed')

// ✅ Prefer - with context
console.log('Payment processed', {
  orderId: 'order_123',
  amount: 99.99,
  currency: 'USD',
  timestamp: new Date().toISOString(),
})

console.error('Payment failed', {
  orderId: 'order_123',
  userId: 'user_456',
  errorCode: 'insufficient_funds',
  attemptNumber: 3,
})
```

## Log Structure

Use structured objects to facilitate parsing and analysis

**Example:**
```typescript
// ❌ Avoid - unstructured string
console.log(`User ${userId} created order ${orderId} with total ${total}`)

// ✅ Prefer - structured object
console.log('Order created', {
  userId,
  orderId,
  total,
  timestamp: new Date().toISOString(),
  source: 'web',
})
```
