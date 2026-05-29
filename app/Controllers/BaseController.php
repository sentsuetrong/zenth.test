<?php

namespace App\Controllers;

use CodeIgniter\Controller;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;
use Psr\Log\LoggerInterface;

/**
 * BaseController provides a convenient place for loading components
 * and performing functions that are needed by all your controllers.
 *
 * Extend this class in any new controllers:
 * ```
 *     class Home extends BaseController
 * ```
 *
 * For security, be sure to declare any new methods as protected or private.
 */
abstract class BaseController extends Controller
{
    /**
     * Be sure to declare properties for any property fetch you initialized.
     * The creation of dynamic property is deprecated in PHP 8.2.
     */

    /**
     * @var array
     */
    protected $data = [];

    /**
     * @return void
     */
    public function initController(RequestInterface $request, ResponseInterface $response, LoggerInterface $logger)
    {
        // Load here all helpers you want to be available in your controllers that extend BaseController.
        // Caution: Do not put the this below the parent::initController() call below.
        $this->helpers = ['url', 'html', 'form'];

        // Caution: Do not edit this line.
        parent::initController($request, $response, $logger);

        // Preload any models, libraries, etc, here.
        // $this->session = service('session');

        // Common Metadata
        $this->data = [
            'agency_name' => 'กองกฎหมาย - สำนักงานปลัดกระทรวงสาธารณสุข กระทรวงสาธารณสุข',
            'agency_name_en' => 'Legal Affairs Division - Office of the Permanent Secretary for Ministry Of Public Health',

            'agency_short_name' => 'กองกฎหมาย สป.สธ.',
            'agency_short_name_en' => 'Legal Affairs Division - OPS MOPH',

            'system_name' => 'คลังข้อมูลเกี่ยวกับบันทึกความร่วมมือหรือบันทึกความเข้าใจ (MoU)',
            'system_name_en' => 'MoU - MOPH Database'
        ];
    }
}
