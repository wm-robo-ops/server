# W&M Robo-Ops Dashboard Server

Backend that powers the [dashboard](http://wm-robo-ops.github.io/dashboard/)

## Dependencies

- [Node.js](https://nodejs.org/en/) version `4` or `5` (node-sqlite does not support v6 yet)
- [sqlite3](https://www.sqlite.org/index.html)

## Setup and Running

#### Installation
```
# sqlite3
sudo apt-get install sqlite3

# node.js
curl -sL https://deb.nodesource.com/setup_4.x | sudo -E bash -
sudo apt-get install -y nodejs

# robo ops server
git clone https://github.com/wm-robo-ops/server.git && cd server
npm install
make
```

#### Initialize the [sqlite3](https://www.sqlite.org/) rock database
```
./init_db.js
```
you may also have to run the following after the database is created:
```
chown 664 robo-ops.db
```

#### Start the servers with logging
```
ROBO_OPS_PASSWORD="<THE_PASSWORD>" nohup ./password_server.js | tee -a password.log
nohup ./server.js | tee -a server.log
nohup ./video_stream_server.js | tee -a video.log
nohup ./dof_stream_server.js | tee -a dof.log
```
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

