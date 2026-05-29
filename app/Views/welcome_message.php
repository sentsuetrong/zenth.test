<?= $this->extend('layouts/moph-db/main') ?>

<?= $this->section('content') ?>

<div id="main-wrapper" class="min-h-screen pt-15 flex flex-col transition-all duration-300">
  <main class="flex-grow flex items-center justify-center p-6 bg-gray-50">
    <div class="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8">
      
      <!-- MOU Card -->
      <a href="<?= site_url('moph-db/mou') ?>" class="group bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-emerald-200 transition-all duration-300 transform hover:-translate-y-1">
        <div class="w-16 h-16 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 text-3xl mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
          <i class="fa-solid fa-file-signature"></i>
        </div>
        <h2 class="text-2xl font-bold text-gray-800 mb-3">บันทึกความร่วมมือ (MOU)</h2>
        <p class="text-gray-500 mb-6">คลังข้อมูลสำหรับสืบค้นบันทึกความร่วมมือและบันทึกความเข้าใจของหน่วยงาน</p>
        <span class="inline-flex items-center text-emerald-600 font-semibold group-hover:translate-x-2 transition-transform">
          เข้าสู่ระบบสืบค้น <i class="fa-solid fa-arrow-right ml-2"></i>
        </span>
      </a>

      <!-- Laws Card -->
      <a href="<?= site_url('moph-db/laws') ?>" class="group bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-emerald-200 transition-all duration-300 transform hover:-translate-y-1">
        <div class="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 text-3xl mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
          <i class="fa-solid fa-gavel"></i>
        </div>
        <h2 class="text-2xl font-bold text-gray-800 mb-3">กฎหมายและระเบียบ</h2>
        <p class="text-gray-500 mb-6">รวบรวมกฎหมาย ระเบียบ และข้อบังคับต่างๆ ที่เกี่ยวข้องกับกระทรวงสาธารณสุข</p>
        <span class="inline-flex items-center text-blue-600 font-semibold group-hover:translate-x-2 transition-transform">
          เข้าสู่คลังกฎหมาย <i class="fa-solid fa-arrow-right ml-2"></i>
        </span>
      </a>

      <!-- Admin/Upload Card -->
      <a href="<?= site_url('admin/upload') ?>" class="md:col-span-2 group bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all flex items-center justify-between">
        <div class="flex items-center">
          <div class="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 mr-4">
            <i class="fa-solid fa-cloud-arrow-up"></i>
          </div>
          <div>
            <h3 class="font-bold text-gray-800">จัดการไฟล์และข้อมูล</h3>
            <p class="text-sm text-gray-500">อัปโหลดไฟล์ขนาดใหญ่และจัดการข้อมูลพื้นฐาน</p>
          </div>
        </div>
        <i class="fa-solid fa-chevron-right text-gray-300 group-hover:text-emerald-500 transition-colors"></i>
      </a>

    </div>
  </main>
</div>

<?= $this->endSection() ?>
