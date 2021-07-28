### Features

- Full Html and Javascript Browser Integration
- Object Editor create ( walls, stones, chests ) based on loaded .obj
- Iem Editor ( potions, swords, armors ) based on Object
- Sound Editor ( load, volume, loop and mix ) base on loaded .mp3 .ogg .mid
- Entity Editor ( models with skelleton ) similar of mixamo .fbx
- Actor Editor ( spawn points and teleports )
- Light Editor (point, spot, ambiend ), put all togueter and create a map

# Game3d by didisoftwares

####Requeriments
Before run install npm requeride packages:

install unsing this comand
`$ npm install formidable websocket sharp ws`

To run a project run this comand:
`$ node main.js`

####Simple configuration
Server Side Permission to use Editor in 'main.js' line 14 and 15
 | const ADMIN = 'didi';
 | const PASS = '1234';

WebServer html port in 'main.js' line 16
 | const WebPort= 8080;

Browser Side configuration if use HTTPS ou HTTP for secure sockets
in '/client/index.js' line 3
 | websock_secure : true

