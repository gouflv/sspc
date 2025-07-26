const autocannon = require("autocannon")

const LOCAL = true

const instance = autocannon({
  url: `http://${LOCAL ? "localhost" : "10.0.28.121"}:3001/jobs/urgent`,
  method: "POST",
  headers: {
    "Content-Type": "application/json; charset=utf-8",
  },
  body: JSON.stringify({
    url: "https://news.baidu.com/",
    captureFormat: "pdf",
    pdfFormat: "a4",
    // pdfCompress: true,
  }),
  connections: 4,
  duration: 60 * 2,
  timeout: 60,
})

autocannon.track(instance, { renderProgressBar: true })

process.once("SIGINT", () => {
  instance.stop()
})
