<?php

namespace App\Database\Seeds;

use App\Models\MouModel;
use App\Models\PartyModel;
use CodeIgniter\Database\RawSql;
use CodeIgniter\Database\Seeder;
use CodeIgniter\Test\Fabricator;
use Config\Database;
use Faker\Factory;

class MouSeeder extends Seeder
{
    public function run()
    {
        $faker = Factory::create('en_US');

        $mou = new Fabricator(MouModel::class);
        $party = new Fabricator(PartyModel::class);

        $db = Database::connect();
        $mou_party_builder = $db->table('mous_parties');

        $mouCount = 10;
        $keywordsCountPool = [3 => 70, 4 => 20, 5 => 10];
        $partiesCountPool = [1 => 70, 2 => 20, 3 => 10];

        for ($i = 0; $i < $mouCount; $i++) {
            $mou_title = esc($faker->sentence());
            $mou_full_title = $mou_title . ' ' . esc($faker->paragraph());
            $mou_objective = esc($faker->paragraphs(3, true));

            $effective_from = $faker->creditCardExpirationDate(false)->format('Y-m-d 00:00:00');

            $effective_to = $faker->optional(0.5)->creditCardExpirationDate();
            $effective_to = $effective_to === null ? new RawSql('null') : $effective_to->format('Y-m-d 00:00:00');

            $company_name = esc($faker->company());
            $company_suffix = esc($faker->companySuffix());
            $keywords = [];

            for ($j = 0; $j < $this->randomCount($keywordsCountPool); $j++) {
                $keywords[] = esc($faker->word());
            }

            $mou->setOverrides([
                'full_title' => $mou_full_title,
                'title' => $mou_title,
                'entity_name' => 'กระทรวงสาธารณสุข',
                'objective' => $mou_objective,
                'keywords' => join(',', $keywords),
                'effective_from' => $effective_from,
                'effective_to' => $effective_to,
            ]);

            $mou_id = $mou->create()['id'];
            $data = [];

            for ($k = 0; $k < $this->randomCount($partiesCountPool); $k++) {
                $party->setOverrides([
                    'full_name' => $company_name . ' ' . $company_suffix,
                    'name' => $company_name
                ]);

                $data[] = [
                    'mou_id' => $mou_id,
                    'party_id' => $party->create()->id
                ];
            }

            $mou_party_builder->insertBatch($data);
        }
    }

    /**
     * @param array $items
     * @return int
     */
    protected function randomCount($itemsWithChance)
    {
        $chance = mt_rand(1, array_sum($itemsWithChance));
        $weight = 0;

        foreach ($itemsWithChance as $key => $value) {
            $weight += $value;
            if ($chance <= $weight) {
                return $key;
            }
        }

        return array_keys($itemsWithChance)[0];
    }
}
