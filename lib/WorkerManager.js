/*
 * This file is part of the conga-worker module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * The WorkerManager starts up a pool of forks
 *
 * @author Marc Roulias <marc@lampjunkie.com>
 */
module.exports = class WorkerManager {

    /**
     * Start up the pool of forks on kernel boot
     *
     * @param {Object}   event
     * @param {Function} next
     */
    onKernelBoot(event, next) {

        const config = event.container.get('config').get('worker');

        event.container.get('conga.worker.pool.manager').start(config, () => {
            next();
        });

    }

    /**
     * If we are inside of a worker, send a message to the parent
     * to let it know that the worker has finished booting
     *
     * @param {Object}   event
     * @param {Function} next
     */
    onKernelPostBoot(event, next) {

        if (event.container.getParameter('kernel.context') === 'worker') {
            process.send({
                type: 'worker.started'
            });
        }

        next();
    }

}
