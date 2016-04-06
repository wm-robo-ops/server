#!/usr/bin/env bash

./password_server.js &
./server.js &
./video_stream_server.js &
./dof_stream_server.js &
./gps_stream_server.js &
