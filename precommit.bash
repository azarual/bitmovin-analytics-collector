#!/bin/bash

git diff --name-only --staged | grep *.js$ | xargs ./node_modules/.bin/eslint
