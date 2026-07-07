# Financial_Management

A PHP + MySQL (XAMPP) financial management system with role-based
dashboards for **admin**, **staff**, and **user**, backed by a shared
login/registration/OTP auth system.

## Folder structure

```
financial_management/          <- place this folder in htdocs
├── login.html                 <- sign in
├── register.html              <- create account (always creates role="user")
├── otp.html                   <- OTP verification (register + password reset)
├── forgot_password.html       <- request password reset OTP
├── reset_password.html        <- set new password
├── api/                       <- JSON API endpoints (fetch() targets)
├── config/                    <- DB + email config
├── includes/                  <- shared PHP helpers
├── sql/database.sql           <- run this in phpMyAdmin first
├── vendor/phpmailer/          <- email sending library
├── admin/                     <- admin dashboard (all subsystems + modules)
├── staff/                     <- staff dashboard (day-to-day operations)
└── user/                      <- user dashboard (personal/self-service view)
```

See `AUTH_README.md` for full auth setup instructions (XAMPP setup, database
import, Gmail app password, role promotion, etc).

## Dashboards

All three dashboards share the same design system (`app.css`) and shell
behavior (`app.js`): responsive sidebar, profile dropdown, session guard,
and logout — but each has its own `dashboard.js` with role-appropriate
data:

- **admin/** — full multi-subsystem view. Defaults to the Financial
  Management subsystem defined in `subsystems.js`, with switchable
  sidebar modules (General Ledger, AP, AR, Disbursement, Collection,
  Budget, Cash Management, Reporting & Analytics, Tax Management).
- **staff/** — operational modules only (recording transactions,
  processing invoices, collections, cash handling). No org-wide
  analytics or tax modules.
- **user/** — personal/self-service view only: my balance, my
  transactions, submit reimbursement/budget requests, download my
  statements.

Every dashboard calls `api/check_session.php` on load. If the session's
role doesn't match the dashboard the person landed on, they're
automatically redirected to their correct dashboard. Logging out calls
`api/logout.php` and returns to `login.html`.

## Status / what's still a placeholder

- Dashboard stats, charts, and activity feeds currently render from
  **static in-file sample data** (`STAFF_DASHBOARD_DATA`,
  `USER_DASHBOARD_DATA`, and `SUBSYSTEMS` in `admin/subsystems.js`) —
  not live database queries yet. Swap these for `fetch()` calls to your
  own PHP endpoints as those modules get built.
- "New Transaction", "Export Report", quick action buttons, and sidebar
  module links are currently non-functional placeholders (no click
  handlers wired to a backend yet).
