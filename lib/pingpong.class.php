<?
/*
	PingPong online by RED v1.0a
	Server side part.
	____
	Example use:
		include "pingpong.class.php";
		$class = new Pingpong();
		$class->prepare();
		$class->start_game();
*/
Class Pingpong {

	// Game settings
	var $allow_spectator = true;
	var $max_spectator = 3;
	var $limit_win = 10;
	var $speed_game = 10;
	
	
	// DB settings
	private $_db_host = 'localhost';
	private $_db_user = 'pp';
	private $_db_pass = 'pp2';
	private $_db_base = 'pp';
	
	private $_prepared = false;
	private $_hash = 0;
	private $_type = 0;
	private $_cid = 0;
	private $_pos = 0;
	private $memcache;
	private $db;
	
	
	private function _db_connect(){
		if(!$this->db = mysql_connect($this->_db_host, $this->_db_user, $this->_db_pass))
			exit('MySQL connect error!');
		
		if(!mysql_select_db($this->_db_base, $this->db))
			exit('Can\'t select database!');
	}
		
	private function _update(){
		$max_time = ini_get('max_execution_time')-1;
		$time_ = time();
	
		// Waiting for event
		while(($event = $this->memcache->get("pp_event_update_".$this->_cid)) == 1 || $event == 2 || (time()-$time_) >= $max_time ? false : true){}
		
		// If game started
		//$clients = mysql_num_rows(mysql_query("SELECT `id` FROM `pp_clients` WHERE `type`='1' OR `type`='2'"));
		if($event == 2){
			echo "1:START";
		}elseif($event == 1){
			// Getting info depending on type
			if($this->_type == 1 || $this->_type == 2) // Players
				echo "0:".$this->memcache->get("pp_player_".(($this->_type == 1)?2:1)."_pos");
			elseif($this->_type == 3) // Speactors
				echo "0:".$this->memcache->get("pp_player_1_pos").":".$this->memcache->get("pp_player_2_pos");
		}
		
		$this->memcache->set("pp_event_update_".$this->_cid, 0, false, 60);
	}
	
	private function _recive(){
		// Remember platform position
		$this->_pos = $_REQUEST['pos'];
		$this->memcache->set("pp_player_".$this->_type."_pos", $this->_pos, false, 60);
		$this->_global_event();
	}
	
	private function _global_event($type = 1){
		// Send signal to all clients for update event
		$mysql_q = mysql_query("SELECT `id` FROM `pp_clients`");
		while($arr = mysql_fetch_array($mysql_q)){
			$this->memcache->set("pp_event_update_".$arr['id'], $type, false, 60);
		}
	}
	
	public function prepare(){
		// Connect to MySQL and Memcache
		$this->_db_connect();
		$this->memcache = new Memcache;
		$this->memcache->connect('127.0.0.1', 11211);
		ignore_user_abort(true);
		$this->_prepared = true;
	}
	
	private function _cleanup(){
		$timeout = 10; // seconds
		
		// Clean all timeout clients
		mysql_query("DELETE FROM `pp_clients` WHERE time+$timeout < ".time());
	}
		
	private function _auth(){
		$this->_hash = $_REQUEST['hash'];
		
		if($pp_player = mysql_fetch_array(mysql_query("SELECT `type`, `id` FROM `pp_clients` WHERE `hash`='".mysql_real_escape_string($this->_hash)."' "))){
			$this->_type = $pp_player['type'];
			$this->_cid = $pp_player['id'];
			mysql_query("UPDATE `pp_clients` SET `time`='".time()."' WHERE `hash`='".mysql_real_escape_string($this->_hash)."' ");
		}else{
			if(mysql_num_rows(mysql_query("SELECT `id` FROM `pp_clients` WHERE `type`='1'")) == 0){
				$this->_type = 1;
			}elseif(mysql_num_rows(mysql_query("SELECT `id` FROM `pp_clients` WHERE `type`='2'")) == 0){
				$this->_type = 2;
			}else
				$this->_type = 3;
			
			mysql_query("INSERT INTO `pp_clients` SET `ip`='".$_SERVER['REMOTE_ADDR']."', `hash`='".mysql_real_escape_string($this->_hash)."', `type`='".$this->_type."', `time`='".time()."' ");
			$this->_cid = mysql_insert_id();
			
			// Game will start!
			if($this->_type == 2){
				$this->_global_event(2);
				//exit("1:START");
			}
		}
	}
	
	public function start_game(){
		if(!$this->_prepared)
			exit('Execute prepare() first!');
		
		$this->_auth();
		$this->_cleanup();
		switch(@$_REQUEST['type']){
			case 'recive':$this->_recive();break;
			case 'gettype':echo $this->_type;break;
			default:$this->_update();break;
		}
		mysql_close();
	}
}

?>