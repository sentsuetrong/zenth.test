<div class="border-b border-gray-100">
  <div class="flex items-center justify-between border-b border-gray-100 bg-gray-50 p-4">
    <span class="text-sm font-semibold text-emerald-600 uppercase"> <i class="fa-solid fa-filter mr-2"></i>
      ตัวเลือกการค้นหา </span>
    <i class="fa-solid fa-chevron-down rotate-icon rotate-180 text-xs text-gray-400"></i>
  </div>

  <form method="get" action="<?= site_url('moph-db/mou') ?>" class="p-4">
    <!-- MOU search -->
    <label for="search-box"
      class="mb-2 block text-sm font-bold text-emerald-600 hover:text-emerald-500 cursor-pointer">ค้นหาบันทึกความร่วมมือ</label>
    <div class="relative">
      <input id="search-box" type="text" name="q" value="<?= isset($search_term) ? esc($search_term) : '' ?>" placeholder="พิมพ์คำค้นหา..."
        class="w-full h-12 text-slate-700 rounded-sm border border-gray-200 shadow-sm bg-white px-4 py-2 text-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 focus:outline-none focus-within:ring-4 focus-within:ring-emerald-50 focus-within:border-emerald-500 transition" autocomplete="on" />
    </div>

    <!-- Search Button -->
    <button type="submit" class="w-full mt-4 rounded-md bg-emerald-600 hover:bg-emerald-700 p-2 text-sm text-white transition cursor-pointer">
      <i class="fa-solid fa-magnifying-glass mr-1"></i>
      <span>ค้นหา</span>
    </button>

    <?php if (isset($search_term) && $search_term): ?>
      <a href="<?= site_url('moph-db/mou') ?>" class="block text-center mt-2 text-xs text-gray-500 hover:text-emerald-600">
        ล้างการค้นหา
      </a>
    <?php endif; ?>
  </form>
</div>