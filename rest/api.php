<?php
require '../vendor/autoload.php';
require_once ("rest.php");
require_once ("mongo.php");

class API extends REST {

    public $data = "";

    public function __construct() {
        parent::__construct(); // Init parent contructor
         // Initiate Database
        
    }

    public function processApi() {

        $func = "_" . $this->_endpoint;
        if ((int)method_exists($this, $func) > 0) {
            $this->$func();
        }
        else {
            $this->response('Page not found', 404);
        }
    }

    private function _save() {
        if ($this->get_request_method() != "POST") {
            $this->response('', 406);
        }

        if (!empty($this->_request)) {
            try {
                $json_array = json_decode($this->_request, true);
                $res = $this
                    ->db
                    ->insert($json_array);
                if ($res) {
                    $result = array(
                        'return' => 'ok'
                    );
                    $this->response($this->json($result) , 200);
                }
                else {
                    $result = array(
                        'return' => 'not added'
                    );
                    $this->response($this->json($result) , 200);
                }
            }
            catch(Exception $e) {
                $this->response('', 400);
            }
        }
        else {
            $error = array(
                'status' => "Failed",
                "msg" => "Invalid send data"
            );
            $this->response($this->json($error) , 400);
        }
    }

    private function _register() {
        $db = new db("users");

        if (!empty($this->_request)) {
            try {

                $json_array = json_decode($this->_request, true);
                
                $pswd = $json_array['password'];
                $json_array['password'] = password_hash($pswd, PASSWORD_BCRYPT);

                $res = $db->insert($json_array);
                if ($res) {
                    $result = array(
                        'return' => 'ok',
                        'sth' => $pswd
                    );
                    $this->response($this->json($result) , 200);
                }
                else {
                    $result = array(
                        'return' => 'not added'
                    );
                    $this->response($this->json($result) , 200);
                }
            }
            catch(Exception $e) {
                $this->response('', 400);
            }
        }
        else {
            $error = array(
                'status' => "Failed",
                "msg" => "Invalid send data"
            );
            $this->response($this->json($error) , 400);
        }
    }

    private function _postAnswer(){
        $db = new db("answer");
        
        // session check
        $answerData = json_decode($this->_request, true);

        $insertResult = $db->insert($answerData);

        if ($insertResult->getInsertedCount() === 1) {
            $result = $db->getOne($insertResult->getInsertedId());
            $result["_id"] = (string)$result["_id"];

            $answer = array(
                'answer' => $result
            );

            $this->response($this->json($answer), 200);
        }
    }

    private function _getAnswers(){
        $db = new db("answer");
        
        $array = $db->selectAll();

        $this->response($this->json($array), 200);
    }

    private function _login() {
        $db = new db("users");

        if (!empty($this->_request)) {
            try {

                $json_array = json_decode($this->_request, true);
                $userArray = $db->selectOne($json_array['email']);
                $user = $userArray[0];
                
                if($user != NULL){
                    if(password_verify($json_array['password'], $user['password'])){
                        $result = array(
                            'result' => $user
                        );
                        $_SESSION["user"] = $result;
                        $this->response($this->json($result), 200);
                    } else {
                        $error = array(
                            'status' => "Failed",
                            "msg" => "Podano złe hasło!"
                        );

                        $this->response($this->json($error), 401);
                    }
                } else {
                    $error = array(
                        'status' => "Failed",
                        "msg" => "Brak takiego użytkownika!"
                    );
                    $this->response($this->json($error), 401);
                }
            }
            catch(Exception $e) {
                $error = array(
                    'status' => "Failed",
                    "msg" => "Caugth error"
                );
                $this->response($error, 400);
            }
        }
        else {
            $error = array(
                'status' => "Failed",
                "msg" => "Invalid send data"
            );
            $this->response($this->json($error) , 400);
        }
    }

    private function json($data) {
        if (is_array($data)) {
            return json_encode($data);
        }
    }
}

$api = new API();
$api->processApi();

?>
