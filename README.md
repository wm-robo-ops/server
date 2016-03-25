# W&M Robo-Ops Dashboard Server

Backend that powers the [dashboard](http://wm-robo-ops.github.io/dashboard/). Built with [Express.js](http://expressjs.com/) and [Socket.io](http://socket.io/)

## Dependencies

- [Node.js](https://nodejs.org/en/)
- [sqlite3](https://www.sqlite.org/index.html)
- [node-sqlite3](https://github.com/mapbox/node-sqlite3)

## API Endpoints

####`/stats`

Reponse

```js
{
    "bigDaddy": {
        "battery": <Number>, // battery percentage remaining
        "network": <Number>, // network strength
        "location": Array<Number>, // [lon, lat]
        "bearing": <Number> // in degrees counterclockwise from north
    },
    "scout": {
        "battery": <Number>,
        "network": <Number>,
        "location": Array<Number>,
        "bearing": <Number>
    },
    "flyer": {
        "battery": <Number>,
        "network": <Number>,
        "location": Array<Number>,
        "bearing": <Number>
    }
}
```

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

#### Start stats/socks API
```
npm start
```

#### Start video server

```
./video_server.js
```

## On the rover

Run

```
./start_video_stream.sh
```
