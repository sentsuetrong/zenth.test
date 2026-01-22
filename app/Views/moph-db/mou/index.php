<?= $this->extend('layouts/moph-db/main') ?>

<?= $this->section('content') ?>

<div id="main-wrapper" class="relative w-full h-screen flex flex-row overflow-hidden">
  <aside id="sidebar-left" class="custom-scrollbar relative max-w-80 w-full bg-white border-r border-gray-200 flex flex-col grow item-center justify-between overflow-y-scroll overflow-x-hidden z-20">
    <!-- Sidebar Header -->
    <div class="p-4 border-b border-gray-100 bg-gray-50">
      <h2 class="text-sm font-semibold text-gray-700 uppercase tracking-wider">
        <i class="fa-solid fa-filter mr-2 text-emerald-600"></i> ตัวเลือกการค้นหา
      </h2>
    </div>

    <p class="p-4 pb-2 text-gray-600">
      <small>ผลการค้นหา (<?= isset($execution_time) ? $execution_time : '0.0000' ?> วินาที)</small>
    </p>
    <!-- Sidebar Footer -->
    <div class="p-2 border-t border-gray-200 text-center text-xs text-gray-400">
      <img
        class="w-60 pb-2 mx-auto"
        src="<?= site_url('/assets/Logo-LAD-OPS-MOPH.png') ?>"
        alt="Logo <?= isset($agency_short_name) ? htmlspecialchars($agency_short_name) : '' ?>, Logo <?= isset($agency_short_name_en) ? htmlspecialchars($agency_short_name_en) : '' ?>"
        title="Logo <?= isset($agency_short_name) ? htmlspecialchars($agency_short_name) : '' ?>, Logo <?= isset($agency_short_name_en) ? htmlspecialchars($agency_short_name_en) : '' ?>">
      <p title="©<?= date('Y') ?>&nbsp;<?= isset($system_name_en) ? htmlspecialchars($system_name_en) : 'MOPH MOU DATABASE' ?>">
        ©<?= date('Y') + 543 ?>&nbsp;<?= isset($system_name) ? $system_name : 'ระบบสืบค้นบันทึกความเข้าใจและความร่วมมือ (MoU)' ?>
        |&nbsp;<?= isset($agency_name) ? htmlspecialchars($agency_name) : 'กองกฎหมาย สำนักงานปลัดกระทรวงสาธารณสุข กระทรวงสาธารณสุข' ?>
      </p>
    </div>
  </aside>
  <main class="relative flex flex-col grow">
    <div class="breadcrumb p-2">
      <button id="btn-sidebar" type="button" onclick="toggleSidebar()" class="md:hidden flex items-center cursor-pointer p-2">
        <i class="fa-solid fa-list"></i>
      </button>
      <!-- TODO: ปรับ md:hidden flex ของ sidebar และแก้ไข mou.js -->
    </div>
    <div id="content-wrapper" class="custom-scrollbar flex grow overflow-y-scroll overflow-x-hidden">

    </div>
  </main>
</div>

<?= $this->endSection() ?>