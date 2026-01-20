<?php

if (!class_exists('Vite')) {
  class Vite
  {
    private static ?Vite $instance = null;

    private string $dev_host = 'localhost';
    private int $dev_port = 5173;

    private array $manifest = [];

    public string $output_directory = 'dist';

    private function __construct()
    {
      $this->loadManifest();
    }

    public function getInstance(): Vite
    {
      return self::$instance ?? new self();
    }

    public function loadManifest()
    {
      if ($this->isDev()) return;

      $file_path = FCPATH . $this->output_directory . '/.vite/manifest.json';
      if (file_exists($file_path))
        $this->manifest = json_decode(file_get_contents($file_path), true);
    }

    public function isDev()
    {
      return getenv('CI_ENVIRONMENT') === 'development';
    }

    public function __clone() {}
    public function __wak() {}
  }
}
