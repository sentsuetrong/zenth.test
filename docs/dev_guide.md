# Development Guide

## Workflows
- **Building Assets:** `npm run build` (compiles Tailwind CSS).
- **Development Watch:** `npm run dev`.
- **Migrations:** `php spark migrate`.
- **Testing:** `php vendor/bin/phpunit`.

## Coding Standards
- **Naming:** PSR-12 for PHP; BEM-inspired for custom CSS components.
- **Validation:** Always validate data in Models or Controllers using CI4 Validation.
- **Security:** Use `esc()` for all output; use prepared statements (Query Builder) for all DB interactions.

## Recent Changes (May 2026)
- Standardized `BaseController` metadata.
- Completed Search & Detail views for MOU/Laws.
- Fixed SmartSelect JS initialization errors.
- Updated Font Awesome to v6.7.2.
