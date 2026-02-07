<?php

namespace App\Controllers\API\V1;

use CodeIgniter\Shield\Entities\User;
use CodeIgniter\Shield\Models\UserModel;

class AuthController extends ApiController
{
    public function register()
    {
        $rules = [
            'username' => 'required|max_length[30]|min_length[3]|is_unique[users.username]',
            'email'    => 'required|max_length[254]|valid_email|is_unique[auth_identities.secret]',
            'password' => 'required|max_length[255]|min_length[8]',
        ];

        if (! $this->validate($rules)) {
            return $this->failValidationErrors($this->validator->getErrors());
        }

        // 2. สร้าง User Entity
        $user = new User([
            'username' => $this->request->getVar('username'),
            'email'    => $this->request->getVar('email'),
            'password' => $this->request->getVar('password'),
        ]);

        // 3. บันทึกลง DB
        $users = model(UserModel::class);
        $users->save($user);

        // 4. (Optional) ให้ Group default เป็น user
        $user = $users->findById($users->getInsertID());
        $user->addGroup('user');

        return $this->respondCreated([
            'status' => 'success',
            'message' => 'User registered successfully'
        ]);
    }

    public function login()
    {
        // 1. ตรวจสอบว่าส่ง email/password มาไหม
        $rules = [
            'email'    => 'required|valid_email',
            'password' => 'required|min_length[8]',
        ];

        if (! $this->validate($rules)) {
            return $this->failValidationErrors($this->validator->getErrors());
        }

        // 2. เช็ค Login ผ่าน auth service
        // หมายเหตุ: ใช้ session login เพื่อ check credentials ก่อน แล้วค่อย gen token
        $credentials = [
            'email'    => $this->request->getJsonVar('email'),
            'password' => $this->request->getJsonVar('password')
        ];

        // ตรวจสอบว่า User/Pass ถูกต้องไหม
        $valid = auth()->check($credentials);

        if (! $valid) {
            return $this->fail('Invalid login credentials', 401);
        }

        // 3. ดึง User Object
        $users = new UserModel();
        $user = $users->findById(auth()->id());

        // 4. สร้าง Access Token (สำหรับใช้กับ Fetch API)
        // 'main_token' คือชื่อ token (ตั้งอะไรก็ได้)
        $token = $user->generateAccessToken('main_token');

        // 5. ส่งกลับ Token (Vue จะต้องเก็บ raw_token นี้ไว้ใน LocalStorage)
        return $this->respond([
            'status' => 'success',
            'message' => 'Login successful',
            'data' => [
                'token' => $token->raw_token,
                'user' => [
                    'id' => $user->id,
                    'username' => $user->username,
                    'email' => $user->email
                ]
            ]
        ]);
    }

    public function logout()
    {
        if (auth()->loggedIn()) {
            $user = auth()->user();

            // ลบ Token ทั้งหมดของ User นี้ (หรือจะลบเฉพาะตัวปัจจุบันก็ได้)
            $user->revokeAllAccessTokens();

            return $this->respondDeleted(['status' => 'success', 'message' => 'Logged out successfully']);
        }

        return $this->fail('Not logged in', 401);
    }

    public function me()
    {
        $user = auth()->user();

        return $this->respond([
            'status' => 'success',
            'data' => [
                'id' => $user->id,
                'username' => $user->username,
                'email' => $user->email,
                'groups' => $user->getGroups()
            ]
        ]);
    }
}
