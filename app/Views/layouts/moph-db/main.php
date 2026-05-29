<?= $this->include('layouts/moph-db/header') ?>

<div id="header-bar" class="fixed top-0 w-full h-15 bg-white shadow-md flex z-30">
  <!-- Logo -->
  <div class="flex items-center p-2 max-w-full w-full">
    <div class="flex items-center shrink-0 gap-3">
      <div class="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center text-white text-xl shadow-sm">
        <i class="fa-solid fa-handshake"></i>
      </div>
      <a class="hidden md:block" href="#">
        <h1 class="text-xl font-bold text-emerald-800 uppercase"><?= isset($system_name_en) ? $system_name_en : 'MOPH DATABASE' ?></h1>
        <p class="text-xs text-gray-500 truncate"><?= isset($system_name) ? $system_name : 'ระบบคลังข้อมูล กระทรวงสาธารณสุข' ?></p>
      </a>
      <a class="md:hidden block" href="#">
        <h1 class="text-xl font-bold text-emerald-800 uppercase"><?= isset($system_name_en) ? $system_name_en : 'MOPH DB' ?></h1>
        <p class="text-xs text-gray-500 truncate"><?= isset($system_name) ? $system_name : 'ระบบคลังข้อมูล สธ.' ?></p>
      </a>
    </div>
  </div>
</div>

<?= $this->renderSection('content') ?>

<?= $this->include('layouts/moph-db/footer') ?>