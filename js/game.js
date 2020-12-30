//
// Hope you can have a little fun with that :)
// Little project made in a week just for fun and for learning javascript
// Made by: Lucas Zischler
//

function whichTransitionEvent(){
    var t;
    var el = document.createElement('fakeelement');
    var transitions = {
      'transition':'transitionend',
      'OTransition':'oTransitionEnd',
      'MozTransition':'transitionend',
      'WebkitTransition':'webkitTransitionEnd'
    }

    for(t in transitions){
        if( el.style[t] !== undefined ){
            return transitions[t];
        }
    }
}

var transitionEnd = whichTransitionEvent();

var about_bg;
var about_display;
var flag_easteregg_running = false;
var flag_game_over = false;
var flag_game_won = false;
var stand_alone_page = false;
function setEasterEgg() {
	if(!flag_easteregg_running && !flag_game_over)
	{
		flag_easteregg_running = true;
		var about = document.getElementById("about");
		var about_box = document.getElementById("about_box");
		var canvas_box = document.getElementById("easter_egg_canvas");
		about_bg = about.style.background;
		about_display = about.style.display;
		about.style.transition = "clip-path 2s";
		about.style.clipPath = "circle(0%)";

		var transitionend_flag = false;
		about.addEventListener("transitionend", function(e) {
			if(!transitionend_flag) {
			transitionend_flag = true;
			about.style.background = "black";
			about_box.style.display = "none";
			canvas_box.style.display = "block";
			about.style.clipPath = "circle(100%)";
			}
		});

		setupGame();
	}
}

function get(url, onsuccess) {
	var request = new XMLHttpRequest();
	request.onreadystatechange = function() {
		if ((request.readyState == 4) && (request.status == 200))
			onsuccess(request);
	}
	request.open("GET", url, true);
	request.send();
}

function loadJSON(file, callback) {
	var xobj = new XMLHttpRequest();
	xobj.overrideMimeType("application/json");
	xobj.open('GET', file, true);
	xobj.onreadystatechange = function() {
		if(xobj.readyState == 4 && xobj.status == "200") {
			callback(xobj.responseText);
		}
	};
	xobj.send(null);
}

var key_up = false;
var key_down = false;
var key_left = false;
var key_right = false;
var key_A = false;
var key_B = false;
function keyDownHandler(e) {
	if(e.key == "Up" || e.key == "ArrowUp" || e.key == "W")	{
		e.preventDefault();
		key_up = true;
	}
	else if(e.key == "Down" || e.key == "ArrowDown" || e.key == "S") {
		e.preventDefault();
		key_down = true;
	}
	else if(e.key == "Left" || e.key == "ArrowLeft" || e.key == "A") {
		e.preventDefault();
		key_left = true;
	}
	else if(e.key == "Right" || e.key == "ArrowRight" || e.key == "D") {
		e.preventDefault();
		key_right = true;
	}
}
function keyUpHandler(e) {
	if(e.key == "Up" || e.key == "ArrowUp" || e.key == "W")
		key_up = false;
	else if(e.key == "Down" || e.key == "ArrowDown" || e.key == "S")
		key_down = false;
	else if(e.key == "Left" || e.key == "ArrowLeft" || e.key == "A")
		key_left = false;
	else if(e.key == "Right" || e.key == "ArrowRight" || e.key == "D")
		key_right = false;
}

function clamp(num, min, max) {
  return num <= min ? min : num >= max ? max : num;
}

var canvas;
var context;
var loopID;
var start_time;
var date;
var t_now;
var t_past;
var player = { 	sprites: null,
		size: { x: 32, y: 64}, 
		pos: { x: 0, y: 0},
		speed: {x: 0, y: 0},
		speed_time: {x: 0, y: 0},
		acc: {x: 0, y: 0},
		alive: true,
		death_loop: false,
		on_air: true,
		on_block: false,
		max_air_time: true,
		accJump: 0,
		horMov: 0,
		points: 0,
		anim_loop_count: 0,
		walking_status: 0,
		draw_offset: {x: 0, y:0}};
var map = {	sprites:null,
		scroll: {x: 0, y:0}};
