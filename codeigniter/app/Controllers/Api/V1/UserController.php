<?php

namespace App\Controllers\Api\V1;

use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\RESTful\ResourceController;
use CodeIgniter\Shield\Models\UserModel;

class UserController extends ResourceController
{
    protected $modelName = UserModel::class;

    public function create()
    {
        $rules = [
            'email'            => 'required|valid_email',
            'username'         => 'required|min_length[3]|max_length[30]',
            'password'         => 'required|min_length[8]|max_length[30]',
            'password_confirm' => 'matches[password]',

            'full_name' => 'required',
        ];
    }
}
