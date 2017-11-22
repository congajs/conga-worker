module.exports = class HelloWorldService {

    hello(name) {
        return {
            message: `Hello, ${name}`
        }
    }

    helloPromise(name) {
        return Promise.resolve({
            message: `Hello, ${name} from promise`
        })
    }

    intense() {

        let a = 0;
        let scale = 50000;

        for (let x = 0; x < scale; x++) {
            for (let y = 0; y < scale; y++) {
                a++;
            }
        }

        return {
            iterations: a
        };
    }
}
