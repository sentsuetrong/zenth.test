<?= $this->extend('layouts/moph-db/main') ?>

<?= $this->section('content') ?>

<div id="main-wrapper" class="min-h-screen pt-15 flex flex-col transition-all duration-300">
  <main class="p-6 bg-gray-50 flex-grow">
    <div class="max-w-4xl mx-auto">
      
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <a href="<?= site_url('moph-db/laws') ?>" class="flex items-center text-blue-600 hover:text-blue-700 transition">
          <i class="fa-solid fa-arrow-left mr-2"></i>
          กลับสู่รายการกฎหมาย
        </a>
        <div class="flex gap-2">
          <button class="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition">
            <i class="fa-solid fa-print mr-2"></i> พิมพ์
          </button>
        </div>
      </div>

      <!-- Detail Card -->
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="p-8 border-b border-gray-100 bg-blue-50/30">
          <div class="flex justify-between items-start mb-4">
            <span class="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full uppercase">กฎหมาย / ระเบียบ</span>
            <span class="px-3 py-1 text-xs font-medium rounded-full <?= $law['status'] === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700' ?>">
              <i class="fa-solid fa-circle text-[8px] mr-1.5 mb-0.5"></i>
              <?= $law['status'] === 'active' ? 'มีผลบังคับใช้งาน' : 'ยกเลิกการบังคับใช้' ?>
            </span>
          </div>
          <h1 class="text-3xl font-bold text-gray-900 leading-tight mb-4"><?= esc($law['title']) ?></h1>
          <?php if($law['law_no']): ?>
            <p class="text-sm text-gray-500 font-medium">เลขที่อ้างอิง: <span class="text-gray-800"><?= esc($law['law_no']) ?></span></p>
          <?php endif; ?>
        </div>

        <div class="p-8 space-y-6">
          <!-- Content -->
          <div>
            <h2 class="text-sm font-bold text-blue-800 uppercase tracking-wider mb-4 flex items-center">
              <i class="fa-solid fa-file-lines mr-2"></i>
              เนื้อหาและรายละเอียด
            </h2>
            <div class="prose max-w-none text-gray-700 leading-relaxed">
              <?= $law['content'] ?>
            </div>
          </div>

          <!-- Metadata -->
          <div class="mt-8 pt-8 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="text-xs text-gray-400">
              <span class="block mb-1 italic">บันทึกเมื่อ: <?= date('d/m/Y H:i', strtotime($law['created_at'])) ?></span>
              <span class="block italic">อัปเดตล่าสุด: <?= date('d/m/Y H:i', strtotime($law['updated_at'])) ?></span>
            </div>
          </div>
        </div>
      </div>

    </div>
  </main>
</div>

<?= $this->endSection() ?>
