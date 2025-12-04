<!DOCTYPE html>
<html lang="th">

<head>
  <meta charset="UTF-8">
  <title><?= isset($title) ? esc($title, 'attr') . ' - ' : ''; ?>กองกฎหมาย สำนักงานปลัดกระทรวงสาธารณสุข</title>

  <meta name="title" content="กองกฎหมาย สำนักงานปลัดกระทรวงสาธารณสุข | Legal Affairs Division - Office of the Secretary Permanent for Ministry Of Public Health">
  <meta name="description" content="กองกฎหมาย สำนักงานปลัดกระทรวงสาธารณสุข เป็นศูนย์กลางทางวิชาการด้านกฎหมายการแพทย์และการสาธารณสุขตามหลักธรรมาภิบาล">
  <meta name="keywords" content="กองกฎหมาย, สำนักงานปลัดกระทรวงสาธารณสุข, กระทรวงสาธารณสุข, Legal, Legal Affairs Division, Legal MOPH, Ministry Of Public Health, MOPH">
  <meta name="robots" content="index, follow">
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <meta name="language" content="Thai">

  <meta property="og:site_name" content="กองกฎหมาย สำนักงานปลัดกระทรวงสาธารณสุข | Legal Affairs Division - Office of the Secretary Permanent for Ministry Of Public Health">
  <meta property="og:url" content="<?= current_url() ?>">
  <meta property="og:description" content="กองกฎหมาย สำนักงานปลัดกระทรวงสาธารณสุข เป็นศูนย์กลางทางวิชาการด้านกฎหมายการแพทย์และการสาธารณสุขตามหลักธรรมาภิบาล">
  <meta property="og:type" content="object">
  <meta property="og:image" content="<?= base_url('assets/images/LADOPSMOPH_icon.png') ?>">
  <meta property="og:image:type" content="image/png">
  <meta property="og:image:width" content="512">
  <meta property="og:image:height" content="579">
  <meta property="og:image:alt" content="กองกฎหมาย สำนักงานปลัดกระทรวงสาธารณสุข | Legal Affairs Division - Office of the Secretary Permanent for Ministry Of Public Health">

  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="กองกฎหมาย สำนักงานปลัดกระทรวงสาธารณสุข | Legal Affairs Division - Office of the Secretary Permanent for Ministry Of Public Health">
  <meta name="twitter:description" content="กองกฎหมาย สำนักงานปลัดกระทรวงสาธารณสุข เป็นศูนย์กลางทางวิชาการด้านกฎหมายการแพทย์และการสาธารณสุขตามหลักธรรมาภิบาล">
  <meta name="twitter:image" content="<?= base_url('assets/images/LADOPSMOPH_icon.png') ?>">

  <?= csrf_meta(); ?>

  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="shortcut icon" type="image/png" href="/favicon.ico">
  <link rel="stylesheet" href="assets/css/styles.css">
</head>

<body>

  <?= $this->renderSection('content') ?>

</body>

</html>