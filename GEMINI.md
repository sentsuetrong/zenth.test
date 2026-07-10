# 🌌 Zenth Test Project Knowledge Base (GEMINI.md)

เอกสารสรุปสถาปัตยกรรมและโครงสร้างโปรเจกต์ **คลังข้อมูลกฎหมายและบันทึกความร่วมมือ (MOU)** ของกองกฎหมาย สำนักงานปลัดกระทรวงสาธารณสุข (LAD-OPS-MOPH) เพื่อประหยัด Token และสร้างความเข้าใจบริบทที่กระชับรวดเร็วในการพัฒนาต่อยอด

---

## 📋 1. Project Overview & Technology Stack

- **หน่วยงาน:** กองกฎหมาย สำนักงานปลัดกระทรวงสาธารณสุข (Legal Affairs Division - Office of the Permanent Secretary for Ministry Of Public Health)
- **Framework:** CodeIgniter 4.x (AppStarter)
- **PHP Version:** `^8.1`
- **Database:** MySQL / MariaDB (MySQLi Driver, Table Prefix: `lomc4_` ตั้งค่าใน `.env`)
- **Authentication:** CodeIgniter Shield (Session-based, ติดตั้งและเปิดใช้งานเส้นทางผ่าน `service('auth')->routes($routes)`)
- **Security & Compliance:**
  - รองรับพระราชบัญญัติการปฏิบัติราชการทางอิเล็กทรอนิกส์ พ.ศ. 2565 (การตรวจสอบความแท้จริงและความครบถ้วนของเอกสารผ่าน SHA-256 Checksum)
  - รองรับพระราชบัญญัติการรักษาความมั่นคงปลอดภัยไซเบอร์ พ.ศ. 2562 (การป้องกัน URL Scanning/เดาสุ่มลิงก์ดาวน์โหลดด้วยรหัสสุ่ม Base64-UUID, การพรางพาธและชื่อไฟล์จริง, การควบคุมสิทธิ์เข้าถึง และการบันทึกประวัติการใช้ไฟล์/Log Audit Trail)
- **Frontend Assets:**
  - **CSS:** Tailwind CSS v4 (คอมไพล์ผ่าน PostCSS จาก `./assets/css/app.css` ไปยัง `./assets/css/compiled-main.css`)
  - **Icons:** Font Awesome v6.7.2 (โหลดผ่าน CDN ใน header)
  - **Thai Fonts:** ฟอนต์ภาษาไทย ChulabhornLikit และ Sarabun (เก็บใน `./assets/fonts/`)
  - **JS:** Vanilla JS + Toastify.js (สำหรับแสดง Alert/Notification) แยกไฟล์เป็น 3 โมดูลหลัก ได้แก่ `main.js` (ควบคุม UI หน้ากากทั่วไป), `smart-select.js` (คอมโพเนนต์กล่องเลือก), และ `file-manager.js` (ระบบหลังบ้านแอดมิน)
  - **SmartSelect:** คอมโพเนนต์ JS ใน `./assets/js/smart-select.js` ทำหน้าที่จัดการกล่องเลือกข้อมูลแบบ Multi-select ที่รองรับ Lazy Rendering (แบ่งโหลดรอบละ 50 รายการ), ระบบค้นหาล่วงหน้า (Pre-computation) และระบบหน่วงเวลาการพิมพ์ค้นหา (Debouncing) เพื่อความรวดเร็วและไม่กิน CPU
- **JS Build Scripts:**
  - `npm run build`: มินิฟายและบันเดิลไฟล์ JS ทั้งหมด (และ CSS) จากโฟลเดอร์ `assets/js/src/` ไปยัง `assets/js/` ผ่าน `esbuild` เพื่อความเร็วในการโหลดสูงสุด
  - `npm run dev:js`: เฝ้าดูและคอมไพล์ JS ย่อยทันทีที่แก้ไข
