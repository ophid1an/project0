#!/bin/bash
for file in *.png; do convert $file -strip ../../public/images/$file; done
for file in *.jpg; do convert $file -sampling-factor 4:2:0 -strip -quality 82 -interlace JPEG -colorspace RGB ../../public/images/$file; done