var enemy_sprites = [];
var enemy = {	type: 0,
		size: { x:32, y:32},
		pos: { x: 0, y: 0},
		speed: {x: 0, y: 0},
		speed_time: {x: 0, y: 0},
		attacking: false,
		alive: true,
		death_loop: false,
		on_air: true,
		on_block: false,
		accJump: 0,
		horMov: 0,
		anim_loop_count: 0,
		walking_status: 0,
		draw_offset: {x: 0, y:0},
		draw_drift: {x: 0, y:0},
		draw_stretch: {x: 0, y:0}};
var enemies = [];
var bg_0_sprite;
var bg_1_sprite;
var gY = 800;
var dt;
var level_JSON;
var tiles_JSON;
var menu_screen_flag = true;
var level_screen_flag = false;
function setupGame() {
	document.addEventListener("keydown", keyDownHandler, false);
	document.addEventListener("keyup", keyUpHandler, false);
	canvas = document.getElementById("easter_egg_canvas");
	context = canvas.getContext("2d");
	context.font = '24px Helvetica';

	// Load level
	loadJSON('js/level.json', function(response) {
		level_JSON = JSON.parse(response);
		loadLevel();
	});

	date = new Date();
	t_now = date.getTime();
	start_time = t_now;
	loopID = setInterval(gameLoop, 1000/30);
}

function loadLevel() {
	player.pos.x = level_JSON.player.spawn.x*32;
	player.pos.y = (level_JSON.world.height-level_JSON.player.spawn.y)*32;

	// Load Sprites
	player.sprites = new Image;
	player.sprites.src = 'js/sprites/player_sprites.png';
	map.sprites = new Image;
	map.sprites.src = 'js/sprites/world_sprites.png';
	bg_0_sprite = new Image;
	bg_0_sprite.src = 'js/sprites/bg0.png';
	bg_1_sprite = new Image;
	bg_1_sprite.src = 'js/sprites/bg1.png';
	level_screen_flag = true;
	menu_screen_flag = false;

	for(var i=0; i<level_JSON.enemy_types.length; i++) {
		enemy_sprites[i] = new Image;
		enemy_sprites[i].src = level_JSON.enemy_types[i].sprite;
	}

	for(var i=0; i<level_JSON.enemy.length; i++) {
		enemy.type = level_JSON.enemy[i].type;
		enemy.pos.x = level_JSON.enemy[i].spawn.x*32;
		enemy.pos.y = (level_JSON.world.height-level_JSON.enemy[i].spawn.y)*32;
		enemy.horMov = level_JSON.enemy[i].mov.x;
		enemy.accJump = level_JSON.enemy[i].mov.y;
		enemy.size = level_JSON.enemy_types[enemy.type].size;
		var new_enemy = JSON.parse(JSON.stringify(enemy));
		enemies.push(new_enemy);
	}
}