- **CSS Build Scripts:**
  - `npm run dev`: เฝ้าดูการเปลี่ยนแปลงของ CSS และคอมไพล์ใหม่ทันที (`postcss ./assets/css/app.css -o ./assets/css/compiled-main.css --watch`)
  - `npm run build`: คอมไพล์ CSS สำหรับใช้ใน Production (พร้อมมินิฟายไฟล์)

---

## 📂 2. Directory Structure & Key Files

```text
zenth.test/
├── .env                     # ไฟล์กำหนดค่าสภาพแวดล้อม (พัฒนาบน development, DB: zenth, Prefix: lomc4_)
├── index.php                # Entrypoint หลักของโปรเจกต์ (ย้ายมาไว้ที่ Root เพื่อความง่ายในการ Host ร่วมกับ XAMPP)
├── spark                    # CI4 CLI Tool สำหรับสั่งการผ่าน Terminal
├── app/
│   ├── Config/              # ไฟล์ตั้งค่าของระบบ (Routes.php, Filters.php, Database.php, Auth.php, Security.php)
│   ├── Controllers/
│   │   ├── Admin/
│   │   │   ├── LawController.php   # หน้าจัดการระบบหลังบ้าน (CRUD) สำหรับข้อมูลกฎหมาย/ระเบียบ
│   │   │   └── MouController.php   # หน้าจัดการระบบหลังบ้าน (CRUD) สำหรับข้อมูลบันทึกความร่วมมือ (MOU)
│   │   ├── MophDB/
│   │   │   └── LawsController.php  # ระบบสืบค้นและแสดงผลข้อมูลกฎหมาย/ระเบียบฝั่งสาธารณะ (Public)
│   │   ├── BaseController.php      # Base Controller สำหรับเก็บ Metadata พื้นฐานของระบบและสิทธิการเข้าถึง
│   │   ├── FileController.php      # จัดการส่วนการอัปโหลดไฟล์ (Chunked Upload) และดาวน์โหลดไฟล์แบบสตรีมมิ่งที่ปลอดภัย
│   │   └── MouController.php       # ระบบสืบค้นและแสดงผลข้อมูล MOU ฝั่งสาธารณะ (Public)
│   ├── Database/
│   │   ├── Migrations/             # ไฟล์ประวัติโครงสร้างฐานข้อมูล (System, MOUs, File Link, File Hash/Storage)
│   │   └── Seeds/
│   │       └── MouSeeder.php       # ไฟล์จำลองข้อมูลระบบ MOU และภาคี จำนวน 100 รายการ
│   ├── Models/
│   │   ├── FileChunkModel.php      # โมเดลย่อยจัดการ Chunk ข้อมูลไฟล์ (LONGBLOB ใน DB)
│   │   ├── FileContainerModel.php  # โมเดลจัดระดับโฟลเดอร์เก็บไฟล์
│   │   ├── FileModel.php           # โมเดลจัดเก็บ Metadata ไฟล์หลัก (รองรับ UUID เป็น Primary Key)
│   │   ├── LawModel.php            # โมเดลจัดการข้อมูลตารางกฎหมาย
│   │   ├── MouModel.php            # โมเดลจัดการข้อมูลตารางบันทึกความร่วมมือ (MOU)
│   │   └── PartyModel.php          # โมเดลจัดการข้อมูลตารางภาคี/หน่วยงานที่ร่วมลงนาม
│   └── Views/
│       ├── admin/                  # แม่แบบ (Template) ฝั่งหน้าจัดการหลังบ้าน (MOU, Laws, Upload)
│       ├── layouts/
│       │   └── moph-db/            # Layout หลักของระบบส่วนหัว/ท้าย (header.php, footer.php, main.php)
│       └── moph-db/                # แม่แบบฝั่งหน้าสืบค้นข้อมูลสาธารณะ (Laws, MOU)
├── assets/                  # ที่เก็บไฟล์ CSS/JS และทรัพยากรรูปภาพ/ฟอนต์ของระบบ
│   ├── css/
│   └── js/
│       ├── src/             # ซอร์สสคริปต์ก่อน compile (main.js, smart-select.js, file-manager.js)
│       ├── main.js          # ไฟล์หลักสำหรับหน้าสาธารณะ (ขนาดบีบอัด ~15KB)
│       ├── smart-select.js  # คอมโพเนนต์ SmartSelect (Multi-select) พร้อม Debouncing (~16KB)
│       └── file-manager.js  # สคริปต์ของแอดมินสำหรับอัปโหลด/ย้ายไฟล์ (~97KB)
└── docs/                    # รายละเอียดเอกสารสถาปัตยกรรมเพิ่มเติมของระบบ
    └── future_rbac_plan.md  # แผนการพัฒนาสิทธิ์การเข้าถึงข้อมูลตามผังองค์กรและการจัดการบัญชีผู้ใช้ในอนาคต
```

