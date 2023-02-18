const resolvePromise = Promise.resolve()

function a() {
    resolvePromise.then(() => {

    })
}

a()

setTimeout(() => {
    function b() {
        resolvePromise.then(() => {
    
        })
    }
})
