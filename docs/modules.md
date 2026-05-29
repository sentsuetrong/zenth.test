# Modules & Features

## 1. MOU Management
- **Public Route:** `/moph-db/mou`
- **Admin Route:** `/admin/mou`
- **Grouping:** Grouped by Buddhist Year in the sidebar (Public view).
- **Parties:** Handled via a many-to-many relationship (`mous_parties` table).
- **Admin Features:**
  - CRUD operations with form validation.
  - Multi-select party assignment using `SmartSelect` component.
  - Integrated PDF upload via chunking system.

## 2. Laws Database
- **Public Route:** `/moph-db/laws`
- **Admin Route:** `/admin/laws`
- **Search:** Full-text search on `title` and `content`.
- **Status:** Tracks `active` vs `cancel` states with visual badges.
- **Admin Features:**
  - Full CRUD management.
  - File association for downloading law documents.

## 3. Advanced File Management
- **Chunked Uploads:** Handles large files via JS/PHP chunking to bypass server limits.
- **Storage:** Chunks are temporarily stored as `LONGBLOB` in `file_chunks` before final assembly into files.
- **Models:** `FileModel`, `FileChunkModel`.
