/*
 * This file is part of the conga-worker module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * The WorkerProxy provides the methods to start a worker and listen to events on it
 *
 * @author Marc Roulias <marc@lampjunkie.com>
 */
module.exports = class WorkerProxy {

    /**
     * @param  {String}      id          the unique worker instance id
     * @param  {String}      name        the namespaced path to worker class
     * @param  {PoolManager} poolManager the pool manager
     */
    constructor(id, name, poolManager) {
        this.id = id;
        this.name = name;
        this.poolManager = poolManager;
    }

    /**
     * Handle events coming back from the worker
     *
     * @param  {String}   event the event name
     * @param  {Function} cb
     * @return {WorkerProxy}
     */
    on(event, cb) {
        this.poolManager.addListener(event, this.id, cb);
        return this;
    }

    /**
     * Start the worker with a data payload
     *
     * @param  {Mixed} payload
     * @return {Promise}
     */
    start(payload) {

        const promise = this.poolManager.createPromise();

        const data = {
            type: 'worker',
            action: 'start',
            id: this.id,
            class: this.name,
            payload: payload,
            promise: promise.id
        };

        const fork = this.poolManager.pickNextFork();

        fork.send(data);

        return promise.promise;

    }

}
