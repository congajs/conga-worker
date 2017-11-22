/*
 * This file is part of the conga-worker module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */
const cp = require('child_process');
const os = require('os');
const path = require('path');

/**
 * The PoolManager handles creating a pool of worker processes and interacting with them
 *
 * @author Marc Roulias <marc@lampjunkie.com>
 */
module.exports = class PoolManager {

    /**
     * @param  {Container} container
     */
    constructor(container) {
        this.container = container;
        this.listeners = {};
    }

    /**
     * Start the worker pool or fork listener depending on which
     * kernel context we are currently in
     *
     * @param  {Object}   config
     * @param  {Function} cb
     * @return {void}
     */
    start(config, cb) {

        if (this.container.getParameter('kernel.context') === 'worker') {
            this.startFork(config, cb);
        } else if(this.container.getParameter('kernel.context') === 'http') {
            this.startPool(config, cb);
        } else {
            cb();
        }

    }

    /**
     * Start a pool of forks
     *
     * @param  {Object}   config
     * @param  {Function} cb
     * @return {void}
     */
    startPool(config, cb) {

        this.forks = [];
        this.promises = {};
        this.lastUsed = null;

        let size = 0;

        if (typeof config.pool.size === 'string' && config.pool.size.toLowerCase() === 'auto') {
            size = os.cpus().length;
        } else {
            size = parseInt(config.pool.size);
        }

        let numStarted = 0;

        for (let x = 0; x < size; x++) {

            const command = path.join(__dirname, 'bin', 'worker.js');

            let app;
            if (config.pool.app !== null) {
                app = config.pool.app;
            } else {
                app = this.container.getParameter('kernel.app_name')
            }

            const args = [
                '--project=' + this.container.getParameter('kernel.project_path'),
                '--app=' + app,
                '--env=' + this.container.getParameter('kernel.environment'),
                '--id=' + x
            ];

            if (this.container.getParameter('kernel.environment') === 'test') {
                args.push('--bundles=' + JSON.stringify(this.container.getParameter('bundle.paths')));
            }

            this.container.get('logger').info('[conga-worker] - starting fork: ' + command + ' ' + args.join(' '));

            const fork = cp.fork(command, args, {
                silent: config.silent
            });

            this.forks.push(fork);

            fork.on('message', (message) => {

                this.container.get('logger').debug('[conga-worker] - got message in parent: ' + JSON.stringify(message));

                switch (message.type) {

                    case 'worker.started':

                        numStarted++;

                        if (numStarted === size) {
                            cb();
                            return;
                        }

                    case 'worker.completed':

                        this.handlePromise(message.promise, message.status, message.payload);

                        break;

                    case 'worker.event':

                        this.listeners[message.id][message.event](message.payload);

                        break;

                    case 'service.call':

                        this.handlePromise(message.promise, message.status, message.payload);

                        break;
                }
            });
        }

    }

    /**
     * Send a payload to a fork
     *
     * @param  {Object} payload
     * @return {Promise}
     */
    sendServiceCall(payload) {

        const fork = this.pickNextFork();
        const promise = this.createPromise();

        const message = {
            type: 'service.call',
            promise: promise.id,
            payload: payload
        };

        this.container.get('logger').debug(
            '[conga-worker] - sending message to worker #' + this.lastUsed + ' - ' + JSON.stringify(message)
        );

        fork.send(message);

        return promise.promise;
    }

    /**
     * Get the next fork to use
     *
     * @return {Fork}
     */
    pickNextFork() {

        let index;

        if (this.lastUsed === null) {
            index = 0;
        } else if (this.lastUsed === this.forks.length - 1) {
            index = 0;
        } else {
            index = this.lastUsed + 1;
        }

        this.lastUsed = index;
        return this.forks[index];
    }

    /**
     * Start listening for incoming messages when we are in a fork
     *
     * @param  {Object}   config
     * @param  {Function} cb
     * @return {void}
     */
    startFork(config, cb) {

        process.on('message', (message) => {

            this.container.get('logger').debug('[conga-worker] - got message in fork: ' + JSON.stringify(message));

            switch (message.type) {

                case 'worker':

                    this.handleWorkerMessage(message);

                    break;

                case 'service.call':

                    this.handleServiceCallMessage(message);

                    break;
            }

        });

        cb();
    }

    /**
     * Handle worker messages coming in to a fork
     *
     * @param  {Object} message
     * @return {void}
     */
    handleWorkerMessage(message) {

        switch (message.action) {

            case 'start':

                const WORKER = require(
                    this.container.get('namespace.resolver').resolveWithSubpath(message.class, 'lib') + '.js'
                );

                const args = [
                    'NOTHING',
                    message.id
                ];

                const worker = new (WORKER.bind.apply(WORKER, args));
                const result = worker.start(message.payload);

                result.then((response) => {

                    process.send({
                        type: 'worker.completed',
                        id: message.id,
                        status: 'resolve',
                        payload: response,
                        promise: message.promise
                    });

                }).catch((error) => {
                    process.send({
                        type: 'worker.completed',
                        id: message.id,
                        status: 'reject',
                        payload: error,
                        promise: message.promise
                    });
                });

                break;
        }
    }

    /**
     * Handle service call messages coming in to a fork
     *
     * @param  {Object} message
     * @return {void}
     */
    handleServiceCallMessage(message) {

        const service = this.container.get(message.payload.service);
        const result = service[message.payload.method].apply(service, message.payload.args);

        if (result instanceof Promise) {

            result.then((response) => {

                process.send({
                    type: 'service.call',
                    promise: message.promise,
                    status: 'resolve',
                    payload: response
                });

            }).catch((error) => {

                process.send({
                    type: 'service.call',
                    promise: message.promise,
                    status: 'reject',
                    payload: error
                });
            });

        } else {

            process.send({
                type: 'service.call',
                promise: message.promise,
                status: 'resolve',
                payload: result
            });

        }
    }

    /**
     * Add a listener for a combination of worker name and id
     *
     * @param {String}   name
     * @param {String}   id
     * @param {Function} listener
     */
    addListener(name, id, listener) {

        if (typeof this.listeners[id] === 'undefined') {
            this.listeners[id] = {};
        }

        this.listeners[id][name] = listener;
    }

    /**
     * Create a Promise and id and then keep track of it
     *
     * Response: {
     *    id: '0123131319.123131903138.1231323311231',
     *    promise: Promise
     * }
     *
     * @return {Object}
     */
    createPromise() {

        const id = new Date().getTime() + '.' + Math.random() + '.' + Math.random();

        const p = {};

        const promise = new Promise((resolve, reject) => {
            p.resolve = resolve;
            p.reject = reject;
        });

        this.promises[id] = p;

        return {
            id: id,
            promise: promise
        };
    }

    /**
     * Handle a promise that has been resolved from a worker
     *
     * @param  {String} id
     * @param  {String} status
     * @param  {Mixed}  data
     * @return {void}
     */
    handlePromise(id, status, data) {

        if (typeof this.promises[id] !== 'undefined') {

            if (status === 'resolve') {
                this.promises[id].resolve(data);
            } else {
                this.promises[id].reject(new Error(data));
            }

            delete this.promises[id];
        }
    }
}
