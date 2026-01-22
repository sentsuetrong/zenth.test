<?= $this->include('layouts/moph-db/header') ?>

<div id="header-bar" class="relative bg-white shadow-md flex z-30">
  <!-- Logo -->
  <div class="flex items-center p-2 max-w-full w-full">
    <div class="flex items-center shrink-0 gap-3">
      <div class="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center text-white text-xl shadow-sm">
        <i class="fa-solid fa-handshake"></i>
      </div>
      <div>
        <h1 class="text-xl font-bold text-emerald-800 uppercase"><?= isset($system_name_en) ? $system_name_en : 'MOPH MOU DATABASE' ?></h1>
        <p class="text-xs text-gray-500 truncate"><?= isset($system_name) ? $system_name : 'ระบบสืบค้นบันทึกความเข้าใจและความร่วมมือ (MoU)' ?></p>
      </div>
    </div>
  </div>
</div>

<?= $this->renderSection('content') ?>

<?= $this->include('layouts/moph-db/footer') ?>