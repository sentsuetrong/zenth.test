<?php

if (!function_exists('vite_tags')) {
  /**
   * สร้าง Script tags สำหรับเชื่อมต่อ Vite
   *
   * @param string $entryPoint path ไฟล์เริ่มต้น (เช่น 'src/main.js')
   * @return string HTML Tags
   */
  function vite_tags(string $entryPoint = 'src/main.js'): string
  {
    // 1. ตรวจสอบโหมด Development
    // เช็คจาก CI_ENVIRONMENT หรือ Environment Variable ที่เราอาจตั้งเพิ่ม
    if (is_vite_dev()) {
      return vite_dev_tag($entryPoint);
    }

    // 2. ถ้าไม่ใช่ Dev (เป็น Production/Build) ให้โหลดจาก Manifest
    return vite_prod_tag($entryPoint);
  }
}

if (!function_exists('is_vite_dev')) {
  function is_vite_dev(): bool
  {
    // Logic ง่ายๆ: ถ้า CI_ENVIRONMENT เป็น development ให้ถือว่าเป็น Dev Mode
    // (ในอนาคตอาจจะเพิ่มการเช็คไฟล์ .lock หรือ ping ไปที่ port 5173 ก็ได้)
    return getenv('CI_ENVIRONMENT') === 'development';
  }
}

if (!function_exists('vite_dev_tag')) {
  function vite_dev_tag(string $entryPoint): string
  {
    $host = 'http://localhost:5173'; // Vite Dev Server URL

    // ต้องโหลด @vite/client ก่อน เพื่อให้ HMR ทำงาน
    // จากนั้นค่อยโหลดไฟล์ Entry Point ของเรา
    return sprintf(
      '<script type="module" src="%s/@vite/client"></script>' . "\n" .
        '<script type="module" src="%s/%s"></script>',
      $host,
      $host,
      $entryPoint
    );
  }
}

if (!function_exists('vite_prod_tag')) {
  function vite_prod_tag(string $entryPoint): string
  {
    // Path ของไฟล์ Manifest ที่ Vite Build ออกมา
    // ตาม config: outDir อยู่ที่ assets/.vite
    $manifestPath = FCPATH . 'assets/.vite/.vite/manifest.json';

    if (!file_exists($manifestPath)) {
      // กรณีลืม Build
      return "";
    }

    $manifest = json_decode(file_get_contents($manifestPath), true);

    // หา Key ให้เจอ (Vite มักจะใช้ path relative จาก root project)
    if (!isset($manifest[$entryPoint])) {
      return "";
    }

    $tags = '';
    $entry = $manifest[$entryPoint];

    // 1. สร้าง Link CSS (ถ้ามี)
    if (!empty($entry['css'])) {
      foreach ($entry['css'] as $cssFile) {
        // base_url จะชี้ไปที่ http://local.test/assets/.vite/...
        $tags .= sprintf('<link rel="stylesheet" href="%s">' . "\n", base_url('assets/.vite/' . $cssFile));
      }
    }

    // 2. สร้าง Script Tag หลัก
    $tags .= sprintf('<script type="module" src="%s"></script>' . "\n", base_url('assets/.vite/' . $entry['file']));

    // 3. (Optional) Preload chunks
    if (!empty($entry['imports'])) {
      foreach ($entry['imports'] as $import) {
        if (isset($manifest[$import]['file'])) {
          $tags .= sprintf('<link rel="modulepreload" href="%s">' . "\n", base_url('assets/.vite/' . $manifest[$import]['file']));
        }
      }
    }

    return $tags;
  }
}
