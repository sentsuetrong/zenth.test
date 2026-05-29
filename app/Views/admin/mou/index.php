<?= $this->extend('layouts/moph-db/main') ?>

<?= $this->section('content') ?>
<div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
  <div class="px-4 py-6 sm:px-0">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-semibold text-gray-900"><?= esc($title) ?></h1>
      <a href="<?= site_url('admin/mou/new') ?>" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
        <i class="fa-solid fa-plus mr-2"></i> เพิ่ม MOU ใหม่
      </a>
    </div>

    <?php if (session()->has('message')) : ?>
      <div class="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
        <span class="block sm:inline"><?= session('message') ?></span>
      </div>
    <?php endif; ?>

    <div class="bg-white shadow overflow-hidden sm:rounded-md">
      <ul role="list" class="divide-y divide-gray-200">
        <?php foreach ($mous as $mou) : ?>
          <li>
            <div class="px-4 py-4 flex items-center sm:px-6">
              <div class="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between">
                <div class="truncate">
                  <div class="flex text-sm">
                    <p class="font-medium text-blue-600 truncate"><?= esc($mou['title']) ?></p>
                    <p class="ml-1 flex-shrink-0 font-normal text-gray-500">
                      (<?= esc($mou['buddhistyear_effective_from']) ?>)
                    </p>
                  </div>
                  <div class="mt-2 flex">
                    <div class="flex items-center text-sm text-gray-500">
                      <i class="fa-solid fa-building mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400"></i>
                      <p>
                        <?= esc($mou['parties_names']) ?>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div class="ml-5 flex-shrink-0 flex space-x-2">
                <a href="<?= site_url('admin/mou/edit/' . $mou['id']) ?>" class="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  <i class="fa-solid fa-pen-to-square mr-1"></i> แก้ไข
                </a>
                <a href="<?= site_url('admin/mou/delete/' . $mou['id']) ?>" onclick="return confirm('ยืนยันการลบ?')" class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                  <i class="fa-solid fa-trash-can mr-1"></i> ลบ
                </a>
              </div>
            </div>
          </li>
        <?php endforeach; ?>
      </ul>
    </div>
  </div>
</div>
<?= $this->endSection() ?>
