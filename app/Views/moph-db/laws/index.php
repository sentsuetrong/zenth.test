<?= $this->extend('layouts/moph-db/main') ?>

<?= $this->section('content') ?>

<aside id="sidebar-left" class="custom-scrollbar gpu-accelerated fixed top-15 max-w-80 w-full h-[calc(100vh-60px)] bg-white border-r border-gray-200 -translate-x-full lg:translate-x-0 shadow-xl lg:shadow-none flex flex-col grow item-center justify-between overflow-y-scroll overflow-x-hidden z-20">
  <div class="p-4">
    <h2 class="text-lg font-bold text-emerald-800 mb-4">ค้นหากฎหมาย</h2>
    <form action="<?= site_url('moph-db/laws/search') ?>" method="get">
      <div class="space-y-4">
        <div>
          <label class="block text-xs font-bold text-gray-500 uppercase mb-2">คำค้นหา</label>
          <div class="relative">
            <input type="text" name="q" value="<?= isset($search_term) ? esc($search_term) : '' ?>" placeholder="ชื่อกฎหมาย, เนื้อหา..." class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 outline-none transition text-sm">
            <i class="fa-solid fa-search absolute left-3 top-2.5 text-gray-400"></i>
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-gray-500 uppercase mb-2">ประเภทกฎหมาย</label>
          <div id="laws-type"></div>
        </div>

        <div>
          <label class="block text-xs font-bold text-gray-500 uppercase mb-2">สถานะ</label>
          <div id="laws-status"></div>
        </div>

        <button type="submit" class="w-full mt-2 bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 transition font-medium">
          <i class="fa-solid fa-magnifying-glass mr-2"></i> ค้นหา
        </button>
      </div>
    </form>
  </div>

  <!-- Sidebar Footer -->
  <div class="p-2 border-t border-gray-200 text-center text-xs text-gray-400">
    <img
      class="w-60 pb-2 mx-auto"
      src="<?= base_url('/assets/Logo-LAD-OPS-MOPH.png') ?>"
      alt="Logo">
    <p>
      ©<?= date('Y') + 543 ?>&nbsp;<?= isset($system_name) ? $system_name : 'ระบบคลังข้อมูลกฎหมาย' ?>
      <br><?= isset($agency_short_name) ? esc($agency_short_name) : '' ?>
    </p>
  </div>
</aside>

<div id="main-wrapper" class="min-h-screen lg:ml-80 pt-15 flex flex-col transition-all duration-300">
  <main class="p-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-gray-800">
        <i class="fa-solid fa-gavel text-emerald-600 mr-2"></i>
        รายการกฎหมายและระเบียบ
      </h1>
      <?php if(isset($search_term)): ?>
        <a href="<?= site_url('moph-db/laws') ?>" class="text-sm text-emerald-600 hover:underline">ล้างการค้นหา</a>
      <?php endif; ?>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <table class="w-full text-left">
        <thead class="bg-gray-50 border-b border-gray-100">
          <tr>
            <th class="px-6 py-4 text-sm font-semibold text-gray-600">ชื่อกฎหมาย / ระเบียบ</th>
            <th class="px-6 py-4 text-sm font-semibold text-gray-600 w-32">เลขที่</th>
            <th class="px-6 py-4 text-sm font-semibold text-gray-600 w-32">สถานะ</th>
            <th class="px-6 py-4 text-sm font-semibold text-gray-600 w-24">จัดการ</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
          <?php if (!empty($laws)): ?>
            <?php foreach ($laws as $law): ?>
              <tr class="hover:bg-gray-50/50 transition">
                <td class="px-6 py-4">
                  <div class="text-sm font-medium text-gray-900"><?= esc($law['title']) ?></div>
                  <div class="text-xs text-gray-500 mt-1 line-clamp-1"><?= esc(strip_tags($law['content'])) ?></div>
                </td>
                <td class="px-6 py-4 text-sm text-gray-600">
                  <?= esc($law['law_no'] ?: '-') ?>
                </td>
                <td class="px-6 py-4">
                  <span class="px-2 py-1 text-xs font-medium rounded-full <?= $law['status'] === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700' ?>">
                    <?= $law['status'] === 'active' ? 'มีผลบังคับ' : 'ยกเลิก' ?>
                  </span>
                </td>
                <td class="px-6 py-4 text-sm">
                  <a href="<?= site_url('moph-db/laws/' . $law['id']) ?>" class="text-emerald-600 hover:text-emerald-800 transition">
                    <i class="fa-solid fa-eye"></i>
                  </a>
                </td>
              </tr>
            <?php endforeach; ?>
          <?php else: ?>
            <tr>
              <td colspan="4" class="px-6 py-10 text-center text-gray-500">
                <i class="fa-solid fa-folder-open text-4xl mb-3 block text-gray-200"></i>
                ไม่พบข้อมูลกฎหมาย
              </td>
            </tr>
          <?php endif; ?>
        </tbody>
      </table>
    </div>

    <div class="mt-6">
      <?= $pager->links() ?>
    </div>
  </main>
</div>

<?= $this->endSection() ?>