---

## 🗄️ 3. Database Schema & Relationships

ระบบใช้โครงสร้างฐานข้อมูลที่มี Prefix ตารางเป็น `lomc4_` และรองรับ Soft Deletes (`deleted_at`) ทั้งหมด

### 3.1 ตารางไฟล์และการอัปโหลด
- **`lomc4_file_containers`**: ใช้จำลองโครงสร้างโฟลเดอร์สำหรับจัดเก็บกลุ่มของไฟล์
- **`lomc4_files`**: เก็บข้อมูล Metadata ของไฟล์ มีคีย์หลักเป็น `uuid` (VARCHAR 36)
  - *ฟิลด์ความมั่นคงปลอดภัย (เพิ่มเติม):*
    - `file_hash`: (VARCHAR 64) ใช้เก็บรหัส SHA-256 Hash ของไฟล์เพื่อรับประกันความครบถ้วนสมบูรณ์ของเอกสารราชการ
    - `storage_type`: (ENUM: `'database'`, `'physical'`) ใช้ระบุรูปแบบการจัดเก็บไฟล์ (จัดเก็บดิบในฐานข้อมูล หรือ เก็บไฟล์กายภาพบนเซิร์ฟเวอร์)
- **`lomc4_file_chunks`**: จัดเก็บข้อมูลไฟล์ชิ้นส่วนย่อยชั่วคราว (ชิ้นละ 512KB) บันทึกในรูปแบบบล็อบดิบ (`chunk_data` เป็น `LONGBLOB`) เพื่อรองรับขั้นตอนการอัปโหลดไฟล์ขนาดใหญ่แบบ Chunked Upload บนโฮสติ้งจำกัดพื้นที่

### 3.2 ตารางระบบกฎหมาย (`lomc4_laws`)
- `id` (INT Auto Increment)
- `file_uuid` (VARCHAR 36, Nullable) -> คีย์นอก (Foreign Key) ชี้ไปยัง `lomc4_files.uuid` (SET NULL)
- `title` (VARCHAR 255)
- `law_no` (VARCHAR 255)
- `content` (TEXT)
- `status` (ENUM: `'active'`, `'cancel'`)
- *Full-text Search Index:* มีการตั้งค่า FULLTEXT ดัชนีในฟิลด์ `title` และ `content` เพื่อใช้ค้นหาด่วนแบบ Boolean Mode

### 3.3 ตารางระบบ MOU (`lomc4_mous`, `lomc4_parties`, `lomc4_mous_parties`)
- **`lomc4_mous`**:
  - `id` (INT Auto Increment)
  - `file_uuid` (VARCHAR 36, Nullable) -> คีย์นอกชี้ไปยัง `lomc4_files.uuid`
  - `full_title` (TEXT)
  - `title` (VARCHAR 255)
  - `entity_name` (VARCHAR 255, Default: `'กระทรวงสาธารณสุข'`)
  - `objective` (TEXT)
  - `effective_from` (DATETIME)
  - `effective_to` (DATETIME, Nullable)
  - `keywords` (VARCHAR 255)
