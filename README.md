# W&M Robo-Ops Dashboard Server

Backend that powers the [dashboard](http://wm-robo-ops.github.io/dashboard/)

## Dependencies

- [Node.js](https://nodejs.org/en/)
- [sqlite3](https://www.sqlite.org/index.html)
- [node-sqlite3](https://github.com/mapbox/node-sqlite3)

## API Endpoints

####`/stats`

```js
{
  "cameras":{
    "bdfront":{
      "device":"192.168.1.133",
      "port":8001,
      "vehicle":"bigDaddy",
      "nameReadable":"Big Daddy Front",
      "on":false,
      "frameRate":0
    },
    "bdright":{
      "device":"192.168.1.121",
      "port":8002,
      "vehicle":"bigDaddy",
      "nameReadable":"Big Daddy Right",
      "on":false,
      "frameRate":0
    },
    "bdback":{
      "device":"192.168.1.151",
      "port":8003,
      "vehicle":"bigDaddy",
      "nameReadable":"Big Daddy Back",
      "on":false,
      "frameRate":0
    },
    "bdleft":{
      "device":"192.168.1.142",
      "port":8004,
      "vehicle":"bigDaddy",
      "nameReadable":"Big Daddy Left",
      "on":false,
      "frameRate":0
    },
    "arm":{
      "device":"192.168.1.000",
      "port":8005,
      "vehicle":"bigDaddy",
      "nameReadable":"Arm",
      "on":false,
      "frameRate":0
    },
    "scout":{
      "device":"192.168.1.200",
      "port":8006,
      "vehicle":"scout",
      "nameReadable":"Scout",
      "on":false,
      "frameRate":0
    }
  },
  "gps":{
    "bigDaddy":{
      "device":"192.168.1.133",
      "port":4001,
      "name":"bigDaddy"
    },
    "scout":{
      "device":"192.168.1.200",
      "port":4002,
      "name":"scout"
    },
    "flyer":{
      "device":"192.168.1.000",
      "port":4003,
      "name":"flyer"
    }
  },
  "dofDevice":{
    "bigDaddy":{
      "device":"192.168.1.133",
      "port":3001,
      "name":"bigDaddy"
    },
    "scout":{
      "device":"192.168.1.200",
      "port":3002,
      "name":"scout"
    },
    "flyer":{
      "device":"192.168.1.000",
      "port":3003,
      "name":"flyer"
    }
  }
}
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
make
```

#### Start the servers
```
./server.js
./password_server.js
ROBO_OPS_PASSWORD="<THE_PASSWORD>"./video_stream_server.js
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
    - `8001`: Web/big daddy front
    - `8002`: Web/big daddy right
    - `8003`: Web/big daddy back
    - `8004`: Web/big daddy left
    - `8005`: Web/arm
    - `8006`: Web/scout

