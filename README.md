# W&M Robo-Ops Dashboard Server

Backend that powers the [dashboard](http://wm-robo-ops.github.io/dashboard/). Built with [Express.js](http://expressjs.com/) and [Socket.io](http://socket.io/)

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

####`/:vehicle/video/:camera`

Response

```
some video streaming socket
```


## Running Locally

```
git cloen https://github.com/wm-robo-ops/server.git && cd server
npm install
npm start
```
