
const autocannon = require("autocannon");

const token = process.env.TEST_TOKEN;

if (!token) {
    console.error("Please provide a test token using TEST_TOKEN.");
    process.exit(1);
}

const test = autocannon({
    url: "http://127.0.0.1:5000/api/documents",
    connections: 5,
    duration: 10,
    headers: {
        Authorization: `Bearer ${token}`
    }
}, (error, result) => {
    if (error) {
        console.error("Load test failed:", error);
        return;
    }

    console.log("\nLOAD TEST RESULTS");
    console.log("-----------------");
    console.log("Requests:", result.requests.total);
    console.log("Average latency:", result.latency.average, "ms");
    console.log("Maximum latency:", result.latency.max, "ms");
    console.log("Throughput:", result.throughput.average, "bytes/second");
    console.log("Non-2xx responses:", result.non2xx);
});

autocannon.track(test);
