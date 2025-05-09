# Benchmarking PDF Generation

- host: 10.0.28.121

## Case 1

- cpus: 8
- memory: 12 GB
- concurrent: 4

| Stat    | 2.5%    | 50%     | 97.5%   | 99%     | Avg        | Stdev    | Max     |
| ------- | ------- | ------- | ------- | ------- | ---------- | -------- | ------- |
| Latency | 6498 ms | 6584 ms | 6713 ms | 6713 ms | 6587.34 ms | 64.89 ms | 6713 ms |

| Stat      | 1%  | 2.5% | 50% | 97.5%   | Avg    | Stdev   | Min     |
| --------- | --- | ---- | --- | ------- | ------ | ------- | ------- |
| Req/Sec   | 0   | 0    | 0   | 4       | 0.6    | 1.4     | 1       |
| Bytes/Sec | 0 B | 0 B  | 0 B | 4.59 MB | 660 kB | 1.54 MB | 1.06 MB |

## Case 2

- **cpus: 10**
- **memory: 10 GB**
- concurrent: 4

| Stat    | 2.5%    | 50%     | 97.5%   | 99%     | Avg        | Stdev     | Max     |
| ------- | ------- | ------- | ------- | ------- | ---------- | --------- | ------- |
| Latency | 6368 ms | 6507 ms | 8782 ms | 8782 ms | 6902.63 ms | 774.29 ms | 8782 ms |

| Stat      | 1%  | 2.5% | 50% | 97.5%   | Avg    | Stdev   | Min     |
| --------- | --- | ---- | --- | ------- | ------ | ------- | ------- |
| Req/Sec   | 0   | 0    | 0   | 3       | 0.54   | 0.91    | 1       |
| Bytes/Sec | 0 B | 0 B  | 0 B | 3.39 MB | 601 kB | 1.02 MB | 1.12 MB |

## Case 3

- cpus: 10
- memory: 10 GB
- **concurrent: 10**

| Stat    | 2.5%    | 50%     | 97.5%    | 99%      | Avg        | Stdev      | Max      |
| ------- | ------- | ------- | -------- | -------- | ---------- | ---------- | -------- |
| Latency | 6493 ms | 8535 ms | 12648 ms | 12651 ms | 8260.96 ms | 1606.91 ms | 12651 ms |

| Stat      | 1%  | 2.5% | 50%     | 97.5%   | Avg     | Stdev   | Min     |
| --------- | --- | ---- | ------- | ------- | ------- | ------- | ------- |
| Req/Sec   | 0   | 0    | 1       | 4       | 1.12    | 1.3     | 1       |
| Bytes/Sec | 0 B | 0 B  | 1.12 MB | 4.56 MB | 1.27 MB | 1.47 MB | 1.12 MB |

## Case 4

- cpus: 10
- memory: 10 GB
- **concurrent: 20**

| Stat    | 2.5%    | 50%      | 97.5%    | 99%      | Avg         | Stdev      | Max      |
| ------- | ------- | -------- | -------- | -------- | ----------- | ---------- | -------- |
| Latency | 6816 ms | 14555 ms | 18589 ms | 18675 ms | 13772.79 ms | 2535.12 ms | 18675 ms |

| Stat      | 1%  | 2.5% | 50%     | 97.5%  | Avg    | Stdev   | Min     |
| --------- | --- | ---- | ------- | ------ | ------ | ------- | ------- |
| Req/Sec   | 0   | 0    | 1       | 4      | 1.25   | 1.32    | 1       |
| Bytes/Sec | 0 B | 0 B  | 1.12 MB | 4.5 MB | 1.4 MB | 1.47 MB | 1.12 MB |
