node-nocache
============

[![Build Status](https://travis-ci.org/mingchen/node-nocache.svg?branch=master)](https://travis-ci.org/mingchen/node-nocache)

[![NPM](https://nodei.co/npm/node-nocache.png?downloads=true)](https://nodei.co/npm/node-nocache/)


## Introduction

A node `express` middleware which add no-cache related headers for all the express response to disable caches. 
It is useful for REST API response, add no-cache headers to avoid browsers cache request response.

The following headers are added to response header:

    Cache-Control: no-cache, no-store, must-revalidate
    Expires: -1
    Pragma: no-cache


## Install

    npm install node-nocache


## Usage

    let nocache = require('node-nocache');

    app.use(nocache);

or use you can only add no-cache headers to specific requests with `router`:

    router.all('*', require('node-nocache'));

or

    let nocache = require('node-nocache');

    router.get('/api/foo', nocache, function (req, res, next) {
        ...
    });

Checkout `test/nocache_test.js` for example usages.


## License

MIT

