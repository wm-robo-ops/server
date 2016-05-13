#!/usr/bin/env bash

./video.sh | tee >(./pi_video.js 133) >(./pi_video.js 151) >(./pi_video.js 142) >(./pi_video.js 121) >(./pi_video.js 92) >(./pi_video.js 200) >/dev/null
