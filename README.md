# W&M Robo-Ops Dashboard Server

Backend that powers the [dashboard](http://wm-robo-ops.github.io/dashboard/)

## Dependencies

- [Node.js](https://nodejs.org/en/)
- [sqlite3](https://www.sqlite.org/index.html)
- [node-sqlite3](https://github.com/mapbox/node-sqlite3)

## API Endpoints

####`/stats`

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
make
```

#### Start the servers
```
./server.js
./password_server.js
./video_stream_server.js
./dof_stream_server.js
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
    - `4000`: Pi server
    - `4001`: Web/big daddy
    - `4002`: Web/scout
    - `4003`: Web/flyer
- 800* - cameras
    - `8000`: Pi Server
    - `8001`: Web/big daddy main
    - `8002`: Web/big daddy arm
    - `8003`: Web/scout
    - `8004`: Web/flyer

