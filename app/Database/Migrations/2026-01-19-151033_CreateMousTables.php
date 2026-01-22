<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;
use CodeIgniter\Database\RawSql;

class CreateMousTables extends Migration
{
    public function up()
    {
        // ! Create mous table
        $this->forge->addField([
            'id' => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true, 'auto_increment' => true],
            'full_title' => ['type' => 'TEXT'],
            'title' => ['type' => 'VARCHAR', 'constraint' => 255, 'null' => true],
            'entity_name' => ['type' => 'VARCHAR', 'constraint' => 255, 'default' => 'กระทรวงสาธารณสุข', 'comment' => 'ชื่อหน่วยงานของเรา เช่น กอง/ศูนย์/สำนัก/สำนักงาน/กรม/กระทรวง'],
            'objective' => ['type' => 'TEXT', 'null' => true],
            'effective_from' => ['type' => 'DATETIME', 'null' => true],
            'effective_to' => ['type' => 'DATETIME', 'null' => true],
            'keywords' => ['type' => 'VARCHAR', 'constraint' => 255, 'null' => true],
            'created_at' => ['type' => 'DATETIME', 'default' => new RawSql('CURRENT_TIMESTAMP')],
            'updated_at' => ['type' => 'DATETIME', 'default' => new RawSql('CURRENT_TIMESTAMP')],
            'deleted_at' => ['type' => 'DATETIME', 'null' => true],
        ]);
        $this->forge->addPrimaryKey('id');
        $this->forge->createTable('mous', true);

        // ! Create paties table
        $this->forge->addField([
            'id' => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true, 'auto_increment' => true],
            'full_name' => ['type' => 'TEXT'],
            'name' => ['type' => 'VARCHAR', 'constraint' => 255, 'null' => true],
            'created_at' => ['type' => 'DATETIME', 'default' => new RawSql('CURRENT_TIMESTAMP')],
            'updated_at' => ['type' => 'DATETIME', 'default' => new RawSql('CURRENT_TIMESTAMP')],
            'deleted_at' => ['type' => 'DATETIME', 'null' => true],
        ]);
        $this->forge->addPrimaryKey('id');
        $this->forge->createTable('parties', true);

        // ! Create mous_paties table
        $this->forge->addField([
            'mou_id' => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true],
            'party_id' => ['type' => 'INT', 'constraint' => 11, 'unsigned' => true],
        ]);
        $this->forge->addForeignKey('mou_id', 'mous', 'id', 'CASCADE', 'CASCADE');
        $this->forge->addForeignKey('party_id', 'parties', 'id', 'CASCADE', 'CASCADE');
        $this->forge->createTable('mous_parties', true);
    }

    public function down()
    {
        $this->forge->dropTable('mous_parties', true);
        $this->forge->dropTable('parties', true);
        $this->forge->dropTable('mous', true);
    }
}
