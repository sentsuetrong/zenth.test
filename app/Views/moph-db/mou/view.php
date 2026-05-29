<?= $this->extend('layouts/moph-db/main') ?>

<?= $this->section('content') ?>

<div id="main-wrapper" class="min-h-screen pt-15 flex flex-col transition-all duration-300">
  <main class="p-6 bg-gray-50 flex-grow">
    <div class="max-w-4xl mx-auto">
      
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <a href="<?= site_url('moph-db/mou') ?>" class="flex items-center text-emerald-600 hover:text-emerald-700 transition">
          <i class="fa-solid fa-arrow-left mr-2"></i>
          กลับสู่รายการสืบค้น
        </a>
        <div class="flex gap-2">
          <button class="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition">
            <i class="fa-solid fa-print mr-2"></i> พิมพ์
          </button>
          <button class="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 transition">
            <i class="fa-solid fa-share-nodes mr-2"></i> แชร์
          </button>
        </div>
      </div>

      <!-- Detail Card -->
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="p-8 border-b border-gray-100 bg-emerald-50/30">
          <span class="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full mb-4 uppercase">บันทึกความร่วมมือ (MOU)</span>
          <h1 class="text-3xl font-bold text-gray-900 leading-tight mb-4"><?= esc($mou['full_title'] ?: $mou['title']) ?></h1>
          <div class="flex flex-wrap gap-4 text-sm text-gray-500">
            <div class="flex items-center">
              <i class="fa-regular fa-calendar-check mr-2 text-emerald-600"></i>
              ปี พ.ศ. <?= esc($mou['buddhistyear_effective_from']) ?>
            </div>
            <div class="flex items-center">
              <i class="fa-solid fa-building mr-2 text-emerald-600"></i>
              <?= esc($mou['entity_name']) ?>
            </div>
          </div>
        </div>

        <div class="p-8 space-y-8">
          <!-- Objectives -->
          <div>
            <h2 class="text-sm font-bold text-emerald-800 uppercase tracking-wider mb-3">วัตถุประสงค์ / สาระสำคัญ</h2>
            <div class="text-gray-700 leading-relaxed">
              <?= $mou['objective'] ? nl2br(esc($mou['objective'])) : 'ไม่ระบุข้อมูลวัตถุประสงค์' ?>
            </div>
          </div>

          <!-- Parties -->
          <div>
            <h2 class="text-sm font-bold text-emerald-800 uppercase tracking-wider mb-3">หน่วยงานที่ร่วมลงนาม (ภาคี)</h2>
            <div class="flex flex-wrap gap-2">
              <?php if ($mou['parties_names']): ?>
                <?php foreach(explode(', ', $mou['parties_names']) as $party): ?>
                  <span class="px-3 py-1.5 bg-gray-50 border border-gray-100 text-gray-700 text-sm rounded-lg flex items-center">
                    <i class="fa-solid fa-handshake text-emerald-500 mr-2"></i>
                    <?= esc($party) ?>
                  </span>
                <?php endforeach; ?>
              <?php else: ?>
                <span class="text-sm text-gray-400 italic">ไม่มีข้อมูลภาคีร่วมลงนาม</span>
              <?php endif; ?>
            </div>
          </div>

          <!-- Dates -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gray-50 rounded-xl border border-gray-100">
            <div>
              <span class="block text-xs text-gray-400 uppercase font-bold mb-1">วันที่เริ่มมีผล</span>
              <span class="text-gray-800 font-medium"><?= $mou['effective_from'] ? date('d/m/', strtotime($mou['effective_from'])) . (date('Y', strtotime($mou['effective_from'])) + 543) : '-' ?></span>
            </div>
            <div>
              <span class="block text-xs text-gray-400 uppercase font-bold mb-1">วันที่สิ้นสุด</span>
              <span class="text-gray-800 font-medium"><?= $mou['effective_to'] ? date('d/m/', strtotime($mou['effective_to'])) . (date('Y', strtotime($mou['effective_to'])) + 543) : 'ไม่มีกำหนด' ?></span>
            </div>
          </div>

          <!-- Keywords -->
          <?php if($mou['keywords']): ?>
          <div>
            <h2 class="text-sm font-bold text-emerald-800 uppercase tracking-wider mb-3">คำสำคัญ (Keywords)</h2>
            <div class="flex flex-wrap gap-2">
              <?php foreach(explode(',', $mou['keywords']) as $tag): ?>
                <span class="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded">#<?= esc(trim($tag)) ?></span>
              <?php endforeach; ?>
            </div>
          </div>
          <?php endif; ?>
        </div>
      </div>

    </div>
  </main>
</div>

<?= $this->endSection() ?>
