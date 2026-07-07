# Auth System (HTML + PHP API + MySQL, for XAMPP)

Frontend is plain HTML/CSS/JS. Every PHP file is a JSON API endpoint living in
`api/` — there are no server-rendered pages. The browser calls these with
`fetch()`.

## Pages (HTML)
- `register.html` — create account -> sends OTP email
- `login.html` — sign in
- `forgot_password.html` — request a password-reset OTP
- `otp.html` — enter the 6-digit code (used for both registration and reset,
  differentiated by a `?purpose=register` or `?purpose=reset` query param)
- `reset_password.html` — set a new password after OTP is verified

(No dashboard.html is included — wire `login.php`'s redirect to your
existing dashboard page, see below.)

## API endpoints (PHP) — all in `api/`
| File | Purpose |
|---|---|
| `api/register.php` | Create account, send OTP |
| `api/verify_otp.php` | Verify OTP for register or reset |
| `api/resend_otp.php` | Resend OTP |
| `api/login.php` | Authenticate, start session |
| `api/forgot_password.php` | Send reset OTP |
| `api/reset_password.php` | Set new password (requires OTP verified in session) |
| `api/check_session.php` | Call from your dashboard to check if logged in |
| `api/logout.php` | Destroy session |

## Setup (XAMPP)

1. **Copy the `login_template` folder** into your XAMPP `htdocs`, e.g.
   `C:\xampp\htdocs\login_template` (Windows) or
   `/Applications/XAMPP/htdocs/login_template` (Mac). The role-based
   redirects below assume your admin/staff/user dashboards live at
   `/financial_management/admin/dashboard.html` etc. from the web root —
   adjust the paths in `api/login.php` if your folder layout differs.
2. **Start Apache and MySQL** in the XAMPP control panel.
3. **Import the database**: open `http://localhost/phpmyadmin`, create/import
   `sql/database.sql` (this creates the `financial_management` database with
   `users` and `otp_codes` tables). If you already have this database from
   before and just need the new `role` column, run the `ALTER TABLE`
   statement noted in a comment near the bottom of `sql/database.sql`
   instead of re-running the whole file.
4. **Check `config/database.php`** — defaults match stock XAMPP
   (`host=localhost`, `user=root`, `password=""`). Edit if yours differs.
5. **Email is already configured** in `config/config.php` with the Gmail
   account you gave me. Gmail requires an **App Password** (16 chars, no
   spaces) rather than your normal password. If emails fail to send,
   regenerate one at https://myaccount.google.com/apppasswords (requires
   2-Step Verification enabled on that Gmail account) and paste it into
   `EMAIL_PASS`.
6. **Visit** `http://localhost/login_template/register.html` in your
   browser.

## Role-based access

The `users` table has a `role` column: `admin`, `staff`, or `user`.

- **Public registration always creates a `user` role.** There's no signup
  form field for role — this is intentional, so nobody can register
  themselves as an admin.
- To make someone an `admin` or `staff`, promote them manually in
  phpMyAdmin's SQL tab:
  ```sql
  UPDATE users SET role = 'admin' WHERE email = 'someone@example.com';
  UPDATE users SET role = 'staff' WHERE email = 'someone@example.com';
  ```
- On successful login, `api/login.php` puts the role in the session and
  redirects to:
  - `admin` -> `/financial_management/admin/dashboard.html`
  - `staff` -> `/financial_management/staff/dashboard.html`
  - `user`  -> `/financial_management/user/dashboard.html`

  These are absolute paths from the web root — update the `$roleRedirects`
  array near the bottom of `api/login.php` if your dashboards live
  somewhere else.
- Each of your dashboard pages should call `api/check_session.php` on load.
  It returns `{ success, user: { name, email, role } }`. Use `role` to:
  - confirm the person is allowed to be on that specific dashboard (e.g. if
    someone lands on `/admin/dashboard.html` but their role is `user`,
    redirect them to `/user/dashboard.html` instead)
  - show/hide role-specific UI

## Flow
1. User registers -> row created in `users` (`role = 'user'`,
   `is_verified = 0`) -> OTP emailed -> redirected to
   `otp.html?purpose=register`.
2. User enters code -> `is_verified` set to 1 -> redirected to `login.html`.
3. User logs in -> session started (includes role) -> redirected to their
   role's dashboard.
4. Forgot password -> email OTP -> `otp.html?purpose=reset` -> on success
   redirected to `reset_password.html` -> new password saved.

## Notes
- Passwords are hashed with PHP's `password_hash()` (bcrypt).
- OTPs are 6 digits, expire after 10 minutes, and are invalidated after use
  or after a new one is requested.
- Emails are sent from "Financial Management" via Gmail SMTP.
- `vendor/phpmailer` contains the PHPMailer library (downloaded from its
  official GitHub repo) — no Composer needed.
- On your dashboard page, call `api/check_session.php` on load to confirm
  the user is logged in (redirect to `login.html` if not), and call
  `api/logout.php` for your sign-out button.
- For production, move `config/config.php` credentials out of source control
  and use HTTPS so session cookies aren't sent in plaintext.
