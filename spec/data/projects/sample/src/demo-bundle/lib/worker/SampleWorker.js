const Worker = require('../../../../../../../../lib/Worker');

module.exports = class SampleWorker extends Worker {

    start(data) {

        return new Promise((resolve, reject) => {

            if (data.error) {

                reject({ error: 'got error '});

            } else {

                let progress = 0;

                const interval = setInterval(() => {

                    this.emit('progress', progress);
                    progress += 10;

                    if (progress >= 100) {
                        clearInterval(interval);
                        resolve({ input: data });
                    }

                }, 10);
            }

        });

    }
}
