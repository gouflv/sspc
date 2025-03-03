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
    connections: 8,
    duration: 60 * 5,
    timeout: 60 * 5,
  },
  console.log,
)
