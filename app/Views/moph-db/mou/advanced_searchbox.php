<div class="border-b border-gray-100">
  <div class="flex items-center justify-between border-b border-gray-100 bg-gray-50 p-4">
    <span class="text-sm font-semibold text-emerald-600 uppercase"> <i class="fa-solid fa-filter mr-2"></i>
      ตัวเลือกการค้นหา </span>
    <i class="fa-solid fa-chevron-down rotate-icon rotate-180 text-xs text-gray-400"></i>
  </div>

  <form method="post" class="p-4">
    <!-- Laws name -->
    <label for="search-box"
      class="mb-2 block text-sm font-bold text-emerald-600 hover:text-emerald-500 cursor-pointer">กฎหมาย</label>
    <div class="relative">
      <input id="search-box" type="text" placeholder="พิมพ์คำค้นหา..."
        class="w-full h-12 text-slate-700 rounded-sm border border-gray-200 shadow-sm bg-white px-4 py-2 text-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 focus:outline-none focus-within:ring-4 focus-within:ring-emerald-50 focus-within:border-emerald-500 transition" autocomplete="on" />
    </div>
    <!-- Search box -->
    <div class="mt-2 mb-4 flex">
      <div class="flex gap-3 text-sm">
        <div class="flex gap-2">
          <div class="flex h-5 shrink-0 items-center">
            <div class="group grid size-4 grid-cols-1">
              <input id="search-filter-name" type="checkbox" name="filter[]" value="name"
                class="col-start-1 row-start-1 appearance-none rounded-sm border border-gray-300 bg-white checked:border-emerald-600 checked:bg-emerald-600 indeterminate:border-emerald-600 indeterminate:bg-emerald-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:border-gray-300 disabled:bg-gray-100 disabled:checked:bg-gray-100 forced-colors:appearance-auto" />
              <svg viewBox="0 0 14 14" fill="none"
                class="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white group-has-disabled:stroke-gray-950/25">
                <path d="M3 8L6 11L11 3.5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                  class="opacity-0 group-has-checked:opacity-100" />
                <path d="M3 7H11" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                  class="opacity-0 group-has-indeterminate:opacity-100" />
              </svg>
            </div>
          </div>
          <label for="search-filter-name" class="min-w-0 flex-1 text-sm text-gray-500">ค้นจากชื่อ</label>
        </div>
        <div class="flex gap-2">
          <div class="flex h-5 shrink-0 items-center">
            <div class="group grid size-4 grid-cols-1">
              <input id="search-filter-content" type="checkbox" name="filter[]" value="content"
                class="col-start-1 row-start-1 appearance-none rounded-sm border border-gray-300 bg-white checked:border-emerald-600 checked:bg-emerald-600 indeterminate:border-emerald-600 indeterminate:bg-emerald-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:border-gray-300 disabled:bg-gray-100 disabled:checked:bg-gray-100 forced-colors:appearance-auto" />
              <svg viewBox="0 0 14 14" fill="none"
                class="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white group-has-disabled:stroke-gray-950/25">
                <path d="M3 8L6 11L11 3.5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                  class="opacity-0 group-has-checked:opacity-100" />
                <path d="M3 7H11" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                  class="opacity-0 group-has-indeterminate:opacity-100" />
              </svg>
            </div>
          </div>
          <label for="search-filter-content" class="min-w-0 flex-1 text-sm text-gray-500">ค้นจากเนื้อหา</label>
        </div>
      </div>
    </div>
    <!-- Search Legals Type Box -->
    <label for="laws-type-input"
      class="mb-2 block text-sm font-bold text-emerald-600 hover:text-emerald-500 cursor-pointer">ประเภท <smal class="text-xs font-normal text-slate-600">(<span class="text-red-500 font-bold">*</span> หลายตัวเลือก)</smal></label>
    <div id="laws-type" class="mb-4"></div>

    <!-- Search Legals status Box -->
    <label for="laws-status-input"
      class="mb-2 block text-sm font-bold text-emerald-600 hover:text-emerald-500 cursor-pointer">สถานะ</label>
    <div id="laws-status"></div>

    <!-- Search Button -->
    <button type="button" class="w-full mt-4 rounded-md bg-emerald-600 p-2 text-sm text-white">
      <i class="fa-solid fa-magnifying-glass mr-1"></i>
      <span>ค้นหา</span>
    </button>
  </form>
</div>