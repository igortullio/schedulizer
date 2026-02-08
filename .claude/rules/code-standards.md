# Code Standards

## Language

All source code must be written in English, including variable names, functions, classes, comments, and documentation

## Naming Conventions

- camelCase: Use for methods, functions, and variables
- PascalCase: Use for classes and interfaces
- kebab-case: Use for files and directories

## Clear Naming

Avoid abbreviations, but also don't write overly long names (more than 30 characters)

**Example:**
```typescript
// ❌ Avoid
const usrNm = "John" // too abbreviated
const userNameFromDatabaseQueryResult = "John" // too long

// ✅ Prefer
const userName = "John"
const dbUserName = "John"
```

## Constants and Magic Numbers

Declare constants to represent magic numbers for readability

**Example:**
```typescript
// ❌ Avoid
if (user.age >= 18) {}
setTimeout(() => {}, 3600000)

// ✅ Prefer
const MINIMUM_AGE = 18
const ONE_HOUR_IN_MS = 60 * 60 * 1000

if (user.age >= MINIMUM_AGE) {}
setTimeout(() => {}, ONE_HOUR_IN_MS)
```

## Methods and Functions

Methods and functions should perform a clear and well-defined action, and this should be reflected in their name, which must start with a verb, never a noun

**Example:**
```typescript
// ❌ Avoid
function user(id: string) {}
function userData() {}

// ✅ Prefer
function getUser(id: string) {}
function fetchUserData() {}
function createUser(data: UserData) {}
function updateUserEmail(id: string, email: string) {}
```

## Parameters

Whenever possible, avoid passing more than 3 parameters. Prefer using objects when necessary

**Example:**
```typescript
// ❌ Avoid
function createUser(name: string, email: string, age: number, address: string, phone: string) {}

// ✅ Prefer
interface CreateUserParams {
  name: string
  email: string
  age: number
  address: string
  phone: string
}

function createUser(params: CreateUserParams) {}
```

## Side Effects

Avoid side effects. In general, a method or function should perform a mutation OR a query, never allow a query to have side effects

**Example:**
```typescript
// ❌ Avoid
function getUsers() {
  const users = database.query("SELECT * FROM users")
  logger.log("Users fetched") // side effect
  cache.set("users", users) // side effect
  return users
}

// ✅ Prefer
function getUsers() {
  return database.query("SELECT * FROM users")
}

function fetchAndCacheUsers() {
  const users = getUsers()
  logger.log("Users fetched")
  cache.set("users", users)
  return users
}
```

## Conditional Structures

Never nest more than two if/else statements. Always prefer early returns

**Example:**
```typescript
// ❌ Avoid
function processPayment(user: User, amount: number) {
  if (user) {
    if (user.isActive) {
      if (amount > 0) {
        if (user.balance >= amount) {
          return completePayment(user, amount)
        }
      }
    }
  }
  return null
}

// ✅ Prefer
function processPayment(user: User, amount: number) {
  if (!user) return null
  if (!user.isActive) return null
  if (amount <= 0) return null
  if (user.balance < amount) return null
  return completePayment(user, amount)
}
```

## Flag Parameters

Never use flag params to switch method or function behavior. In these cases, extract to methods and functions with specific behaviors

**Example:**
```typescript
// ❌ Avoid
function getUser(id: string, includeOrders: boolean) {
  const user = database.getUser(id)
  if (includeOrders) {
    user.orders = database.getOrders(id)
  }
  return user
}

// ✅ Prefer
function getUser(id: string) {
  return database.getUser(id)
}

function getUserWithOrders(id: string) {
  const user = getUser(id)
  user.orders = database.getOrders(id)
  return user
}
```

## Method and Class Size

- Avoid long methods with more than 50 lines
- Avoid long classes with more than 300 lines

## Formatting

Avoid blank lines inside methods and functions

**Example:**
```typescript
// ❌ Avoid
function calculateTotal(items: Item[]) {
  const subtotal = items.reduce((sum, item) => sum + item.price, 0)

  const tax = subtotal * 0.1

  return subtotal + tax
}

// ✅ Prefer
function calculateTotal(items: Item[]) {
  const subtotal = items.reduce((sum, item) => sum + item.price, 0)
  const tax = subtotal * TAX_RATE
  return subtotal + tax
}
```

## Comments

Avoid using comments whenever possible. The code should be self-explanatory

**Example:**
```typescript
// ❌ Avoid
// Check if user is adult
if (user.age >= 18) {}

// ✅ Prefer
const isAdult = user.age >= MINIMUM_LEGAL_AGE
if (isAdult) {}
```

## Variable Declaration

Never declare more than one variable on the same line.

## Variable Scope

Declare variables as close as possible to where they will be used.

**Example:**
```typescript
// ❌ Avoid
function processOrder(orderId: string) {
  const user = getUser()
  const product = getProduct()
  const discount = calculateDiscount()
  validateOrder(orderId)
  checkInventory(orderId)
  notifyUser(user) // user is only used here
}

// ✅ Prefer
function processOrder(orderId: string) {
  validateOrder(orderId)
  checkInventory(orderId)
  const user = getUser()
  notifyUser(user)
}
```
