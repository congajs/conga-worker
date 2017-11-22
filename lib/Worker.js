/*
 * This file is part of the conga-worker module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * This is the abstract class that needs to be extended in order to create a worker
 *
 * @author Marc Roulias <marc@lampjunkie.com>
 */
module.exports = class Worker {

    /**
     * @param {String} id the unique worker id
     */
    constructor(id) {
        this.id = id;
    }

    /**
     * Emit an event to the parent process
     *
     * @param  {String} event  the event name
     * @param  {Mixed}  data   the event data
     * @return {void}
     */
    emit(event, data) {
        process.send({
            type: 'worker.event',
            event: event,
            id: this.id,
            status: 'resolve',
            payload: data
        });
    }

}
