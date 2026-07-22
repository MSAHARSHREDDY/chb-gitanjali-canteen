# Load Testing Your Canteen Application

To test the performance and user capacity of your application under heavy load, you can use popular, industry-standard modern open-source tools. Here are the two most recommended approaches:

---

## Method 1: Using Grafana k6 (Recommended for Realistic User Scripts)

[k6](https://k6.io/) is an elegant, developer-centric tool for performance testing written in Go and scripted in JavaScript.

### 1. Install k6
- **macOS (Homebrew):** `brew install k6`
- **Windows (winget):** `winget install gnu.k6`
- **Linux (Debian/Ubuntu):**
  ```bash
  sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD16C7DC64E3FB64849524731A65ADE84E3C739
  echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
  sudo apt-get update
  sudo apt-get install k6
  ```

### 2. Create a Script (`k6-test.js`)
Create a file named `k6-test.js` to simulate users logging in, viewing menus, and accessing student subscriptions in parallel:

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

// k6 config options
export const options = {
  stages: [
    { duration: '30s', target: 50 },  // Ramp-up to 50 virtual users
    { duration: '1m', target: 50 },   // Stay at 50 users
    { duration: '30s', target: 0 },   // Ramp-down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete under 500ms
  },
};

const BASE_URL = 'http://localhost:3000'; // Or your deployed application URL

export default function () {
  // 1. Visit Home Route
  let resHome = http.get(`${BASE_URL}/`);
  check(resHome, { 'home status is 200': (r) => r.status === 200 });
  sleep(1);

  // 2. Simulate API Call: Check healthy status
  let resHealth = http.get(`${BASE_URL}/api/health`);
  check(resHealth, { 'api status is 200': (r) => r.status === 200 });
  sleep(1);

  // If you have a test token, you can pass it to authorized routes:
  const params = {
    headers: {
      'Content-Type': 'application/json',
      // 'Authorization': 'Bearer YOUR_TEST_JWT_TOKEN'
    },
  };
}
```

### 3. Execute the k6 Load Test
Run the test from your terminal:
```bash
k6 run k6-test.js
```

---

## Method 2: Using Autocannon (Recommended for absolute speed / quick stress testing)

[Autocannon](https://github.com/mcollina/autocannon) is a lightweight, extremely fast light load generator built in Node.js.

### 1. Install Autocannon
You can run it instantly using `npx` or install it globally:
```bash
npm install -g autocannon
```

### 2. Run a Simple Stress Test
Launch a quick stress test targeting 100 concurrent connections over 10 seconds to test high traffic:
```bash
autocannon -c 100 -d 10 http://localhost:3000/
```

### 3. Run customized JSON API tests
Create a payload configuration or run with customized query parameters:
```bash
autocannon -c 50 -d 15 -m GET http://localhost:3000/api/health
```

Both tools generate extensive logs highlighting request latency metrics (mean, p95, max), standard errors, and successful replies, guaranteeing you can correctly optimize and baseline your container's capacity!