function check_block_colision(entity) {
	var horizontal_blocks = Math.ceil((entity.size.x+entity.pos.x%32)/32);
	var vertical_blocks = Math.ceil((entity.size.y+entity.pos.y%32)/32);
	var x_tile;
	var y_tile;

	/*
	for(var i=0; i<vertical_blocks; i++) {
		for(var j=0; j<horizontal_blocks; j++) {
			context.beginPath();
			context.rect(32*(Math.trunc(entity.pos.x/32)+j)-map.scroll.x,32*(Math.trunc(entity.pos.y/32)+i),32,32);
			context.fillStyle="#00FF00";
			context.fill();
			context.closePath();
		}
	}*/

	if(entity == player)
		for(var i=0; i<vertical_blocks; i++) {
			for(var j=0; j<horizontal_blocks; j++) {
				x_tile = Math.trunc(entity.pos.x/32)+j;
				y_tile = Math.trunc(entity.pos.y/32)+i;
				x_tile = clamp(x_tile, 0, level_JSON.world.width-1);
				y_tile = clamp(y_tile, 0, level_JSON.world.height-1);
				var tile_num = level_JSON.world.tiles[y_tile][x_tile];
				if(tile_num!=0 && (tile_num-1%8) >=4) {
					// Point
					if(tile_num <= 24) {
						player.points += 1;
						level_JSON.world.tiles[y_tile][x_tile] = 0;
					}
					// End
					else if(tile_num <=48) {
						levelWon();
					}
				}
			}
		}

	// Up
	for(var i=0; i<horizontal_blocks; i++) {
		x_tile = Math.trunc(entity.pos.x/32)+i;
		y_tile = Math.trunc(entity.pos.y/32)-1;
		x_tile = clamp(x_tile, 0, level_JSON.world.width-1);
		y_tile = clamp(y_tile, 0, level_JSON.world.height-1);
		if(level_JSON.world.tiles[y_tile][x_tile] != 0) {
			if((level_JSON.world.tiles[y_tile][x_tile]-1)%8 < 4) {
				if(entity.pos.y+entity.speed_time.y<=y_tile*32+32) {
					entity.pos.y = y_tile*32+32;
					entity.speed_time.y = entity.speed.y*dt;
					entity.accJump = 0;
				}
			}
		}
	}

	// Up left
	x_tile = Math.trunc(entity.pos.x/32)-1;
	y_tile = Math.trunc(entity.pos.y/32)-1;
	x_tile = clamp(x_tile, 0, level_JSON.world.width-1);
	y_tile = clamp(y_tile, 0, level_JSON.world.height-1);
	if(level_JSON.world.tiles[y_tile][x_tile] != 0)
		if((level_JSON.world.tiles[y_tile][x_tile]-1)%8 < 4) {
			if((entity.pos.y+entity.speed_time.y<y_tile*32+32)&&(entity.pos.x+entity.speed_time.x<x_tile*32+32))
				entity.speed_time.x = 0;
		}

	// Up right
	x_tile = Math.trunc(entity.pos.x/32)+horizontal_blocks;
	y_tile = Math.trunc(entity.pos.y/32)-1;
	x_tile = clamp(x_tile, 0, level_JSON.world.width-1);
	y_tile = clamp(y_tile, 0, level_JSON.world.height-1);
	if(level_JSON.world.tiles[y_tile][x_tile] != 0)
		if((level_JSON.world.tiles[y_tile][x_tile]-1)%8 < 4)
			if((entity.pos.y+entity.speed_time.y<y_tile*32+32)&&(entity.pos.x+entity.speed_time.x>x_tile*32-entity.size.x))
				entity.speed_time.x = 0;

	// Down
	entity.on_block = false;
	for(var i=0; i<horizontal_blocks; i++) {
		x_tile = Math.trunc(entity.pos.x/32)+i;
		y_tile = Math.trunc(entity.pos.y/32)+vertical_blocks;
		x_tile = clamp(x_tile, 0, level_JSON.world.width-1);
		y_tile = clamp(y_tile, 0, level_JSON.world.height-1);
		if(entity.pos.y+entity.size.y+entity.speed_time.y>=level_JSON.world.height*32) {
			entity.alive = false;
			break;
		}
		if(level_JSON.world.tiles[y_tile][x_tile] != 0) {
			if((level_JSON.world.tiles[y_tile][x_tile]-1)%8 < 4) {
				if(entity.pos.y+entity.speed_time.y>=y_tile*32-entity.size.y) {
					entity.pos.y = y_tile*32-entity.size.y;
					entity.on_air = false;
					entity.on_block = true;
					entity.speed_time.y = 0;
				}
			}
		}
	}
	if(!entity.on_block)
		entity.on_air = true;
	
	// Down left
	x_tile = Math.trunc(entity.pos.x/32)-1;
	y_tile = Math.trunc(entity.pos.y/32)+vertical_blocks;
	x_tile = clamp(x_tile, 0, level_JSON.world.width-1);
	y_tile = clamp(y_tile, 0, level_JSON.world.height-1);
	if(level_JSON.world.tiles[y_tile][x_tile] != 0)
		if((level_JSON.world.tiles[y_tile][x_tile]-1)%8 < 4)
			if((entity.pos.y+entity.speed_time.y>y_tile*32-entity.size.y)&&(entity.pos.x+entity.speed_time.x<x_tile*32+32))
				entity.speed_time.x = 0;
	
	// Down right
	x_tile = Math.trunc(entity.pos.x/32)+horizontal_blocks;
	y_tile = Math.trunc(entity.pos.y/32)+vertical_blocks;
	x_tile = clamp(x_tile, 0, level_JSON.world.width-1);
	y_tile = clamp(y_tile, 0, level_JSON.world.height-1);
	if(level_JSON.world.tiles[y_tile][x_tile] != 0)
		if((level_JSON.world.tiles[y_tile][x_tile]-1)%8 < 4)
			if((entity.pos.y+entity.speed_time.y>y_tile*32-entity.size.y)&&(entity.pos.x+entity.speed_time.x>x_tile*32-entity.size.x))
				entity.speed_time.x = 0;

	// Left
	for(var i=0; i<vertical_blocks; i++) {
		x_tile = Math.trunc(entity.pos.x/32)-1;
		y_tile = Math.trunc(entity.pos.y/32)+i;
		x_tile = clamp(x_tile, 0, level_JSON.world.width-1);
		y_tile = clamp(y_tile, 0, level_JSON.world.height-1);
		if(level_JSON.world.tiles[y_tile][x_tile] != 0) {
			if((level_JSON.world.tiles[y_tile][x_tile]-1)%8 < 4) {
				if(entity.pos.x+entity.speed_time.x<=x_tile*32+32) {
					entity.pos.x = x_tile*32+32;
					entity.speed_time.x = 0;
					entity.horMov = 0;
				}
			}
		}
	}

	// Right
	for(var i=0; i<vertical_blocks; i++) {
		x_tile = Math.trunc(entity.pos.x/32)+horizontal_blocks;
		y_tile = Math.trunc(entity.pos.y/32)+i;
		x_tile = clamp(x_tile, 0, level_JSON.world.width-1);
		y_tile = clamp(y_tile, 0, level_JSON.world.height-1);
		if(level_JSON.world.tiles[y_tile][x_tile] != 0) {
			if((level_JSON.world.tiles[y_tile][x_tile]-1)%8 < 4) {
				if(entity.pos.x+entity.speed_time.x>=x_tile*32-entity.size.x) {
					entity.pos.x = x_tile*32-entity.size.x;
					entity.speed_time.x = 0;
					entity.horMov = 0;
				}
			}
		}
	}
}

