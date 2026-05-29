# Architecture & Design Patterns

## Controller Logic
- **BaseController:** Centrally handles agency metadata and system titles in the `$data` property. All controllers must extend this and use `$this->data`.
- **Namespacing:** Modules are grouped by namespace where appropriate (e.g., `App\Controllers\MophDB`).

## Routing
- **Dashboard:** `/` (Home::index)
- **MOU Module:** `/moph-db/mou`
- **Laws Module:** `/moph-db/laws`
- **Admin:** `/admin/upload`
- **Auth:** Standard Shield routes.

## View System
- **Layouts:** Shared layout in `app/Views/layouts/moph-db/main.php`.
- **Assets:** Always use `base_url()` for CSS/JS. CSS is cache-busted via `?v=time()`.

## Database Design
- **Primary Keys:** Uses UUIDs for file-related tables.
- **Search:** MOU uses keyword matching; Laws uses `MATCH...AGAINST` Full-text search.
- **Date Handling:** Dates are stored as standard MySQL dates but displayed as Buddhist years (+543) in the UI.
