<!DOCTYPE html>
<html lang="th">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><?= esc((isset($title) ? $title . ' | ' : '') . (isset($system_name) ? $system_name : 'กองกฎหมาย สำนักงานปลัดกระทรวงสาธารณสุข'), 'attr', 'UTF-8') ?></title>

  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css">
  <link rel="stylesheet" href="<?= base_url('/assets/css/compiled-main.css?v=' . time()) ?>">
  <link rel="stylesheet" href="<?= base_url('/assets/css/toastify.min.css') ?>">

  <script src="<?= base_url('/assets/js/smart-select.js?v=' . time()) ?>"></script>
  <script src="<?= base_url('/assets/js/main.js?v=' . time()) ?>"></script>
  <script src="<?= base_url('/assets/js/toastify.js') ?>"></script>
</head>

<body class="custom-scrollbar overflow-x-hidden">