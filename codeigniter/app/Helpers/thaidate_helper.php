<?php

if (!function_exists('thai_date_format')) {
  function thai_date_format($dateString, $format = 'full')
  {
    if (empty($dateString) || $dateString == '0000-00-00' || $dateString == '0000-00-00 00:00:00') return '';

    $timestamp = strtotime($dateString);
    $thai_months = [
      1 => 'มกราคม',
      2 => 'กุมภาพันธ์',
      3 => 'มีนาคม',
      4 => 'เมษายน',
      5 => 'พฤษภาคม',
      6 => 'มิถุนายน',
      7 => 'กรกฎาคม',
      8 => 'สิงหาคม',
      9 => 'กันยายน',
      10 => 'ตุลาคม',
      11 => 'พฤศจิกายน',
      12 => 'ธันวาคม'
    ];

    $year = date('Y', $timestamp) + 543;
    $month = date('n', $timestamp);
    $day = date('j', $timestamp);

    if ($format === 'short') {
      return "$day/$month/$year"; // หรือใช้เดือนย่อตามต้องการ
    }

    return "$day " . $thai_months[$month] . " $year";
  }
}

if (!function_exists('convert_thai_input_to_mysql')) {
  function convert_thai_input_to_mysql($inputDate)
  {
    // รองรับ d/m/y (พ.ศ.) เช่น 10/12/69 หรือ 10/12/2569
    if (empty($inputDate)) return null;

    $parts = explode('/', $inputDate);
    if (count($parts) !== 3) return null;

    $d = (int)$parts[0];
    $m = (int)$parts[1];
    $y = (int)$parts[2];

    // Logic ปี 2 หลัก
    if ($y < 100) {
      $y += 2500;
    }

    $ad_year = $y - 543; // แปลงเป็น ค.ศ.

    return sprintf('%04d-%02d-%02d', $ad_year, $m, $d);
  }
}
