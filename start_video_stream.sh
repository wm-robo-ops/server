#!/usr/bin/env bash

ip='http://100.91.29.141'
port='8082'
width=320
height=240

sudo modprobe bcm2835-v412
ffmpeg -s $width'x'$height -f video4linux2 -i /dev/video0 -f mpeg1video -b 800k -r $1 $ip:$port/$width/$height
