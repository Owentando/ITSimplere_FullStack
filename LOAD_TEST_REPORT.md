# Load Testing Report

## 1. Introduction

This report presents the results of a load test performed on the Real-Time Collaborative Code and Whiteboard Editor backend. The purpose was to evaluate how the authenticated documents API responds to multiple concurrent requests.

## 2. Testing Environment

- Operating System: Windows
- Runtime: Node.js v25.9.0
- Backend: Node.js and Express
- Database: PostgreSQL
- Load testing tool: Autocannon v9.0.0
- Test environment: Local development machine

## 3. Test Configuration

| Setting | Value |
|---|---|
| Endpoint | GET /api/documents |
| Concurrent connections | 5 |
| Test duration | 10 seconds |
| Authentication | Valid JWT token |
| Target address | http://127.0.0.1:5000 |

## 4. Test Results

| Metric | Measured Result |
|---|---:|
| Total requests | 16,820 |
| Average latency | 2.44 ms |
| Maximum latency | 111 ms |
| Average requests per second | 1,682 |
| Average throughput | 16,065,331.2 bytes/second |
| Non-2xx responses | 0 |

## 5. Results Analysis

The backend successfully completed 16,820 requests during the 10-second test.

The average response latency was 2.44 milliseconds, while the maximum recorded latency was 111 milliseconds.

No non-2xx HTTP responses were recorded. This indicates that the tested authenticated API endpoint handled the requests successfully during this test.

These results apply only to the tested local environment and configuration.

## 6. Testing Limitations

The following limitations should be considered:

- The test was performed locally on one development machine.
- Only five concurrent HTTP connections were tested.
- The test focused on the documents REST API.
- WebSocket collaboration performance was not separately benchmarked.
- Distributed deployment and shared pub/sub scaling were not tested.
- The test does not establish production capacity or guarantee performance under larger workloads.
- CRDT/Operational Transformation and complete offline synchronization remain future improvements.

## 7. Conclusion

The local load test demonstrated that the authenticated documents API handled 16,820 requests over approximately 10 seconds, with an average latency of 2.44 milliseconds and no non-2xx responses.

Further testing with more concurrent users, WebSocket workloads, and a production-like environment would be required to evaluate scalability more comprehensively.