const fs = require('fs-extra');
const path = require('path');
const util = require('util');
const request = require('request');
const Kernel = require('@conga/framework/lib/kernel/TestKernel');
const jasmine = require('jasmine');

describe("forker", () => {

    jasmine.DEFAULT_TIMEOUT_INTERVAL = 100000000;

    let kernel;
    let articleId;

    beforeAll((done) => {

        kernel = new Kernel(
            path.join(__dirname, '..', 'spec', 'data', 'projects', 'sample'),
            'app',
            'test',
            {}
        );

        kernel.addBundlePaths({
            '@conga/framework-worker': path.join(__dirname, '..'),
            'demo-bundle': path.join(__dirname, '..', 'spec', 'data', 'projects', 'sample', 'src', 'demo-bundle'),
        });

        kernel.boot(() => {
            done();
        });

    }, 1000000000);

    afterAll(() => {
        kernel.container.get('express.server').close();
    });

    it('should load data from a fork', (done) => {

        request({

            uri: 'http://localhost:5555/fork',
            method: 'GET',
            json: true,
            headers: {
                'content-type': 'application/json'
            }

        }, (error, response, body) => {

            expect(response.statusCode).toEqual(200);
            expect(body.message).toEqual('Hello, marc');

            done();
        });

    });

    it('should load data from a forked promise', (done) => {

        request({

            uri: 'http://localhost:5555/promise',
            method: 'GET',
            json: true,
            headers: {
                'content-type': 'application/json'
            }

        }, (error, response, body) => {

            expect(response.statusCode).toEqual(200);
            expect(body.message).toEqual('Hello, marc from promise');

            done();
        });

    });

    it('should load data from a cpu intensize fork', (done) => {

        request({

            uri: 'http://localhost:5555/intense',
            method: 'GET',
            json: true,
            headers: {
                'content-type': 'application/json'
            }

        }, (error, response, body) => {

            expect(response.statusCode).toEqual(200);
            expect(body.iterations).toEqual(2500000000);

            done();
        });

    }, 1000000000);

    it('should run a worker', (done) => {

        request({

            uri: 'http://localhost:5555/worker',
            method: 'GET',
            json: true,
            headers: {
                'content-type': 'application/json'
            }

        }, (error, response, body) => {

            expect(response.statusCode).toEqual(200);
            expect(body.result.input.foo).toEqual('bar');
            expect(body.progress).toEqual([ 0, 10, 20, 30, 40, 50, 60, 70, 80, 90 ]);

            done();
        });

    });

    it('should handle a worker error', (done) => {

        request({

            uri: 'http://localhost:5555/worker-error',
            method: 'GET',
            json: true,
            headers: {
                'content-type': 'application/json'
            }

        }, (error, response, body) => {

            expect(response.statusCode).toEqual(200);
            expect(body.error).toEqual('error');

            done();
        });

    });
});
