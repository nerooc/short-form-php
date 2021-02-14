<?php
  
//require 'vendor/autoload.php' ;
  
class db {
    private $user = "8gajda" ;
    private $pass = "pass8gajda";
    private $host = "172.20.44.25";
    private $base = "8gajda";
    private $conn;
    private $dbase;
    private $collection;
  
    function __construct($coll) {
      //$this->conn = new Mongo("mongodb://{$this->user}:{$this->pass}@{$this->host}/{$this->base}");
      $this->conn = new MongoDB\Client("mongodb://{$this->user}:{$this->pass}@{$this->host}/{$this->base}");    
      //$this->dbase = $this->conn->selectDB($this->base);
      //$this->collection = $this->dbase->selectCollection($this->coll);
      $this->collection = $this->conn->{$this->base}->{$coll};
    }
  
    function select() {
      $cursor = $this->collection->find();
      $table = iterator_to_array($cursor);
      return $table ;
    }

    function selectOne($email) {
      return $this->collection->find([
        "email" => $email
    ])->toArray();
    }

    function selectAll() {
      return $this->collection->find()->toArray();
    }
  
    function insert($user) {
      $ret = $this->collection->insertOne($user) ;
      return $ret;
    }

    function getOne($id)
    {
        return $this->collection->find([
            "_id" => new MongoDB\BSON\ObjectID($id)
        ])->toArray()[0];
    }
  
    function update($ident,$user,$flag) {
      if ( $flag ) {
         $rec = new MongoDB\BSON\ObjectId($ident);
         $filter = array ( '_id' => $rec );
      } else {
         $filter = array ( 'ident' => $ident );
      }
      $update = array ( '$set' => $user );
      //$option = array ( 'w' => 1 );
      //$ret = $this->collection->update($filter,$update,$option);
      $updresult = $this->collection->updateOne($filter,$update);
      //return $ret['nModified'];
      $ret = $updresult->getModifiedCount();
      return $ret;
    }
}
?>