- **`lomc4_parties`**: หน่วยงานหรือภาคีเครือข่ายที่เข้ามาร่วมลงนามใน MOU
  - `id` (INT Auto Increment)
  - `full_name` (TEXT)
  - `name` (VARCHAR 255)
- **`lomc4_mous_parties`** (ตารางกลางแบบ Many-to-Many):
  - `mou_id` (INT, Foreign Key -> `lomc4_mous.id` ON DELETE CASCADE)
  - `party_id` (INT, Foreign Key -> `lomc4_parties.id` ON DELETE CASCADE)

---

## ⚙️ 4. Key Workflows & Operations

### 4.1 Chunked Upload (Dropzone.js + FileController)
1. หน้าฟอร์มฝั่ง Admin (`laws/form.php` และ `mou/form.php`) มีการฝัง Dropzone.js
2. ไฟล์ PDF จะถูกหั่นเป็นบล็อกย่อยชิ้นละ **512KB** (ป้องกันขีดจำกัด `max_allowed_packet` ของ MySQL บน Shared hosting) และส่ง POST ไปยัง `/admin/upload/chunk` พร้อมแนบโทเค็นป้องกัน CSRF
3. ระบบจะตรวจสอบผ่าน `FileController::upload` เพื่อสร้างแถว Metadata ในตาราง `files` ก่อนนำ Chunk ล่าสุดไปเขียนเป็นก้อนบล็อบในตาราง `file_chunks`
4. เมื่ออัปโหลดครบถ้วน ไฟล์จะถูกประกอบและย้ายไปจัดเก็บตามลักษณะฟิลด์ `storage_type` โดยมีการคำนวณรหัส SHA-256 ตรวจสอบความถูกต้องสมบูรณ์และนำไปบันทึกในฟิลด์ `file_hash` จากนั้นส่งคืนค่า `file_uuid` กลับไปที่ฟรอนต์เอนด์เพื่อบันทึกร่วมกับฟอร์มหลัก
5. **นโยบาย CSRF:** เพื่อให้การส่งชิ้นส่วนไฟล์ต่อเนื่องกันหลายร้อยชิ้นไม่หยุดชะงัก ระบบถูกตั้งค่าใน `app/Config/Security.php` ให้ `$regenerate = false` (ไม่ทำการสุ่มสร้าง CSRF Token ใหม่ในทุกการอัปโหลดแต่ละคำขอย่อย)

### 4.2 ระบบจัดเก็บไฟล์จริงแบบกายภาพ (Physical File Storage)
1. **โฟลเดอร์จัดเก็บที่ปลอดภัย:** ไฟล์กายภาพจะถูกเก็บไว้ที่ `writable/uploads/` ซึ่งอยู่นอกโฟลเดอร์สาธารณะ และมีการตั้งค่า `.htaccess` ป้องกันไม่ให้เบราว์เซอร์เข้าถึงไฟล์ได้โดยตรง
2. **การพรางชื่อพาธและชื่อไฟล์ (Path & Filename Obfuscation):** ไฟล์ที่จัดเก็บบนดิสก์จะไม่มีชื่อหรือนามสกุลไฟล์จริง แต่ถูกตั้งชื่อด้วยรหัส UUID ของตัวมันเอง (เช่น `6d3a8d81-8b2b-4fa8-b2bc-6de808a3d5e2` ไร้นามสกุล) ป้องกันไม่ให้แฮกเกอร์เดาพาธหรือพยายามเข้าเปิดสคริปต์แฝงตัวเครื่อง

### 4.3 ระบบเข้าถึงและดาวน์โหลดแบบควบคุมสิทธิ์ (Secure File Serving)
1. **การยกเลิก Incremental ID:** ลิงก์ดาวน์โหลดจะไม่เปิดเผยเลขลำดับเดาง่าย แต่ทำงานผ่านหน้าดาวน์โหลดของ Controller เท่านั้น:
   `moph-db/file/download/(:any)`
