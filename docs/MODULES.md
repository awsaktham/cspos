# Modules

## 1. App Shell

Owns:

- rewrite rules
- shortcode rendering
- frontend asset loading
- standalone app, KDS, and delivery pages

Main outputs:

- `/cspsr-app`
- `/cspsr-kds`
- `/cspsr-delivery/{orderId}`

## 2. Auth

Owns:

- login
- logout
- current user
- app users
- permissions
- token validation

Routes:

- `/auth/login`
- `/auth/logout`
- `/auth/me`
- `/app-users`

## 3. Bootstrap

Owns:

- initial dashboard payload
- lookup tables
- capability payload

Routes:

- `/bootstrap`

## 4. Orders

Owns:

- orders
- order items
- item step execution
- delivery actions
- queueing
- pause/resume/advance lifecycle

Routes:

- `/orders`
- `/orders/{id}`
- `/steps/{id}/start`
- `/steps/{id}/advance`
- `/orders/{id}/partial-deliver`

## 5. Catalog

Owns:

- customers
- recipients
- contacts
- products
- product steps
- step library
- suppliers

Routes:

- `/customers`
- `/products`
- `/product-steps`
- `/step-library`
- `/suppliers`

## 6. People

Owns:

- roles
- departments
- teams
- employees
- statuses

Routes:

- `/roles`
- `/departments`
- `/teams`
- `/employees`
- `/statuses`

## 7. Operations

Owns:

- notifications
- operations tasks
- stage boards
- setup and branding

Routes:

- `/notifications`
- `/ops-tasks`
- `/ops-stages`
- `/setup`

## Recommended Build Order

1. Schema
2. Auth
3. Catalog
4. Orders
5. People
6. Operations
7. Frontend screens
