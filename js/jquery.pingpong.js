/*
	PingPong online by RED v1.0a
	Client side part.
	____
	Example use:
	<style>.pingpong{width: 660px;height: 500px;}</style>
	<script>$('#pingpong').pingpong('url_to_server/ajax.php')</script>
	<div class="pingpong"></div>
*/
(function($){
	$.fn.pingpong = function(url) {
		var posx = 0;
		var posy = 0;
		var hash = 0;
		var angle = 45;
		var speed = 14;
		var tmpspeed = 50;
		var platformW = 10;
		var platformH = 40;
		var platformB = 3;
		var type = 0;
		var url = url || 'ajax.php';
		var score1 = 0;
		var score2 = 0;
		var game_started = false;
		
		
		// Update position ball
		function UpdatePos(player1, player2, ball, pwidth, pheight){
			var p = angle * Math.PI / 180;
			var a = 180-angle;
			var b = 0-angle;
			
			posy += Math.round(speed*Math.sin(p));
			posx += Math.round(speed*Math.cos(p));
			
			//if(tmpspeed > 10)
				//tmpspeed -= 0.1;
			
			if(posy < 1){
				posy = 1;
				angle = b;
			}else if(posy > pheight-20){
				posy = pheight-20;
				angle = b;
			}
			
			if (posx < 1){
				posx = 1;
				angle = a;
				//gameData.compAdj -= opts.difficulty;
				//UpdateScore(true, gameData, leftPaddle, rightPaddle, ball, score, msg);
				$("#score").html(score1+" | "+(score2++));
			}else if(posx > pwidth-20){
				posx = pwidth-20;
				angle = a;
				//UpdateScore(false, gameData, leftPaddle, rightPaddle, ball, score, msg);
				$("#score").html((score1++)+" | "+score2);
			}
			// Move own platform
			var RightTop = parseInt(player1.css('top'));

			if (RightTop < 1)
				RightTop = 1;
			if ((RightTop+platformH+1) > pheight) 
				RightTop=pheight-platformH-1;

			player1.css('top', RightTop+'px');
			
			var LeftTop = parseInt(player2.css('top'));
			
			if (LeftTop < 1)
				LeftTop = 1;

			if ((LeftTop+platformH+1) > pheight)
				LeftTop = pheight - platformH - 1;
			
			var MaxLeft = platformW + platformB;
			if (posx < MaxLeft) {
				if (posy < (pheight + LeftTop) && (posy+20) > LeftTop) {
					posx = MaxLeft;
					angle = a;
				}
			}
			
			var MaxRight = pwidth - 20 - platformW - platformB;
			if (posx > MaxRight) {
				if (posy < (platformH + RightTop) && (posy+20) > RightTop) {
					posx = MaxRight;
					angle = a;
				}
			}
			
			ball.css('top', posy);
			ball.css('left', posx);
			
			setTimeout(function(){UpdatePos(player1, player2, ball, pwidth, pheight, score1, score2)}, tmpspeed);
		}
		
		function UpdateAjax(player1, player2, ball, pwidth, pheight, score1, score2){
			$.get(url, { hash: ""+hash+""}, function(data){
				var par = data.split(':');
				if(par[0] == 1)
				{
					$("#wait").hide();
					UpdatePos(player1, player2, ball, pwidth, pheight, score1, score2);
					game_started = true;
				}else{
				if(type == 2 || type == 1)
					player2.css('top', par[1]+'px');
				else if(type == 3)
					player1.css('top', par[1]+'px');
					player2.css('top', par[2]+'px');
				}
				UpdateAjax(player1, player2, ball, pwidth, pheight, score1, score2);
			})
			
		}
		
		function S4() {
		   return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
		}
		
		return this.each(function () {
			$this = $(this);
			$this.css('background', 'black');
			$this.css('position', 'relative');
			$this.append('<div id="ball" style="position:absolute; background-color: white; width: 20px; height: 20px; border: 2px solid black;border-radius: 12px;"></div>');
			$this.append('<div id="player1" style="position:absolute; background-color:#ffffff;"></div>');
			$this.append('<div id="player2" style="position:absolute; background-color:#ffffff;"></div>');
			$this.append('<div id="score" style="position:relative; color:white; font-size: 35px; top:0; text-align: center;">0 | 0</div>');
			$this.append('<div id="youare" style="position:relative; color:white; font-size: 35px; bottom:0; text-align: center;"></div>');
			$this.append('<div id="wait" style="position:relative; color:white; font-size: 35px; padding-top:15px; text-align: center;">Waiting second player...</div>');
			
			var player1 = $("#player1");
			var player2 = $("#player2");
			var ball = $("#ball");
			var pwidth = $this.width();
			var pheight = $this.height();
			var clear_timer = false;
			
			hash = S4()+S4()+S4()+S4();
			$.get(url, { hash: ""+hash+"", type: "gettype"}, function(data){
				type = parseInt(data);
				if(type == 1)
					you = 'player 1';
				else if(type == 2)
					you = 'player 2';
				else if(type == 3)
					you = 'speactor';
				else
					you = 'error';
				$("#youare").html('You are '+you);
			});
			
			
			player1.css('width', platformW);
			player1.css('height', platformH);
			player1.css('left', pwidth - platformW - platformB);
			player1.css('top', Math.round(1+(Math.random()*(pheight-platformH-2))) );
			
			
			//player2.css('display', 'none');
			player2.css('width', platformW);
			player2.css('height', platformH);
			player2.css('left', pwidth - pwidth + platformB);
			player2.css('top', Math.round(1+(Math.random()*(pheight-platformH-2))));
			
			//UpdatePos(player1, player2, ball, pwidth, pheight, score1, score2);
			UpdateAjax(player1, player2, ball, pwidth, pheight, score1, score2);
			
			setInterval(function(){ clear_timer = true; }, 100);
			$this.mousemove(function(e){
				if(type == 3)
					return false;
				var RightTop = parseInt(player1.css('top'));
				//$('#document').html('e.pageX = ' + e.pageX + ', e.pageY = ' + e.pageY);
				RightTop = e.pageY;
				if (RightTop < 1)
					RightTop = 1;
				if ((RightTop+platformH+1) > pheight) 
					RightTop=pheight-platformH-1;
				
				if(clear_timer && game_started){
					$.post(url, { hash: ""+hash+"", pos: ""+RightTop+"", type: "recive" });
					clear_timer = false;
				}
				
				player1.css('top', RightTop+'px');
			});
		});
	};
})(jQuery);