function calculateEntities() {
	for(var i=0; i<enemies.length; i++) {
		if(enemies[i].alive)
			if((enemies[i].pos.x >= map.scroll.x-64)&&(enemies[i].pos.x <= canvas.width+map.scroll.x+64)) {
				// Jump
				if(enemies[i].on_air)
					enemies[i].speed.y += gY*dt;
				else {
					enemies[i].accJump = 0;
					enemies[i].speed.y = 0;
				}

				// Horizontal
				if(enemies[i].horMov == 0) {
					if(enemies[i].anim_loop_count > 30) {
						enemies[i].anim_loop_count = 0;
						if(enemies[i].draw_offset.y == 0)
							enemies[i].horMov = level_JSON.enemy[i].mov.x;
						else
							enemies[i].horMov = -level_JSON.enemy[i].mov.x;
					}
					else
						enemies[i].anim_loop_count++;
				}

				// Calculate movement
				enemies[i].speed_time.x = (enemies[i].speed.x+enemies[i].horMov)*dt;
				enemies[i].speed_time.y = (enemies[i].speed.y+enemies[i].accJump)*dt;

				if(enemies[i].attacking)
					enemies[i].speed_time.x = 0;

				// Block colision
				if(!enemies[i].death_loop)
					check_block_colision(enemies[i]);

				// Calculate position
				enemies[i].pos.x += enemies[i].speed_time.x;
				enemies[i].pos.y += enemies[i].speed_time.y;
	
				if(enemies[i].pos.y > level_JSON.world.width*32-enemies[i].size.y)
					enemies[i].pos.y = level_JSON.world.width*32-enemies[i].size.y;

				// Check player
				if(!enemies[i].death_loop) {
					if((player.pos.x+player.size.x > enemies[i].pos.x) && (player.pos.x < enemies[i].pos.x+enemies[i].size.x)) {
						if((player.pos.y+player.size.y < enemies[i].pos.y+enemies[i].size.y/2) && (player.pos.y+player.size.y > enemies[i].pos.y)) {
							enemies[i].on_air = true;
							enemies[i].accJump = -300;
							enemies[i].anim_loop_count = 0;
							enemies[i].death_loop = true;
							player.accJump -= 500;
							player.points ++;
						}
						else if((player.pos.y+player.size.y >= enemies[i].pos.y+enemies[i].size.y/2) && (player.pos.y < enemies[i].pos.y+enemies[i].size.y))
							player.alive = false;
					}
					if(!enemies[i].attacking && (enemies[i].anim_loop_count>1) && (player.pos.x+player.size.x > enemies[i].pos.x-enemies[i].size.x*2) && (player.pos.x < enemies[i].pos.x+enemies[i].size.x*3)) {
						if((player.pos.y < enemies[i].pos.y+enemies[i].size.y) && (player.pos.y+player.size.y > enemies[i].pos.y)) {
							if(player.pos.x > enemies[i].pos.x)
								enemies[i].draw_offset_y = 0;
							else
								enemies[i].draw_offset.y = enemies[i].size.y+2;
							enemies[i].attacking = true;
							enemies[i].anim_loop_count = 0;
							enemies[i].speed_time.x = 0;
						}
					}
					if(enemies[i].attacking && (enemies[i].draw_stretch.x>0)) {
						if((player.pos.y < enemies[i].pos.y+enemies[i].size.y) && (player.pos.y+player.size.y > enemies[i].pos.y)) {
							if(enemies[i].draw_offset.y == 0) {
								if((player.pos.x<=enemies[i].pos.x+2*enemies[i].size.x) && (player.pos.x+player.size.x>=enemies[i].pos.x+enemies[i].size.x)) {
									player.alive = false;
								}
							}
							else {
								if((player.pos.x<=enemies[i].pos.x) && (player.pos.x+player.size.x>=enemies[i].pos.x-enemies[i].size.x)) {
									player.alive = false;
								}
							}
						}
					}
				}
			}
	}
}

