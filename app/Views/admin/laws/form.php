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
        <form action="<?= isset($law) ? site_url('admin/laws/update/' . $law['id']) : site_url('admin/laws/create') ?>" method="POST">
          <?= csrf_field() ?>
          <input type="hidden" name="file_uuid" id="file_uuid" value="<?= esc(old('file_uuid', $law['file_uuid'] ?? '')) ?>">

          <div class="grid grid-cols-6 gap-6">
            <div class="col-span-6">
              <label for="title" class="block text-sm font-medium text-gray-700">ชื่อกฎหมาย</label>
              <input type="text" name="title" id="title" value="<?= esc(old('title', $law['title'] ?? '')) ?>" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
            </div>

            <div class="col-span-6 sm:col-span-3">
              <label for="law_no" class="block text-sm font-medium text-gray-700">ลำดับ/เลขที่</label>
              <input type="text" name="law_no" id="law_no" value="<?= esc(old('law_no', $law['law_no'] ?? '')) ?>" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
            </div>

            <div class="col-span-6 sm:col-span-3">
              <label for="status" class="block text-sm font-medium text-gray-700">สถานะ</label>
              <select name="status" id="status" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                <option value="active" <?= old('status', $law['status'] ?? '') === 'active' ? 'selected' : '' ?>>ใช้งานอยู่</option>
                <option value="cancel" <?= old('status', $law['status'] ?? '') === 'cancel' ? 'selected' : '' ?>>ยกเลิก</option>
              </select>
            </div>

            <div class="col-span-6">
              <label class="block text-sm font-medium text-gray-700 mb-2">อัปโหลดไฟล์ (PDF เท่านั้น)</label>
              <div id="law-dropzone" class="dropzone border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                <div class="dz-message">
                  <i class="fa-solid fa-cloud-arrow-up text-4xl text-gray-400 mb-2"></i>
                  <p class="text-sm text-gray-600">ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์</p>
                </div>
              </div>
              <div id="file-status" class="mt-2 text-sm text-green-600 <?= isset($law['file_uuid']) ? '' : 'hidden' ?>">
                <i class="fa-solid fa-check-circle mr-1"></i> ไฟล์อัปโหลดแล้ว: <?= isset($law['file_uuid']) ? 'มีการเลือกไฟล์เดิมไว้' : 'อัปโหลดไฟล์เรียบร้อยแล้ว' ?>
              </div>
            </div>

            <div class="col-span-6">
              <label for="content" class="block text-sm font-medium text-gray-700">เนื้อหา/รายละเอียด</label>
              <textarea name="content" id="content" rows="10" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"><?= esc(old('content', $law['content'] ?? '')) ?></textarea>
            </div>
          </div>

          <div class="mt-6 flex justify-end space-x-3">
            <a href="<?= site_url('admin/laws') ?>" class="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
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
    const lawDropzone = new Dropzone("#law-dropzone", {
      url: "<?= base_url('admin/upload/chunk') ?>",
      method: "post",
      paramName: "file",
      acceptedFiles: ".pdf",
      maxFiles: 1,
      chunking: true,
      forceChunking: true,
      chunkSize: 512 * 1024, // 512KB chunks
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
