"use strict";

let express = require('express');
let should = require('should');
let request = require('supertest');

let nocache = require('..');

describe('Test nocache middleware', function() {
    it ('should return no-cache headers with use middleware', function(done) {
        var app = express();
        app.use(nocache);
        app.use('/api/foo', function (req, res, next) {
            res.send({foo: 'bar'});
        });

        request(app).get('/api/foo')
            .expect(200)
            .expect('Expires', '-1')
            .expect('Cache-Control', 'no-cache, no-store, must-revalidate')
            .expect('Pragma', 'no-cache')
            .end(done);
    });

    it ('should return no-cache headers with router middleware', function(done) {
        var app = express();
        app.use('/api/bar', nocache, function (req, res, next) {
            res.send({foo: 'bar'});
        });

        request(app).get('/api/bar')
            .expect(200)
            .expect('Expires', '-1')
            .expect('Cache-Control', 'no-cache, no-store, must-revalidate')
            .expect('Pragma', 'no-cache')
            .end(done);
    });
});