function drawEntities() {
	for(var i=0; i<enemies.length; i++) {
		if(enemies[i].alive)
			if((enemies[i].pos.x >= map.scroll.x-64)&&(enemies[i].pos.x <= canvas.width+map.scroll.x+64)) {
				enemies[i].draw_stretch.x = 0;
				enemies[i].draw_stretch.y = 0;
				enemies[i].draw_drift.x = 0;
				enemies[i].draw_drift.y = 0;

				if(enemies[i].death_loop) {
					enemies[i].pos.x += (enemies[i].speed.x+enemies[i].horMov)*dt;
					enemies[i].pos.y += gY*dt*dt;

					enemies[i].anim_loop_count++;
					if(enemies[i].anim_loop_cout > 100) {
						enemies[i].alive = false;
						enemies[i].death_loop = false;
					}
					if(enemies[i].anim_loop_count < 20)
						enemies[i].draw_offset.x = 3*(enemies[i].size.x+2);
					else
						enemies[i].draw_offset.x = 4*(enemies[i].size.x+2);
				}
				else if(enemies[i].attacking) {
					enemies[i].anim_loop_count++;
					enemies[i].draw_offset.x = 5*(enemies[i].size.x+2);
					if(enemies[i].anim_loop_count > 50) {
						enemies[i].draw_stretch.x = enemies[i].size.x;
						enemies[i].draw_stretch.x = enemies[i].size.x;
						enemies[i].draw_offset.x = 6*(enemies[i].size.x+2);
						if(enemies[i].draw_offset.y != 0)
							enemies[i].draw_drift.x = enemies[i].draw_stretch.x;
					}
					if(enemies[i].anim_loop_count > 100) {
						enemies[i].anim_loop_count = 0;
						enemies[i].attacking = false;
					}
				}
				else {
					if(enemies[i].horMov == 0)
						enemies[i].draw_offset.x = 0;
					else {
					enemies[i].anim_loop_count += Math.abs(enemies[i].speed_time.x);
						if(enemies[i].anim_loop_count > 4) {
							enemies[i].anim_loop_count = 0;
							enemies[i].walking_status += 1;
						}
						enemies[i].walking_status = enemies[i].walking_status % 2;
						enemies[i].draw_offset.x = (1+enemies[i].walking_status)*(enemies[i].size.x+2);
					}
				}

				if(enemies[i].speed_time.x < 0)
					enemies[i].draw_offset.y = enemies[i].size.y+2;
				else if (enemies[i].speed_time.x > 0)
					enemies[i].draw_offset.y = 0;

				context.drawImage(enemy_sprites[enemies[i].type],enemies[i].draw_offset.x,enemies[i].draw_offset.y,enemies[i].size.x+enemies[i].draw_stretch.x,enemies[i].size.y+enemies[i].draw_stretch.y,enemies[i].pos.x-enemies[i].draw_drift.x-map.scroll.x,enemies[i].pos.y-enemies[i].draw_drift.y-map.scroll.y,enemies[i].size.x+enemies[i].draw_stretch.x,enemies[i].size.y+enemies[i].draw_stretch.y);
			}
	}
}	

