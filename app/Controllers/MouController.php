<?php

namespace App\Controllers;

use App\Controllers\BaseController;
use App\Models\MouModel;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\HTTP\IncomingRequest;
use CodeIgniter\HTTP\ResponseInterface;
use Config\Database;

class MouController extends BaseController
{
    use ResponseTrait;
    public $data;
    public function __construct()
    {
        $this->data = [
            'agency_name' => 'กองกฎหมาย - สำนักงานปลัดกระทรวงสาธารณสุข กระทรวงสาธารณสุข',
            'agency_name_en' => 'Legal Affairs Division - Office of the Permanent Secretary for Ministry Of Public Health',

            'agency_short_name' => 'กองกฎหมาย สป.สธ.',
            'agency_short_name_en' => 'Legal Affairs Division - OPS MOPH',

            'system_name' => 'คลังข้อมูลเกี่ยวกับบันทึกความร่วมมือหรือบันทึกความเข้าใจ (MoU)',
            'system_name_en' => 'MoU - MOPH Database'
        ];
    }
    public function index()
    {
        $db = Database::connect();
        $mouModel = new MouModel();

        $data['query'] = $mouModel->withGroups()->getCompiledSelect();
        $data['result'] = $db->query($data['query'])->getResult();
        dd($data);

        return view('moph-db/mou/index', $this->data);
    }

    public function create()
    {
        /** @var IncomingRequest $request */
        $request = service('request');

        return $this->respond([]);
    }
}
