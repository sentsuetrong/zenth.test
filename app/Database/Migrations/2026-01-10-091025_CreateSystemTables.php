<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\BaseConnection;
use CodeIgniter\Database\ConnectionInterface;
use CodeIgniter\Database\Migration;
use CodeIgniter\Database\RawSql;

class CreateSystemTables extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id' => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true, 'auto_increment' => true],
            'uuid' => ['type' => 'VARCHAR', 'constraint' => 36],
            'parent_id' => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true, 'null' => true],
            'name' => ['type' => 'VARCHAR', 'constraint' => 255, 'null' => true],
            'password_hash' => ['type' => 'VARCHAR', 'constraint' => 255, 'null' => true],
            'created_at' => ['type' => 'DATETIME', 'default' => new RawSql('CURRENT_TIMESTAMP')],
            'updated_at' => ['type' => 'DATETIME', 'default' => new RawSql('CURRENT_TIMESTAMP')],
            'deleted_at' => ['type' => 'DATETIME', 'null' => true],
        ]);
        $this->forge->addPrimaryKey('id');
        $this->forge->addUniqueKey('uuid');
        $this->forge->addForeignKey('parent_id', 'file_containers', 'id');
        $this->forge->createTable('file_containers', true);

        $this->forge->addField([
            'id' => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true, 'auto_increment' => true],
            'container_id' => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true, 'null' => true],
            'uuid' => ['type' => 'VARCHAR', 'constraint' => 36],
            'upload_session_id' => ['type' => 'VARCHAR', 'constraint' => 255, 'null' => true],
            'filename' => ['type' => 'VARCHAR', 'constraint' => 255],
            'mime_type' => ['type' => 'VARCHAR', 'constraint' => 100],
            'file_size' => ['type' => 'BIGINT', 'constraint' => 20, 'unsigned' => true],
            'is_public' => ['type' => 'TINYINT', 'constraint' => 1, 'unsigned' => true, 'default' => 0],
            'password_hash' => ['type' => 'VARCHAR', 'constraint' => 255, 'null' => true],
            'published_at' => ['type' => 'DATETIME', 'default' => new RawSql('CURRENT_TIMESTAMP'), 'null' => true],
            'created_at' => ['type' => 'DATETIME', 'default' => new RawSql('CURRENT_TIMESTAMP')],
            'updated_at' => ['type' => 'DATETIME', 'default' => new RawSql('CURRENT_TIMESTAMP')],
            'deleted_at' => ['type' => 'DATETIME', 'null' => true],
        ]);
        $this->forge->addPrimaryKey('id');
        $this->forge->addForeignKey('container_id', 'file_containers', 'id');
        $this->forge->addUniqueKey('uuid');
        $this->forge->addKey('upload_session_id');
        $this->forge->createTable('files', true);

        $this->forge->addField([
            'file_id' => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true],
            'chunk_order' => ['type' => 'INT', 'constraint' => 5, 'unsigned' => true],
            'chunk_data' => ['type' => 'LONGBLOB'],
        ]);
        $this->forge->addForeignKey('file_id', 'files', 'id');
        $this->forge->createTable('file_chunks', true);

        $this->forge->addField([
            'id' => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true, 'auto_increment' => true],
            'title' => ['type' => 'VARCHAR', 'constraint' => 255, 'null' => true],
            'law_no' => ['type' => 'VARCHAR', 'constraint' => 255, 'null' => true],
            'content' => ['type' => 'TEXT'],
            'status' => ['type' => 'ENUM', 'constraint' => ['active', 'cancel'], 'default' => 'active'],
            'created_at' => ['type' => 'DATETIME', 'default' => new RawSql('CURRENT_TIMESTAMP')],
            'updated_at' => ['type' => 'DATETIME', 'default' => new RawSql('CURRENT_TIMESTAMP')],
            'deleted_at' => ['type' => 'DATETIME', 'null' => true],
        ]);
        $this->forge->addPrimaryKey('id');
        $this->forge->createTable('laws', true, ['ENGINE' => 'InnoDB']);

        /** @var ConnectionInterface|BaseConnection $this->db */
        $this->db->query("ALTER TABLE {$this->db->DBPrefix}laws ADD FULLTEXT INDEX ft_title_content (title, content)");
    }

    public function down()
    {
        $this->forge->dropTable('file_chunks', true);
        $this->forge->dropTable('files', true);
        $this->forge->dropTable('file_containers', true);

        $this->forge->dropTable('laws', true);
    }
}
