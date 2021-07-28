# Game by didisoftwares
 <p align="left">
  <a href="#" alt="Gmail">
  <img src="https://img.shields.io/badge/-Gmail-FF0000?style=flat-square&labelColor=FF0000&logo=gmail&logoColor=white&link=iandidi123@gmail.com" /></a>
 </p>

#### Requeriments
Before run install npm requeride packages:

install unsing this comand
`$ npm install formidable websocket sharp ws`

To run a project run this comand:
`$ node main.js`

#### Simple configuration
Server Side Permission to use Editor in 'main.js' line 14 and 15
```js
| const ADMIN = 'didi';
| const PASS = '1234';
```

WebServer html port in 'main.js' line 16
```js
 | const WebPort= 8080;
 ```

Browser Side configuration if use HTTPS or HTTP for secure sockets
in '/client/index.js' line 3
```js
 | websock_secure : true
 ```
 
### Features

- Full Html and Javascript Browser Integration
- Object Editor create ( walls, stones, chests ) based on loaded .obj
- Iem Editor ( potions, swords, armors ) based on Object
- Sound Editor ( load, volume, loop and mix ) base on loaded .mp3 .ogg .mid
- Entity Editor ( models with skelleton ) similar of mixamo .fbx
- Actor Editor ( spawn points and teleports )
- Light Editor (point, spot, ambiend ), put all togueter and create a map
- Minimum use of 3rd part modules on nodejs, most vanila implementation
- Real time Multiplayer with websocket

### Using
- Three.js
- Ammo.js
- Jquery
- Jquery.ui

#### to do for now
- calibrate dinamic camera
- audio point and ambient fixes
- fix some glitch on ground with physic body walk/run
- implement actor live movimentation and contact response



