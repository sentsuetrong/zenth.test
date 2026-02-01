<?php

namespace App\Controllers\MophDB;

use App\Controllers\BaseController;
use CodeIgniter\HTTP\ResponseInterface;

class LawsController extends BaseController
{
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
        return view('moph-db/laws/index', $this->data);
    }
}
