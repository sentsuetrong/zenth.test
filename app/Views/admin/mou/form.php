<?= $this->extend('layouts/moph-db/main') ?>

<?= $this->section('content') ?>
<div class="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
  <div class="px-4 py-6 sm:px-0">
    <div class="mb-6">
      <h1 class="text-2xl font-semibold text-gray-900"><?= esc($title) ?></h1>
    </div>

    <?php if (session()->has('errors')) : ?>
      <div class="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
        <ul>
          <?php foreach (session('errors') as $error) : ?>
            <li><?= esc($error) ?></li>
          <?php endforeach; ?>
        </ul>
      </div>
    <?php endif; ?>

    <div class="bg-white shadow sm:rounded-lg">
      <div class="px-4 py-5 sm:p-6">
        <form action="<?= isset($mou) ? site_url('admin/mou/update/' . $mou['id']) : site_url('admin/mou/create') ?>" method="POST">
          <?= csrf_field() ?>
          <input type="hidden" name="file_uuid" id="file_uuid" value="<?= esc(old('file_uuid', $mou['file_uuid'] ?? '')) ?>">

          <div class="grid grid-cols-6 gap-6">
            <div class="col-span-6">
              <label for="title" class="block text-sm font-medium text-gray-700">ชื่อเรื่องย่อ</label>
              <input type="text" name="title" id="title" value="<?= esc(old('title', $mou['title'] ?? '')) ?>" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
            </div>

            <div class="col-span-6">
              <label for="full_title" class="block text-sm font-medium text-gray-700">ชื่อเรื่องเต็ม</label>
              <textarea name="full_title" id="full_title" rows="3" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"><?= esc(old('full_title', $mou['full_title'] ?? '')) ?></textarea>
            </div>

            <div class="col-span-6 sm:col-span-3">
              <label for="effective_from" class="block text-sm font-medium text-gray-700">วันที่เริ่มมีผล</label>
              <input type="date" name="effective_from" id="effective_from" value="<?= esc(old('effective_from', isset($mou['effective_from']) ? date('Y-m-d', strtotime($mou['effective_from'])) : '')) ?>" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
            </div>

            <div class="col-span-6 sm:col-span-3">
              <label for="effective_to" class="block text-sm font-medium text-gray-700">วันที่สิ้นสุด (ถ้ามี)</label>
              <input type="date" name="effective_to" id="effective_to" value="<?= esc(old('effective_to', isset($mou['effective_to']) ? date('Y-m-d', strtotime($mou['effective_to'])) : '')) ?>" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
            </div>

            <div class="col-span-6">
              <label for="parties-select-container" class="block text-sm font-medium text-gray-700 mb-1">ภาคีเครือข่ายที่เกี่ยวข้อง</label>
              <div id="parties-select-container"></div>
              <div id="parties-hidden-inputs"></div>
            </div>

            <div class="col-span-6">
              <label class="block text-sm font-medium text-gray-700 mb-2">อัปโหลดไฟล์ (PDF เท่านั้น)</label>
              <div id="mou-dropzone" class="dropzone border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                <div class="dz-message">
                  <i class="fa-solid fa-cloud-arrow-up text-4xl text-gray-400 mb-2"></i>
                  <p class="text-sm text-gray-600">ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์</p>
                </div>
              </div>
              <div id="file-status" class="mt-2 text-sm text-green-600 <?= isset($mou['file_uuid']) ? '' : 'hidden' ?>">
                <i class="fa-solid fa-check-circle mr-1"></i> ไฟล์อัปโหลดแล้ว: <?= isset($mou['file_uuid']) ? 'มีการเลือกไฟล์เดิมไว้' : 'อัปโหลดไฟล์เรียบร้อยแล้ว' ?>
              </div>
            </div>

            <div class="col-span-6">
              <label for="objective" class="block text-sm font-medium text-gray-700">วัตถุประสงค์</label>
              <textarea name="objective" id="objective" rows="5" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"><?= esc(old('objective', $mou['objective'] ?? '')) ?></textarea>
            </div>
          </div>

          <div class="mt-6 flex justify-end space-x-3">
            <a href="<?= site_url('admin/mou') ?>" class="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              ยกเลิก
            </a>
            <button type="submit" class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              บันทึกข้อมูล
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</div>

<link rel="stylesheet" href="https://unpkg.com/dropzone@5/dist/min/dropzone.min.css" />
<script src="https://unpkg.com/dropzone@5/dist/min/dropzone.min.js"></script>

<script>
  Dropzone.autoDiscover = false;

  document.addEventListener('DOMContentLoaded', function() {
    // Initialize SmartSelect
    const partiesData = <?= json_encode(array_map(function($p) {
      return ['value' => $p->id, 'label' => $p->name];
    }, $parties)) ?>;
    
    const selectedParties = <?= json_encode(old('parties', $selectedParties ?? [])) ?>;

    const smartSelect = new SmartSelect('parties-select-container', partiesData, {
      placeholder: 'ค้นหาหรือเลือกภาคีเครือข่าย...',
      selected: selectedParties,
      onSelectionChange: function(values) {
        const container = document.getElementById('parties-hidden-inputs');
        container.innerHTML = '';
        values.forEach(val => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = 'parties[]';
          input.value = val;
          container.appendChild(input);
        });
      }
    });

    // Initial call to sync hidden inputs
    smartSelect.triggerChange();

    const mouDropzone = new Dropzone("#mou-dropzone", {
      url: "<?= base_url('admin/upload/chunk') ?>",
      method: "post",
      paramName: "file",
      acceptedFiles: ".pdf",
      maxFiles: 1,
      chunking: true,
      forceChunking: true,
      chunkSize: 1024 * 1024, // 1MB chunks
      parallelChunkUploads: false,
      retryChunks: true,
      retryChunksLimit: 3,

      init: function() {
        this.on("sending", function(file, xhr, formData) {
          formData.append("<?= csrf_token() ?>", "<?= csrf_hash() ?>");
        });

        this.on("success", function(file, response) {
          if (response.status === 'completed') {
            document.getElementById('file_uuid').value = response.file_uuid;
            document.getElementById('file-status').classList.remove('hidden');
          }
        });
      }
    });
  });
</script>
<?= $this->endSection() ?>