2. **การใช้รหัสผ่านความปลอดภัยสูง (Base64-UUID Encoding):** พารามิเตอร์ของ URL จะนำรหัส UUID มารวบรวมและเข้ารหัสด้วยโครงสร้าง Base64 URL-safe (เช่น `/file/download/NmQzYThk...`)
3. **การดาวน์โหลดแบบบัฟเฟอร์ประหยัดหน่วยความจำ (Streaming Response):** เมื่อถอดรหัสและตรวจสอบสิทธิ์สำเร็จ Controller จะทำการส่งออกข้อมูลด้วยการอ่านข้อมูลไฟล์ทีละ 8KB (Buffer chunk) ออกไปทางเบราว์เซอร์ด้วยคำสั่ง `echo` และคำสั่ง `ob_flush(); flush();` ทำให้แรมของเซิร์ฟเวอร์ Shared hosting ไม่ล้น แม้ผู้ใช้จะดาวน์โหลดไฟล์ขนาดใหญ่กว่า 100MB พร้อมกัน
4. **Data Integrity Check:** คำนวณ SHA-256 ของไฟล์เปรียบเทียบกับค่า `file_hash` ในฐานข้อมูล เพื่อตรวจทานเอกสารก่อนปล่อยดาวน์โหลดจริง

### 4.4 การจัดกลุ่มข้อมูลตามปี พ.ศ. (Grouping MOU)
1. หน้าแรกฝั่งสืบค้น MOU (`MouController::index`) จะเรียกใช้ `withGroups()` ใน `MouModel` เพื่อดึงข้อมูล MOU พ่วงด้วยรายชื่อภาคี โดยใช้คำสั่ง SQL `GROUP_CONCAT` เพื่อรวมไอดีและชื่อภาคี
2. รวมทั้งคำนวณแปลงปี ค.ศ. จาก `effective_from` และ `effective_to` ให้กลายเป็น ปี พ.ศ. (ปี ค.ศ. + 543)
3. Controller จะประมวลผลข้อมูลผ่าน Method `buildGroup()` เพื่อจัดกลุ่มข้อมูลเก็บลงโครงสร้างอาเรย์แยกตามคีย์ปี พ.ศ. สำหรับนำไปลูปแสดงผลในวิว

### 4.5 ระบบค้นหาด่วนเต็มประโยค (Full-text Law Search)
- ระบบการสืบค้นข้อมูลกฎหมายจะอาศัยคีย์เวิร์ดที่ส่งผ่านมาทาง GET พารามิเตอร์ `q` ไปประมวลผลที่ `LawsController::search()` จากนั้นนำไปดึงฟังก์ชัน `search()` ของ `LawModel` ซึ่งใช้คิวรีรูปประโยค `MATCH(title, content) AGAINST(? IN BOOLEAN MODE)` ในการดึงผลลัพธ์พร้อมแบ่งหน้า (Pagination) หน้าละ 20 แถว

### 4.6 ระบบจัดการคลังไฟล์และการเพิ่มประสิทธิภาพความเร็ว (File Manager & Performance Operations)
1. **ลำดับการลบข้อมูล (Referential Integrity Constraints):** 
   - เนื่องจากตาราง `file_chunks` มีความสัมพันธ์กับคีย์นอกชี้ไปที่ `files.uuid` (โดยดีฟอลต์เป็น RESTRICT ใน SQL) การดำเนินการลบไฟล์จึงต้องเริ่มด้วยการลบชิ้นส่วนย่อยในตาราง `file_chunks` ก่อนเสมอ ก่อนที่จะเข้าทำรายการลบเมทาดาทาในตาราง `files` เพื่อไม่ให้เกิดข้อผิดพลาดในการตรวจสอบข้อจำกัดความสัมพันธ์ (Foreign Key Violation)
