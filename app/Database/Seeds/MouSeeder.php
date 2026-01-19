<?php

namespace App\Database\Seeds;

use App\Models\MouModel;
use App\Models\PartyModel;
use CodeIgniter\Database\Seeder;
use CodeIgniter\Test\Fabricator;
use Faker\Factory;

class MouSeeder extends Seeder
{
    public function run()
    {
        $faker = Factory::create();

        // $mouFaker = new Fabricator(MouModel::class, []);
        $partyFaker = new Fabricator(PartyModel::class, []);

        for ($i = 0; $i < 10; $i++) {
            print_r(['party_name' => $faker->company()]);
        }
    }
}
