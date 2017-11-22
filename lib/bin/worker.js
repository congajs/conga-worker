/*
 * This file is part of the conga-worker module.
 *
 * (c) Marc Roulias <marc@lampjunkie.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * This is the entry point to start up a forked worker process
 */

// native modules
const path = require('path');

const WorkerKernel = require('../kernel/WorkerKernel');

// 1. set up defaults
let environment = process.env.NODE_ENV;

 // the app name
let app = 'app';

// the project root path
let project = null;

// the bundle paths object when we are in test mode
let bundles = null;

// 2. overwrite defaults with --env arguments if they exist
process.argv.forEach((val) => {

    // environment
    if (val.substring(0, 6) == '--env='){
        environment = val.substring(6);
    }

    // project
    if (val.substring(0, 10) == '--project='){
        project = val.substring(10);
    }

    // app
    if (val.substring(0, 6) == '--app='){
        app = val.substring(6);
    }

    // app
    if (val.substring(0, 10) == '--bundles='){
        bundles = val.substring(10);
    }

});

// 3. fallback to 'development' environment if one wasn't found
if (typeof environment === 'undefined'){
    environment = 'development';
}

// build hash of overwritten default options for kernel
const options = {

};

const kernel = new WorkerKernel(project, app, environment, options);

if (bundles !== null) {
    kernel.addBundlePaths(JSON.parse(bundles));
}

kernel.boot(() => {});
