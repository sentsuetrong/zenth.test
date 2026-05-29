<?= $this->extend('layouts/moph-db/main') ?>

<?= $this->section('content') ?>
<div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
  <div class="px-4 py-6 sm:px-0">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-semibold text-gray-900"><?= esc($title) ?></h1>
      <a href="<?= site_url('admin/laws/new') ?>" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
        <i class="fa-solid fa-plus mr-2"></i> เพิ่มกฎหมายใหม่
      </a>
    </div>

    <?php if (session()->has('message')) : ?>
      <div class="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
        <span class="block sm:inline"><?= session('message') ?></span>
      </div>
    <?php endif; ?>

    <div class="bg-white shadow overflow-hidden sm:rounded-md">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ลำดับ/เลขที่</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ชื่อกฎหมาย</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">สถานะ</th>
            <th scope="col" class="relative px-6 py-3">
              <span class="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <?php foreach ($laws as $law) : ?>
            <tr>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <?= esc($law['law_no'] ?: '-') ?>
              </td>
              <td class="px-6 py-4">
                <div class="text-sm font-medium text-gray-900"><?= esc($law['title']) ?></div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <?php if ($law['status'] === 'active') : ?>
                  <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">ใช้งานอยู่</span>
                <?php else : ?>
                  <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">ยกเลิก</span>
                <?php endif; ?>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <a href="<?= site_url('admin/laws/edit/' . $law['id']) ?>" class="text-blue-600 hover:text-blue-900 mr-3"><i class="fa-solid fa-pen-to-square"></i> แก้ไข</a>
                <a href="<?= site_url('admin/laws/delete/' . $law['id']) ?>" onclick="return confirm('ยืนยันการลบ?')" class="text-red-600 hover:text-red-900"><i class="fa-solid fa-trash-can"></i> ลบ</a>
              </td>
            </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    </div>
  </div>
</div>
<?= $this->endSection() ?>