function calculatePlayer() {
	// Jump
	if(player.on_air) {
		player.speed.y += gY*dt;
		if(key_down && !key_up && player.accJump < 0) {
			player.accJump += 50;
			player.max_air_time = true;
		}
	}
	else {
		player.accJump = 0;
		player.speed.y = 0;
		player.max_air_time = false;
	}
	if(key_up && !player.max_air_time && (player.speed_time.y <= 0)) {
		player.on_air = true;
		if(player.accJump > -200)
			player.accJump = -200;
		else {
			if(player.accJump > -500)
				player.accJump -= 50;
			else
				player.max_air_time = true;
		}
	}

	// Horizontal
	if(key_left || key_right) {
		if(key_left) {
			if(player.horMov < -200)
				player.horMov = -200;
			else
				player.horMov -= 50;
		}
		if(key_right) {
			if(player.horMov > 200)
				player.horMov = 200;
			else
				player.horMov += 50;
		}
	}
	else
		player.horMov -= player.horMov/4;

	// Calculate movement
	player.speed_time.x = (player.speed.x+player.horMov)*dt;
	player.speed_time.y = (player.speed.y+player.accJump)*dt;

	// Block colision
	check_block_colision(player);

	// Calculate position
	player.pos.x += player.speed_time.x;
	player.pos.y += player.speed_time.y;

	// Clip
	if(player.pos.y > level_JSON.world.height*32-player.size.y)
		player.alive = false;

	if(player.pos.x+player.speed_time.x > canvas.width-player.size.x+map.scroll.x)
		player.pos.x = canvas.width-player.size.x+map.scroll.x;
	else if(player.pos.x+player.speed_time.x < map.scroll.x)
		player.pos.x = map.scroll.x;

	if(!player.alive)
		levelLost();
}

var draw_x_offset = 0;
var draw_y_offset = 0;
function drawPlayer() {
	// Animation
	if(player.on_air) {
		if(player.speed_time.y < 0)
			player.draw_offset.x = 4*(player.size.x+2);
		else
			player.draw_offset.x = 5*(player.size.x+2);
	}
	else {
		if((player.speed_time.x < 2 && player.speed_time.x > -2) && (player.speed_time.y < 2 && player.speed_time.y > -2)) {
			player.draw_offset.x = 0;
		}
		else {
			player.anim_loop_count += Math.abs(player.speed_time.x);
			if(player.anim_loop_count > 16) {
				player.anim_loop_count = 0;
				player.walking_status += 1;
			}

			
			player.walking_status = player.walking_status % 3;
			player.draw_offset.x = (1+player.walking_status)*(player.size.x+2);
		}
	}
	if(player.speed_time.x < 0)
		player.draw_offset.y = player.size.y+2;
	else if (player.speed_time.x > 0)
		player.draw_offset.y = 0;

	// Map offset
	if((player.pos.x>canvas.width/2) && (player.pos.x<(level_JSON.world.width*32-canvas.width/2)))
		map.scroll.x = Math.round(player.pos.x-canvas.width/2);

	context.drawImage(player.sprites,player.draw_offset.x,player.draw_offset.y,player.size.x,player.size.y,player.pos.x-map.scroll.x,player.pos.y-map.scroll.y,player.size.x,player.size.y);
}
function drawBackground() {
	context.drawImage(bg_0_sprite,map.scroll.x/16,0,canvas.width,canvas.height,0,0,canvas.width,canvas.height);
	context.drawImage(bg_1_sprite,map.scroll.x/8,0,canvas.width,canvas.height,0,0,canvas.width,canvas.height);
}

