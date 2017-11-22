/*
 * This file is part of the conga-worker module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */
const path = require('path');
const cp = require('child_process');
const WorkerProxy = require('./WorkerProxy');

/**
 * The Forker provides methods to send a service call to forks and to
 * handle them inside of a fork
 *
 * @author Marc Roulias <marc@lampjunkie.com>
 */
module.exports = class WorkRunner {

    /**
     * @param  {Container} container
     */
    constructor(container, poolManager) {
        this.container = container;
        this.poolManager = poolManager;
    }

    /**
     * Get a proxy for a service in order to run a method in a worker
     *
     * @param  {String} id
     * @return {Proxy}
     */
    get(id) {

        const container = this.container;
        const poolManager = this.poolManager;
        const service = {};

        if (!container.has(id)) {
            throw new Error('unknown service id requested: ' + id);
        }

        return new Proxy(service, {

            get: function(target, prop) {

                return function wrapper() {

                    return poolManager.sendServiceCall({
                        service: id,
                        method: prop,
                        args: Array.prototype.slice.call(arguments)
                    });

                }
            }
        });
    }

    /**
     * Create a WorkerProxy for a namespaced worker class
     *
     * @param  {String} name the namespaced worker class
     * @return {WorkerProxy}
     */
    create(name) {

        // build unique id for this worker
        const id = name + '.' + process.pid + new Date().getTime() + '.' + Math.random();
        return new WorkerProxy(id, name, this.poolManager);

    }
}
