const Controller = require('@conga/framework/lib/controller/Controller');

module.exports = class DefaultController extends Controller {

    /**
     * @Route("/fork", methods=["GET"])
     */
    fork(req, res) {

        this.container.get('conga.worker').get('hello.world').hello('marc').then((result) => {
            res.return(result);
        });

    }

    /**
     * @Route("/promise", methods=["GET"])
     */
    promise(req, res) {

        this.container.get('conga.worker').get('hello.world').helloPromise('marc').then((result) => {
            res.return(result);
        });

    }

    /**
     * @Route("/intense", methods=["GET"])
     */
    intense(req, res) {

        this.container.get('conga.worker').get('hello.world').intense().then((result) => {
            res.return(result);
        });

    }

    /**
     * @Route("/worker", methods=["GET"])
     */
    worker(req, res) {

        const prog = [];

        this.container.get('conga.worker')
            .create('demo-bundle:worker/SampleWorker')
            .on('progress', (progress) => {
                prog.push(progress);
            })
            .on('error', (error) => {

            })
            .start({ foo: 'bar' }).then((result) => {
                res.return({
                    progress: prog,
                    result: result
                });
            });
    }

    /**
     * @Route("/worker-error", methods=["GET"])
     */
    workerError(req, res) {

        const prog = [];

        this.container.get('conga.worker')
            .create('demo-bundle:worker/SampleWorker')
            .start({ error: true }).then((result) => {
                res.return({
                    progress: prog,
                    result: result
                });
            }).catch((error) => {
                res.return({ error: 'error' });
            });
    }
}