var map_anim_loop = 0;
function drawMap() {
	map_anim_loop += 1;
	if(map_anim_loop >= 40)
		map_anim_loop = 0;
	var y_cutted = Math.trunc(map.scroll.y/32);
	var x_cutted = Math.trunc(map.scroll.x/32);
	var y_max = clamp(Math.trunc(canvas.height/32)+y_cutted+1, 0, level_JSON.world.height);
	var x_max = clamp(Math.trunc(canvas.width/32)+x_cutted+1, 0, level_JSON.world.width);
	for(var i=y_cutted; i<y_max; i++) {
		for(var j=x_cutted; j<x_max; j++) {
			if(level_JSON.world.tiles[i][j] != 0)
			{
				// Draw tile
				draw_x_offset = (level_JSON.world.tiles[i][j]-1)%8;
				draw_y_offset = Math.trunc((level_JSON.world.tiles[i][j]-1)/8);
				var tile_x_pos = j*32;
				var tile_y_pos = i*32;
				if(level_JSON.world.tiles[i][j]<=24 && (level_JSON.world.tiles[i][j]-1)%8>=4)
					context.drawImage(map.sprites,(draw_x_offset+Math.trunc(map_anim_loop/10))*32,draw_y_offset*32,32,32,tile_x_pos-map.scroll.x,tile_y_pos-map.scroll.y,32,32);
				else
					context.drawImage(map.sprites,draw_x_offset*32,draw_y_offset*32,32,32,tile_x_pos-map.scroll.x,tile_y_pos-map.scroll.y,32,32);
			}
		}
	}
}

function gameLoop() {
	date = new Date();
	t_past = t_now;
	t_now = date.getTime();
	dt = (t_now-t_past)/1000;

	context.clearRect(0, 0, canvas.width, canvas.height);

	if(level_screen_flag)
		loopLevel();
	else if(menu_screen_flag)
		loopMenu();

	context.fillStyle='white';
	context.strokeStyle='black';
	context.strokeText('Points: '+player.points+'     Time: '+Math.trunc((t_now-start_time)/60000)+'m '+Math.trunc((t_now-start_time)/1000)%60+'s', 18, 22);
	context.fillText('Points: '+player.points+'     Time: '+Math.trunc((t_now-start_time)/60000)+'m '+Math.trunc((t_now-start_time)/1000)%60+'s', 18, 22);
}

function loopMenu() {
}

function loopLevel() {
	drawBackground();
	drawMap();
	calculateEntities();
	drawEntities();
	calculatePlayer();
	drawPlayer();
}

function levelWon() {
	if(!flag_game_won) {
		flag_game_won = true;
		player.points = Math.trunc(player.points*10 + clamp(600-(t_now-start_time)/1000,0,600));
		alert('You won!\nscore: '+player.points);
		closeEasterEgg();
	}
}

function levelLost() {
	if(!flag_game_won) {
		flag_game_won = true;
		player.points *= 10;
		alert('Game over\nscore: '+player.points);
		closeEasterEgg();
	}
}

function closeEasterEgg() {
	if(stand_alone_page)
		location.reload();

	if(flag_easteregg_running){
		flag_game_over = true;
		var about = document.getElementById("about");
		var about_box = document.getElementById("about_box");
		var canvas_box = document.getElementById("easter_egg_canvas");
		//var close_button = document.getElementById("close_button");
		about.style.clipPath = 'circle(0%)';

		about.addEventListener("transitionend", function(e) {
			about.style.background = about_bg;
			about.style.display = about_display;
			about_box.style.display = "grid";
			canvas_box.style.display = "none";
			about.style.clipPath = "circle(100%)";
			//close_button.style.display = "none";
			flag_easteregg_running = false;
		});

		clearInterval(loopID);
		document.removeEventListener("keydown", keyDownHandler);
		document.removeEventListener("keyup", keyUpHandler);
	}
}

