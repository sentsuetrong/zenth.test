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
        $party = new Fabricator(PartyModel::class);

        for ($i = 0; $i < 10; $i++) {
            $party->setOverrides([
                'full_name' => esc($faker->company()) . ' ' . esc($faker->companySuffix()),
                'name' => esc($faker->company())
            ]);
            $party->create();
        }
    }
}
