<?= $this->extend('layouts/moph-db/main') ?>

<?= $this->section('content') ?>

<aside id="sidebar-left" class="custom-scrollbar gpu-accelerated fixed top-15 max-w-80 w-full h-[calc(100vh-60px)] bg-white border-r border-gray-200 -translate-x-full lg:translate-x-0 shadow-xl lg:shadow-none flex flex-col grow item-center justify-between overflow-y-scroll overflow-x-hidden z-20">
  <!-- Advanced Search Controller -->
  <?= $this->include('moph-db/mou/advanced_searchbox') ?>

  <p class="p-4 pb-2 text-gray-600">
    <small>ผลการค้นหา (<?= isset($execution_times['mous_groups']) ? $execution_times['mous_groups']['duration'] : '0.0000' ?> วินาที)</small>
  </p>
  <!-- Sidebar Footer -->
  <div class="p-2 border-t border-gray-200 text-center text-xs text-gray-400">
    <img
      class="w-60 pb-2 mx-auto"
      src="<?= base_url('/assets/Logo-LAD-OPS-MOPH.png') ?>"
      alt="Logo <?= isset($agency_short_name) ? htmlspecialchars($agency_short_name) : '' ?>, Logo <?= isset($agency_short_name_en) ? htmlspecialchars($agency_short_name_en) : '' ?>"
      title="Logo <?= isset($agency_short_name) ? htmlspecialchars($agency_short_name) : '' ?>, Logo <?= isset($agency_short_name_en) ? htmlspecialchars($agency_short_name_en) : '' ?>">
    <p title="©<?= date('Y') ?>&nbsp;<?= isset($system_name_en) ? htmlspecialchars($system_name_en) : 'MOPH MOU DATABASE' ?>">
      ©<?= date('Y') + 543 ?>&nbsp;<?= isset($system_name) ? $system_name : 'ระบบสืบค้นบันทึกความเข้าใจและความร่วมมือ (MoU)' ?>
      |&nbsp;<?= isset($agency_name) ? htmlspecialchars($agency_name) : 'กองกฎหมาย สำนักงานปลัดกระทรวงสาธารณสุข กระทรวงสาธารณสุข' ?>
    </p>
  </div>
</aside>

<div id="main-wrapper" class="min-h-screen lg:ml-80 pt-15 flex flex-col transition-all duration-300">
  <main class="min-h-screen flex flex-col transition-all duration-300">
    <div class="breadcrumb-wrapper p-2 flex items-center">
      <button id="btn-sidebar" type="button" onclick="toggleSidebar()" class="p-2 mr-2 md:hidden flex items-center cursor-pointer">
        <i class="fa-solid fa-list"></i>
      </button>
      <!-- TODO: ปรับ md:hidden flex ของ sidebar และแก้ไข mou.js -->
      <nav class="breadcrumb" aria-label="breadcrumb">
        <ol class="flex truncate" role="list">
          <li class="text-gray-600 mr-4 last:mr-0">
            <i class="fa-solid fa-home mr-2"></i>
            <a href="#" class="hover:text-gray-900">หน้าหลักสืบค้น</a>
          </li>
          <li class="text-gray-600 mr-4 last:mr-0">
            <i class="fa-solid fa-caret-right text-sm mr-4"></i>
            <a href="#" class="hover:text-gray-900">รายงานสถิติ</a>
          </li>
        </ol>
      </nav>
    </div>
    <div id="content-wrapper" class="custom-scrollbar flex grow overflow-y-scroll overflow-x-hidden">
      <!-- Category List (Years) -->
      <div id="sidebar-content" class="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar p-3 space-y-2">
        <?php if (isset($mous_groups) && is_array($mous_groups)): ?>
          <?php foreach ($mous_groups as $year => $mous): ?>
            <button type="button" data-year="<?= esc($year) ?>" onclick="expandYear('<?= esc($year) ?>')" class="btn-toggle w-full flex justify-between items-center px-4 py-3 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 rounded-lg transition focus:outline-none border border-transparent hover:border-gray-200 cursor-pointer">
              <div class="flex items-center">
                <i class="fa-regular fa-calendar-check text-emerald-600 mr-3"></i>
                ปี <?= esc($year) ?>
              </div>

              <div class="flex items-center">
                <span class="bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs font-bold mr-2"><?= count($mous) ?></span>
                <i id="icon-<?= esc($year) ?>" class="fa-solid fa-chevron-down text-gray-400 text-xs rotate-icon"></i>
              </div>
            </button>

            <div id="content-year-<?= esc($year) ?>" class="year-content hidden">
              <div class="py-2 space-y-1 border-l-2 border-gray-100 ml-4 pl-2">
                <?php if (isset($mous)): ?>
                  <?php foreach ($mous as $mou): ?>
                    <a href="<?= site_url('moph-db/mou/' . $mou['id']) ?>" data-id="<?= $mou['id'] ?>" 
                      class="reactive-link item<?= (isset($mou_id) && $mou['id'] === $mou_id) ? ' active' : '' ?> px-3 py-2 text-xs rounded-md transition group flex items-start">
                      <i class="fa-solid fa-file-lines mt-0.5 mr-2"></i>
                      <span class="line-clamp-2 truncate inline-block"><?= isset($mou['full_title']) ? esc($mou['full_title']) : esc($mou['title']) ?></span>
                    </a>
                  <?php endforeach; ?>
                <?php else: ?>
                  ยังไม่มีข้อมูล
                <?php endif; ?>
              </div>
            </div>
          <?php endforeach; ?>
        <?php endif; ?>

        <?php if (isset($mou_data)): ?>
          <button type="button" class="w-full flex justify-between items-center px-4 py-3 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 rounded-lg transition focus:outline-none border border-transparent hover:border-gray-200">

          </button>
        <?php endif; ?>
      </div>
    </div>
  </main>

  <div id="backdrop"
    class="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] z-40 hidden opacity-0 transition-opacity duration-300"
    aria-hidden="true"></div>
</div>

<?= $this->endSection() ?>