# ERD

The old plugin is a production-management system with these main domains:

- people and access
- customers and delivery
- product workflow templates
- order execution
- operations board

## High-Level ERD

```mermaid
erDiagram
    roles ||--o{ employees : assigns
    departments ||--o{ teams : contains
    departments ||--o{ employees : groups
    teams ||--o{ employees : includes

    customers ||--o{ customer_recipients : has
    customers ||--o{ customer_contacts : has
    customers ||--o{ orders : places

    products ||--o{ product_steps : defines
    suppliers ||--o{ production_step_library : supports
    suppliers ||--o{ product_steps : outsources
    suppliers ||--o{ item_steps : executes
    production_step_library ||--o{ product_steps : seeds

    orders ||--o{ order_items : contains
    order_items ||--o{ item_steps : executes
    orders ||--o{ order_recipients : ships_to
    statuses ||--o{ orders : marks
    statuses ||--o{ item_steps : marks

    employees ||--o{ app_users : linked_to
    app_users ||--o{ app_tokens : authenticates
    app_users ||--o{ app_permissions : grants

    departments ||--o{ ops_stages : owns
    ops_tasks ||--o{ ops_task_positions : moves
    ops_stages ||--o{ ops_task_positions : places
    departments ||--o{ ops_task_positions : tracks
```

## Core Tables

### People and Access

- `roles`
- `departments`
- `teams`
- `employees`
- `app_users`
- `app_tokens`
- `app_permissions`

### Customer Management

- `customers`
- `customer_recipients`
- `customer_contacts`
- `order_recipients`

### Product and Workflow

- `products`
- `production_step_library`
- `product_steps`
- `suppliers`
- `statuses`

### Order Execution

- `orders`
- `order_items`
- `item_steps`
- `notifications`

### Operations Board

- `ops_stages`
- `ops_tasks`
- `ops_task_positions`

## Rebuild Guidance

- Keep `product_steps` as templates only.
- Keep `item_steps` as execution snapshots copied from product templates at order creation time.
- Keep app auth separate from WordPress users only if the business really needs it; otherwise consider mapping to WP users later.
- Enforce route permissions per module instead of using `__return_true`.
