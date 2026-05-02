# ColorSource Production Suite Clean

This folder is a clean rebuild foundation for the app inside the old `colorsource-plugin-extdebug.zip`.

It keeps the same product shape:

- WordPress plugin
- Custom REST API
- Custom database tables
- Frontend app shell for dashboard, orders, KDS, delivery, and operations

But it fixes the architecture:

- bootstrap is separated from modules
- database schema is centralized
- routes are grouped by domain
- auth is isolated
- app shell concerns are isolated
- ERD and module boundaries are documented

This is the right starting point if you want to rebuild the same app safely and extend it without one giant PHP file.

## Old App Modules Found

- Dashboard
- Orders
- Completed Orders
- Customers
- Products
- Product Workflow / Step Library
- Suppliers
- Employees / Roles / Teams / Departments
- Notifications
- KDS
- Delivery Orders
- Operations Tasks
- Users / Permissions
- Settings / Branding

## Clean Structure

```text
colorsource-plugin-clean/
├── colorsource-production-suite.php
├── docs/
│   ├── ERD.md
│   └── MODULES.md
└── src/
    ├── Core/
    ├── Infrastructure/
    └── Modules/
```

## Notes

- This is a clean architecture scaffold, not full feature parity yet.
- It is based on the real modules and tables discovered in the old plugin.
- The next step would be implementing each module one by one against this structure instead of continuing with the legacy monolith.
