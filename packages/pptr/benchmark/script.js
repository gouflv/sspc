/*
curl -X "POST" "http://localhost:3000/capture" \
     -H 'Content-Type: application/json; charset=utf-8' \
     -d $'{
  "url": "https://www.baidu.com",
  "captureFormat": "pdf",
  "pdfFormat": "a4"
}'
*/

import autocannon from "autocannon"

autocannon(
  {
    url: "http://localhost:3000/capture",
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      url: "https://www.baidu.com",
      captureFormat: "pdf",
      pdfFormat: "a4",
    }),
    connections: 4,
    duration: 60,
  },
  console.log,
)
