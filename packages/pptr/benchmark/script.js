import autocannon from "autocannon"

const DURATION = 60

autocannon(
  {
    url: "http://localhost:3000/capture",
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      url: "https://www.example.com",
      captureFormat: "pdf",
      pdfFormat: "a4",
    }),
    connections: 4,
    duration: DURATION,
    timeout: DURATION * 10,
  },
  console.log,
)
