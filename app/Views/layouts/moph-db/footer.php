<script>
  document.addEventListener('DOMContentLoaded', function() {
    showItem("<?= isset($result) && is_object($result) ? esc($result->mou->id, 'js') : 'null' ?>")

    const lawsTypesOptions = [{
        value: '1',
        label: 'พระราชบัญญัติ'
      },
      {
        value: '2',
        label: 'พระราชกฤษฎีกา'
      },
      {
        value: '3',
        label: 'ระเบียบ'
      },
      {
        value: '4',
        label: 'ประกาศ'
      },
      {
        value: '5',
        label: 'กฎกระทรวง'
      },
    ];

    new SmartSelect('laws-type', lawsTypesOptions, {
      multiple: true,
      placeholder: 'เลือกประเภท...',
      selected: [1, 2]
    });

    const lawsStatusOptions = [{
        value: '1',
        label: 'มีผลบังคับใช้งาน',
        icon: '<i class="fa-solid fa-circle text-emerald-500 text-[10px]"></i>'
      },
      {
        value: '2',
        label: 'ยกเลิกบังคับใช้',
        icon: '<i class="fa-solid fa-circle text-red-500 text-[10px]"></i>'
      },
    ];

    new SmartSelect('laws-status', lawsStatusOptions, {
      multiple: false,
      placeholder: 'เลือกสถานะ...',
      selected: 1
    });
  })
</script>

</body>

</html>