2. **ระบบการสลับสื่อเก็บข้อมูล (Storage Option):**
   - มีการรองรับสวิตช์เลือกประเภทจัดเก็บก่อนเริ่มอัปโหลด โดยส่งผ่าน POST พารามิเตอร์ `storage_type` (`'database'` หรือ `'physical'`) ตัว Controller `upload()` จะตรวจจับและสร้างข้อมูลเมทาดาทาตั้งต้นของไฟล์นั้นๆ ให้เป็นไปตามค่าที่เลือก ซึ่งทำงานร่วมกับกระบวนการรวมชิ้นส่วน (Chunk Assembly) แบบไดนามิกได้อย่างมีประสิทธิภาพ
3. **ระบบพรีวิวไฟล์ PDF แบบ Inline (PDF Preview Modal):**
   - เมธอด `download()` ใน `FileController` รองรับการระบุพารามิเตอร์ `?preview=1` เพื่อสลับการส่งค่า Content-Disposition จาก `attachment` เป็น `inline` ซึ่งจะเปิดโอกาสให้เบราว์เซอร์สามารถเรนเดอร์อ่านไฟล์ PDF ตัวอย่างผ่าน `<iframe>` ป๊อปอัปบนหน้าเว็บได้ทันทีโดยไม่ต้องบีบให้ดาวน์โหลดลงเครื่องคอมพิวเตอร์
4. **มาตรการเพิ่มความเร็วแอดมินหลังบ้าน (Performance Optimization):**
   - **การบีบอัด Gzip/Deflate:** ตั้งค่าในไฟล์ `.htaccess` เพื่อทำการบีบอัดไฟล์ HTML, CSS, JS และ Fonts ทำให้ประหยัดทราฟฟิกเครือข่ายและแสดงผลหน้าจอหลักได้รวดเร็วขึ้นสูงสุด 70%
   - **ดัชนีฐานข้อมูล (Database Indexing):** สร้างดัชนีบนตารางหลักและรอง (`parent_id` ใน `file_containers`, `container_id` ใน `files`) เพื่อเร่งสปีดการคิวรีระดับโครงสร้างของ File Manager
   - **8KB Buffered Streaming:** ในการดาวน์โหลดและดูตัวอย่าง จะใช้วิธีวนลูปส่งข้อมูลทีละ 8KB (Buffer size) พร้อมตรวจสอบสถานะบัฟเฟอร์ก่อนเคลียร์ (`ob_get_level() > 0`) ทำให้อัตรากินแรมของเซิร์ฟเวอร์คงที่และไม่เป็นคอขวดบน Shared Hosting

---

## 🎨 5. UI & Styling Concept

- **Theme Colors:**
  - **MOU Module:** ใช้สีโทนเขียวมรกต (`emerald`) เพื่อให้สอดคล้องกับภาพลักษณ์สาธารณสุขและการร่วมมือกัน
  - **Laws Module:** ใช้สีโทนน้ำเงินคลาสสิก (`blue`) เพื่อแสดงถึงความน่าเชื่อถือ กฎระเบียบและข้อกฎหมาย
- **SmartSelect (Vanilla JS Multi-select):**
  - ออกแบบพิเศษเพื่อแก้ไขปัญหากล่อง Select ค้างเมื่อมีตัวเลือกปริมาณมาก (เช่น รายชื่อหน่วยงานภาคีทั่วประเทศ)
  - ประมวลผลเก็บคีย์เวิร์ดค้นหาและจัดรูปแบบล่วงหน้า (Pre-computation) ตอนรับค่ามาครั้งแรก
  - แสดงผลแบบขี้เกียจ (Lazy Rendering) โดยจะวาดตัวเลือกบนหน้าเว็บเพียงรอบละ 50 รายการ และจะโหลดชุดถัดไปเมื่อผู้ใช้งานเลื่อนหน้าจอลงมาด้านล่างสุดของกล่องตัวเลือก
  - **ระบบหน่วงเวลาการพิมพ์ (Debouncing):** เพิ่ม Debounce 200ms ในการรับข้อความพิมพ์ในช่องค้นหา เพื่อป้องกันการค้นหาและ Re-render ทุกตัวอักษรอย่างรวดเร็วเกินไป ช่วยลดการใช้ทรัพยากรบนคอมพิวเตอร์ผู้ใช้ได้เป็นอย่างดี
  - **โหมดอินพุตแท็กและชิป (Tags/Chips Input Mode):** เปิดใช้งานผ่าน `mode: 'tags'` เพื่อเปลี่ยนอินพุตข้อความเป็นแท็กโดยการกด `Enter` รองรับการนำทางผ่านคีย์บอร์ด Arrow Keys และการคลิกหรือกด `Delete/Backspace` บนแท็กเพื่อ "ปลดชิป" (Unwrap) กลับมาพิมพ์แก้ไขในฟิลด์อินพุตได้ทันที
