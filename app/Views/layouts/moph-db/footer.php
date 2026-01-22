<script>
  document.addEventListener('DOMContentLoaded', function() {
    showItem("<?= isset($result) && is_object($result) ? esc($result->mou->id, 'js') : 'null' ?>")
  })
</script>

</body>

</html>