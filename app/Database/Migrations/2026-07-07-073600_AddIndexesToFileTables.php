<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddIndexesToFileTables extends Migration
{
    public function __construct()
    {
        $this->DBGroup = (ENVIRONMENT === 'testing' || (is_cli() && in_array('tests', $_SERVER['argv'] ?? []))) ? 'tests' : 'default';
        parent::__construct();
    }

    public function up()
    {
        $this->db->query("ALTER TABLE `{$this->db->prefixTable('file_containers')}` ADD INDEX `parent_id_idx` (`parent_id`)");
        $this->db->query("ALTER TABLE `{$this->db->prefixTable('files')}` ADD INDEX `container_id_idx` (`container_id`)");
        $this->db->query("ALTER TABLE `{$this->db->prefixTable('files')}` ADD INDEX `deleted_at_idx` (`deleted_at`)");
        $this->db->query("ALTER TABLE `{$this->db->prefixTable('files')}` ADD INDEX `created_at_idx` (`created_at`)");
    }

    public function down()
    {
        $this->db->query("ALTER TABLE `{$this->db->prefixTable('file_containers')}` DROP INDEX `parent_id_idx`");
        $this->db->query("ALTER TABLE `{$this->db->prefixTable('files')}` DROP INDEX `container_id_idx`");
        $this->db->query("ALTER TABLE `{$this->db->prefixTable('files')}` DROP INDEX `deleted_at_idx`");
        $this->db->query("ALTER TABLE `{$this->db->prefixTable('files')}` DROP INDEX `created_at_idx`");
    }
}
