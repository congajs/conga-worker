/*
 * This file is part of the conga-worker module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

const Kernel = require('@conga/framework/lib/kernel/Kernel');

/**
 * The ForkKernel is a kernel context which starts up
 * an application to handle forked processes
 *
 * @author Marc Roulias <marc@lampjunkie.com>
 */
module.exports = class WorkerKernel extends Kernel {

    /**
     * Construct the kernel with project/environment/etc. settings
     *
     * @param  {String} projectRootPath  absolute path to project root
     * @param  {String} app              the app name
     * @param  {String} environment      the environment name
     * @param  {Object} options          hash of override options
     */
    constructor(projectRootPath, app, environment, options) {

        super(projectRootPath, app, environment, options);

        /**
         * The context name
         * @type {String}
         */
        this.context = 'worker';

        /**
         * The kernel events to fire
         * @type {Array}
         */
        this.kernelEvents = [
            'kernel.compile',
            'kernel.boot',
            'kernel.boot_cli',
            'kernel.postboot'
        ];
    }

}