- **ระบบสลับการกำหนดค่า (Settings Configuration Toggle):**
  - มีสวิตช์ควบคุมกลางในหน้าตั้งค่าระบบเพื่อเลือกใช้ระหว่าง **"ค่าเริ่มต้นจากระบบ" (System Defaults)** และ **"ตั้งค่าใช้งานเอง" (Custom Configuration)**
  - เมื่อเลือกใช้ค่าเริ่มต้นจากระบบ ฟิลด์กรอกข้อมูลและอินสแตนซ์ของ SmartSelect ทั้งหมดจะแสดงค่าเริ่มต้นของโปรเจกต์และล็อกการแก้ไขโดยอัตโนมัติ โดยสลับค่าระหว่างสองสถานะได้โดยไม่ทำให้ค่าแก้ไขแบบกำหนดเองสูญหาย (State Preservation)
- **Tailwind CSS Dynamic Class Compilation Constraint (ข้อจำกัดชื่อคลาสไดนามิก):**
  - **ห้าม "Chopping Up" คลาสเด็ดขาด:** เพื่อให้ตัวสแกนหาคลาส (Static Analysis Engine) ของ Tailwind CSS สามารถตรวจพบและดึงคลาสไปคอมไพล์ลงไฟล์ CSS ปลายทาง (`compiled-main.css`) ได้ครบถ้วน
  - **การเขียนโค้ดที่ถูกต้อง:** ต้องระบุชื่อคลาสแบบเต็มคำเสมอ ห้ามแยกเขียนเพื่อต่อสตริงในลอจิก PHP หรือ Javascript เช่น:
    - *ผิด (ห้ามทำ):* `class="text-<?= $status === 'active' ? 'emerald' : 'red' ?>-500"`
    - *ถูก:* `class="<?= $status === 'active' ? 'text-emerald-500' : 'text-red-500' ?>"`
    - *ผิด (ห้ามทำ ใน JS):* `const color = 'bg-' + statusColor + '-100';`
    - *ถูก (ใน JS):* `const color = statusColor === 'active' ? 'bg-emerald-100' : 'bg-red-100';`

---

## 🛠️ 6. Useful Development Commands

- **Start Web Server:** `php spark serve`
- **Run Database Migrations:** `php spark migrate`
- **Rollback Migrations:** `php spark migrate:rollback`
- **Seed Simulated Data (100 MOUs):** `php spark db:seed MouSeeder`
- **Compiles CSS & JS (Production Build & Minify):** `npm run build`
- **Compiles CSS (Watch Mode):** `npm run dev` (หรือ `npm run dev:css`)
- **Compiles JS (Watch Mode):** `npm run dev:js`
- **Run Unit Tests:** `composer test` หรือ `php vendor/bin/phpunit`

---

## 📚 7. Future System Expansion Plans
- **ระบบควบคุมสิทธิ์แบบ RBAC และผังองค์กร 3 ระดับ:** ดูรายละเอียดแผนงานการเชื่อมโยงระบบควบคุมสิทธิ์ร่วมกับผังหน่วยงาน (Department/Division/Group) และการวิเคราะห์ขยายสเกลความปลอดภัยในอนาคตได้ที่ [future_rbac_plan.md](file:///d:/xampp/www/zenth.test/docs/future_rbac_plan.md)
