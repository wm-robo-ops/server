# W&M Robo-Ops Dashboard Server

Backend that powers the [dashboard](http://wm-robo-ops.github.io/dashboard/). Built with [Express.js](http://expressjs.com/) and [Socket.io](http://socket.io/)

## Dependencies

- [Node.js](https://nodejs.org/en/)
- [sqlite3](https://www.sqlite.org/index.html)
- [node-sqlite3](https://github.com/mapbox/node-sqlite3)

## API Endpoints

####`/stats`

####`/rocks`

Response: An array of rock data

```js
[
	{
		"lon": <Number>,
		"lat": <Number>,
		"color": <String>,
		"id": <String>
	}
]
```

####`/rocks/add`

Request body:

```js
{
	"lon": <Number>,
	"lat": <Number>,
	"color": <String>,
	"id": <String>
}
```

Response

```
ok
```

####`/rocks/remove/:id`

Remove a rock by its id

Response

```
ok
```

####`/:vehicle/video/:camera`

Response

```
some video streaming socket
```


## Running Locally

#### Installation
```
git clone https://github.com/wm-robo-ops/server.git && cd server
npm install
```

#### Start the main server
```
ROBO_OPS_PASSWORD="<THE_PASSWORD>" ./server.js
```

#### Start video server

```
./video_server.js
```

## Ports

- 5555 - Web API
- 9000 - Pi command server
- 7000 - Pi camera streaming server
- 300* - dof devices
    - `3000`: Pi Server
    - `3001`: Web/big daddy
    - `3002`: Web/scout
    - `3003`: Web/flyer
- 400* - gps
    - `3000`: Pi server
    - `3001`: Web/big daddy
    - `3002`: Web/scout
    - `3003`: Web/flyer
- 800* - cameras
    - `8000`: Pi Server
    - `8001`: Web/big daddy main
    - `8002`: Web/big daddy arm
    - `8003`: Web/scout
    - `8004`: Web/flyer

